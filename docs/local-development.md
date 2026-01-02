# Local development

## Requirements

- Node.js 22 or later
- npm 10 or later
- Docker with Docker Compose

## Environment file

Copy the example file before starting the application:

```sh
cp .env.example .env
```

Replace every placeholder in `.env`. Use a real local password for PostgreSQL,
a strong File Vault administrator password and a random session secret with at
least 32 characters. The `.env` file is ignored by Git and must stay private.

## Install packages

Install both workspaces from the project root:

```sh
npm install
```

## Start PostgreSQL

```sh
npm run db:up
```

The database is only published on the local computer. Check its state with:

```sh
docker compose ps
```

Apply the migrations and generate the Prisma client:

```sh
npm run db:deploy --workspace @file-vault/api
npm run prisma:generate --workspace @file-vault/api
```

## Start File Vault

Run the API in one terminal:

```sh
npm run dev:api
```

Run the frontend in a second terminal:

```sh
npm run dev:web
```

Open `http://localhost:5173`. The administrator account is created only when
the database does not already contain one.

## Project checks

Run these commands before committing a feature:

```sh
npm run typecheck
npm test
npm run build
```

Stop the local services when finished:

```sh
npm run db:down
```
