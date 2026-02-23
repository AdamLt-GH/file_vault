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

## Local setup

1. Install Node.js 22, npm and Docker.
2. Copy `.env.example` to `.env` and replace every placeholder value.
3. Install the workspaces with `npm install`.
4. Start PostgreSQL with `npm run db:up`.
5. Apply migrations with `npm run db:migrate --workspace @file-vault/api`.
6. Start the API with `npm run dev:api`.
7. Start the frontend in another terminal with `npm run dev:web`.

The frontend opens at `http://localhost:5173` and proxies API requests to
`http://localhost:3000`.

See [local development](docs/local-development.md) for the complete setup and
validation commands.

See [NAS deployment](docs/nas-deployment.md) to run the production Compose stack
with files stored on a NAS mount.

See [Tailscale remote access](docs/tailscale-access.md) to reach the vault from
trusted devices without opening a public router port.

See [security decisions](docs/security.md) for the threat model, implemented
controls, deployment boundaries and known limits.

See [architecture](docs/architecture.md) for the system layout, data model,
request flows, deployment design and tradeoffs.
