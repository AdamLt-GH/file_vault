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

## Check the private Tailscale address

If the NAS Tailscale address is `100.80.40.20`, check that the web container is
reachable from another tailnet device:

```sh
curl --fail http://100.80.40.20:8080/health
```

This plain HTTP check only confirms the private network path. The production
login cookie requires HTTPS, so complete the Tailscale Serve setup below before
signing in.

## Keep the service private

- Do not forward port `8080` on the router.
- Do not enable Tailscale Funnel for File Vault.
- Only approve trusted users and devices in the tailnet.
- Remove old or lost devices from the tailnet.
- Keep the File Vault login enabled even though Tailscale limits network access.

Test again from mobile data or another network after the private HTTPS setup is
finished. The File Vault login page should load while Tailscale is connected and
stop working after the client disconnects.

## Add private HTTPS with Tailscale Serve

Tailscale Serve can put an HTTPS address in front of the local File Vault port.
Traffic stays inside the tailnet and Tailscale handles the certificate.

First find the full MagicDNS name:

```sh
tailscale status
```

It will look similar to `file-vault-nas.example.ts.net`. Update `.env` with that
exact origin and bind the Compose web port to localhost:

```dotenv
WEB_ORIGIN=https://file-vault-nas.example.ts.net
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=8080
```

Recreate the containers, then start Serve in the background:

```sh
docker compose up -d --build api web
sudo tailscale serve --bg http://127.0.0.1:8080
tailscale serve status
```

Open the HTTPS address printed by `tailscale serve status`. The background flag
makes the Serve configuration continue after the terminal closes and return
after Tailscale or the host restarts.

The localhost bind stops other LAN devices from going around the HTTPS address.
Tailscale Serve becomes the only network path to the web container.

To remove the Serve configuration:

```sh
sudo tailscale serve reset
```

After resetting it, change `WEB_BIND_ADDRESS` back to `0.0.0.0` if direct LAN or
Tailscale IP access is still needed.

## Limit who can connect

Tailnet access rules also apply to Tailscale Serve. Limit the NAS or its HTTPS
service to the user, group or devices that should reach File Vault. Keep a
second trusted administrator device available before tightening rules so a bad
rule does not lock out server access.

Tailscale controls which devices can reach the server. File Vault still checks
the administrator email and password and creates its own protected session.
Both controls should remain enabled.

## Troubleshooting

Check the containers and the local web health endpoint first:

```sh
docker compose ps
docker compose logs api
curl --fail http://127.0.0.1:8080/health
```

Then check the private network and Serve state:

```sh
tailscale status
tailscale ping another-device-name
tailscale serve status
```

If login requests are blocked in the browser, confirm that `WEB_ORIGIN` exactly
matches the address in the browser. The scheme, hostname and port all matter.
Recreate the API container after changing it:

```sh
docker compose up -d --force-recreate api
```

Do not use Tailscale Funnel for this setup. Funnel makes a service reachable
from the public internet, while Serve keeps it inside the tailnet.
