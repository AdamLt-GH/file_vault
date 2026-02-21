# Tailscale remote access

Tailscale can make File Vault reachable from trusted devices without forwarding
a router port or publishing the site to the internet. The NAS and each client
device need to be signed in to the same tailnet.

This guide assumes File Vault is already running on port `8080` as described in
the NAS deployment guide.

## Connect the NAS

Install Tailscale on the NAS host. On a supported Linux NAS or server:

```sh
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Follow the sign-in URL printed by the command. Some NAS systems provide a
Tailscale package in their own app store, which can be used instead.

Check the connection and find the private Tailscale address:

```sh
tailscale status
tailscale ip -4
```

Install Tailscale on the laptop, phone or tablet that will open File Vault, then
sign that device in to the same tailnet.

## Use the private Tailscale address

If the NAS Tailscale address is `100.80.40.20`, set the production browser
origin in `.env`:

```dotenv
WEB_ORIGIN=http://100.80.40.20:8080
WEB_PORT=8080
```

Recreate the API so it reads the changed origin:

```sh
docker compose up -d --build api web
```

Open this address from another device on the tailnet:

```text
http://100.80.40.20:8080
```

MagicDNS can be used instead of the IP address if it is enabled for the
tailnet. In that case, use the same hostname in both `WEB_ORIGIN` and the
browser, for example `http://file-vault-nas:8080`.

Only add one exact origin to `WEB_ORIGIN`. The API checks it before allowing
browser requests with the login cookie.

## Keep the service private

- Do not forward port `8080` on the router.
- Do not enable Tailscale Funnel for File Vault.
- Only approve trusted users and devices in the tailnet.
- Remove old or lost devices from the tailnet.
- Keep the File Vault login enabled even though Tailscale limits network access.

Test from mobile data or another network after connecting the client device to
Tailscale. The File Vault login page should load, while the same address should
not work after Tailscale is disconnected.
