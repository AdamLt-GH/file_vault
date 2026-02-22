# File Vault

File Vault is a private, self-hosted file storage application designed for a single owner (me or you). It will provide secure browser access to files stored on a mounted NAS directory.

The project is currently under development.

## Planned stack

- React, TypeScript, Vite and Tailwind CSS
- Node.js, TypeScript and Express
- PostgreSQL and Prisma
- Docker and Docker Compose

File Vault is a student portfolio project, not a commercial replacement for a hosted cloud-storage platform so clone or use at your own risk.

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
