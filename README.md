# File Vault

File Vault is a private, self-hosted file manager for one owner. It gives a NAS
or server a clean browser interface without turning the storage into a public
cloud service.

I built it as a full-stack portfolio project to practise more than basic CRUD.
The app streams real file uploads, keeps metadata and file contents in different
storage systems, uses server-side sessions, and includes a production Docker
setup for a NAS.

## What it can do

- Sign in as a bootstrapped single administrator
- Upload several files by picker or drag and drop
- Show combined upload progress without loading full files into API memory
- Create and browse nested folders with breadcrumbs
- Download, rename, move and delete files
- Rename and safely delete empty folders
- Search filenames across the whole vault
- Sort files by name, upload time or size
- Page through folder lists and search results
- Show used bytes, file count, folder count and latest upload time
- Adapt the dashboard, forms and file rows for desktop and phone screens
- Run as a health-checked Docker Compose stack with a NAS bind mount
- Stay privately reachable over HTTPS with Tailscale Serve

## Project goals

The main goal is a useful private file tool that is still small enough to
understand from end to end. The project focuses on:

- clear ownership checks on every protected resource
- streamed file reads and writes
- simple layers between HTTP, business rules, database work and storage
- honest handling of loading, empty and failure states
- a deployment that keeps uploaded bytes outside containers and Git
- documentation that explains both the decisions and the limits

File Vault is a student portfolio project, not a commercial replacement for a
hosted cloud-storage platform. It is designed for one trusted owner on private
infrastructure.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS |
| API | Node.js, Express, TypeScript, Zod, Busboy |
| Data | PostgreSQL, Prisma, connect-pg-simple |
| Security | Argon2id, server-side sessions, Helmet, CORS, login rate limiting |
| Testing | Vitest, Testing Library, Supertest |
| Deployment | Docker, Docker Compose, Nginx, Tailscale |

The repository uses npm workspaces for the API and web app. Root scripts run
builds, type checks and tests across both workspaces.

## How it is put together

```text
Browser
  -> Tailscale Serve or another trusted HTTPS proxy
  -> Nginx serving React and proxying /api
  -> Express API
       -> PostgreSQL for users, sessions, folders and file metadata
       -> mounted filesystem for uploaded file contents
```

Keeping metadata in PostgreSQL makes owner checks, folder relationships, search
and sorting straightforward. Keeping file contents on the filesystem means the
NAS can handle large byte streams without putting them in database rows.

The API is split into routes, controllers, services and a storage-provider
interface. The React app is split by auth, files, folders, search and storage
summary features. TanStack Query owns remote state and refreshes affected lists
after successful changes.

## Technical details I wanted to practise

- Streaming multipart uploads with a configurable size limit
- SHA-256 checksums calculated during the file write
- Extension, reported MIME type and detectable content checks
- Random physical storage keys instead of user filenames as paths
- Server sessions stored in PostgreSQL with secure production cookies
- Owner-scoped database queries even in a single-account app
- Recursive folder relationships with guarded breadcrumb traversal
- Paginated and stable sorting for folder lists and filename search
- Multi-stage production images and health-based Compose startup
- Unit, API and browser workflow tests

## Run it locally

You need Node.js 22 or later, npm and Docker with Docker Compose.

Clone the repository, prepare the environment and install both workspaces:

```sh
git clone https://github.com/AdamLt-GH/file_vault.git
cd file_vault
cp .env.example .env
npm install
```

Replace the placeholder database password, administrator password and session
secret in `.env`. Keep `NODE_ENV=development` and
`WEB_ORIGIN=http://localhost:5173` for local work.

Start PostgreSQL and prepare Prisma:

```sh
npm run db:up
npm run prisma:generate --workspace @file-vault/api
npm run db:deploy --workspace @file-vault/api
```

Start the API:

```sh
npm run dev:api
```

Start the browser app in another terminal:

```sh
npm run dev:web
```

Open `http://localhost:5173`. Vite proxies API requests to
`http://localhost:3000`. The administrator is created only when the database
does not already contain one.

Stop PostgreSQL when finished:

```sh
npm run db:down
```

## Important environment values

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by local API commands |
| `FILEVAULT_ADMIN_EMAIL` | Email used for the first administrator |
| `FILEVAULT_ADMIN_PASSWORD` | Password used only when creating that administrator |
| `SESSION_SECRET` | Signs the session cookie and must be at least 32 characters |
| `SESSION_TTL_HOURS` | Rolling session lifetime from 1 to 168 hours |
| `FILEVAULT_STORAGE_PATH` | Local filesystem path used by the API process |
| `FILEVAULT_DATA_PATH` | Host or NAS path mounted by Docker Compose |
| `MAX_UPLOAD_SIZE_MB` | Maximum size accepted for one uploaded file |
| `WEB_ORIGIN` | Exact browser origin accepted by CORS and cookies |

## Production with Docker Compose

For the included NAS setup, use an HTTPS browser origin and a real host storage
path in `.env`:

```dotenv
NODE_ENV=production
WEB_ORIGIN=https://file-vault-nas.example.ts.net
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=8080
FILEVAULT_DATA_PATH=/volume1/file-vault/files
```

Then build and start the stack:

```sh
docker compose up -d --build
docker compose ps
```

The API container applies pending migrations before startup. Compose waits for
PostgreSQL and the API health endpoint before starting the web container.

Useful production commands:

```sh
docker compose logs -f api
docker compose logs -f web
docker compose down
```

The normal down command keeps both the PostgreSQL volume and the mounted file
directory. Do not use `docker compose down --volumes` unless deleting the
database is intended.

## Checks and tests

Run every project check from the repository root:

```sh
npm run typecheck
npm test
npm run build
```

The test suite currently covers:

- environment and authentication behaviour
- local filesystem storage operations
- upload validation, streaming metadata and cleanup
- file listing, downloads, deletion, rename and move rules
- nested folder creation, breadcrumbs, rename and safe deletion
- storage summary aggregation
- login navigation and protected browser routes
- browser file rows, downloads, sorting, paging, search and deletion

API tests use Supertest and focused Prisma or storage doubles. Browser tests use
Testing Library with mocked HTTP responses. Local filesystem tests write only to
temporary directories and clean them afterwards.

## Documentation

- [Local development](docs/local-development.md) has the complete setup and
  validation flow.
- [NAS deployment](docs/nas-deployment.md) covers mounts, permissions, updates,
  backup and restore.
- [Tailscale remote access](docs/tailscale-access.md) configures private HTTPS
  without a public router port.
- [Security decisions](docs/security.md) lists the threat model, controls,
  deployment boundaries and known limits.
- [Architecture](docs/architecture.md) explains the data model, request flows,
  deployment design and tradeoffs.
- [Project scope](docs/project-scope.md) records the original first-release
  boundaries.

## Current limits

File Vault is intentionally a single-owner project. It does not yet include
multi-factor authentication, password recovery, sharing links, malware
scanning, audit logs, automatic backups or application-level file encryption.
The security document covers these limits in more detail.

The next useful improvements would be password rotation, storage reconciliation
checks, resumable uploads and better automated accessibility coverage. Public
sharing or multiple accounts would need a separate permission model rather than
being added as a small UI change.

## Status

The main first-release scope is complete and the repository is being prepared
for its first stable tag. The application builds and runs locally, includes a
production Compose deployment, and has separate guides for NAS and Tailscale
use.
