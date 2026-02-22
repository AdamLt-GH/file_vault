# NAS deployment

This guide runs File Vault with Docker Compose and stores uploaded files in a
directory on the NAS. PostgreSQL stays in its own Docker volume.

## Before starting

The NAS needs:

- Docker Engine with the Compose plugin
- Git
- a folder reserved for File Vault files
- enough free space for the files and database backups

The API container runs as user ID `1000`. Make sure that user can read and write
the storage directory. For example:

```sh
sudo mkdir -p /volume1/file-vault/files
sudo chown -R 1000:1000 /volume1/file-vault/files
sudo chmod 750 /volume1/file-vault/files
```

The exact NAS path can be different. Use the real path in
`FILEVAULT_DATA_PATH` below.

## Configure the server

Clone the repository and create the environment file:

```sh
git clone https://github.com/AdamLt-GH/file_vault.git
cd file_vault
cp .env.example .env
```

Set these values in `.env`:

```dotenv
NODE_ENV=production
WEB_ORIGIN=https://file-vault-nas.example.ts.net
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=8080

POSTGRES_DB=filevault
POSTGRES_USER=filevault
POSTGRES_PASSWORD=use-a-long-random-database-password

FILEVAULT_ADMIN_EMAIL=you@example.com
FILEVAULT_ADMIN_PASSWORD=use-a-long-unique-account-password
SESSION_SECRET=use-at-least-32-random-characters-here
SESSION_TTL_HOURS=24

FILEVAULT_DATA_PATH=/volume1/file-vault/files
MAX_UPLOAD_SIZE_MB=1000
```

Replace the example web origin with the HTTPS address that will be used in the
browser. The production login cookie requires HTTPS. The Tailscale guide shows
the included private HTTPS option. An existing trusted HTTPS reverse proxy can
also forward to port `8080`.

Keep `.env` private because it contains the database, account and session
secrets.

## Start File Vault

Build and start the stack:

```sh
docker compose up -d --build
docker compose ps
```

The database starts first. The API then applies pending migrations and creates
the administrator if it does not exist. The web container starts after the API
health check passes.

Finish the HTTPS setup, open the address from `WEB_ORIGIN`, and sign in with the
administrator details from `.env`.

Useful checks:

```sh
docker compose logs api
docker compose logs web
docker compose logs database
curl --fail http://127.0.0.1:8080/health
```

## Update the deployment

Pull the latest code and rebuild the containers:

```sh
git pull --ff-only
docker compose up -d --build
docker image prune
```

Check `docker compose ps` and the API logs after each update. Database
migrations run automatically when the new API container starts.

## Back up the vault

Back up both the file directory and PostgreSQL. They belong to the same vault,
so keep backups from the same point in time.

Create a database dump:

```sh
mkdir -p backups
docker compose exec -T database pg_dump -U filevault -d filevault > backups/filevault.sql
```

Use the NAS backup tool to copy `/volume1/file-vault/files` to another device or
backup target. A RAID array helps with drive failure but is not a separate
backup.

Test restores somewhere safe before depending on a backup. A basic restore uses
an empty database and the saved SQL file:

```sh
docker compose exec -T database psql -U filevault -d filevault < backups/filevault.sql
```

Restore the matching file directory before starting the API again.

## Stop or remove containers

Stop the application without deleting its data:

```sh
docker compose down
```

Do not add `--volumes` unless the PostgreSQL data is meant to be deleted. The
uploaded files are stored at `FILEVAULT_DATA_PATH` and are not removed by the
normal `docker compose down` command.
