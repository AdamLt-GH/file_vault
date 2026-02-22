# Architecture

File Vault is a TypeScript monorepo with a React browser app, an Express API,
PostgreSQL metadata and filesystem-backed file contents. Docker Compose joins
the production services and mounts a host or NAS directory into the API.

## System overview

```mermaid
flowchart LR
    Client[Browser] -->|HTTPS| Access[Tailscale Serve or trusted proxy]
    Access --> Web[Nginx and React app]
    Web -->|/api requests| Api[Express API]
    Api --> Database[(PostgreSQL)]
    Api --> Storage[(NAS file mount)]
```

The web and API use the same public origin in production. Nginx serves the React
assets and proxies `/api` requests to Express over the private Compose network.
This keeps cookie and CORS handling simple and leaves the API port unpublished.

PostgreSQL stores accounts, sessions, folders and file metadata. Uploaded bytes
go to the configured filesystem mount instead of the database.

## Repository layout

```text
file_vault/
├── apps/
│   ├── api/
│   │   ├── prisma/       database schema and migrations
│   │   ├── src/          Express application code
│   │   └── tests/        API and storage tests
│   └── web/
│       ├── src/          React application code
│       └── tests/        browser workflow tests
├── docs/                 setup, deployment and design notes
├── docker-compose.yml    production services and local database
├── package.json          npm workspace scripts
└── tsconfig.base.json    shared TypeScript rules
```

The root npm workspace runs commands across both applications. Each app keeps
its own runtime dependencies, build command and tests.

## Browser application

The React app is organised by feature:

- `features/auth` owns login, logout, session queries and route guards.
- `features/files` owns file requests, uploads, lists and file actions.
- `features/folders` owns folder navigation, breadcrumbs and folder actions.
- `features/search` owns global filename search and result paging.
- `features/storage` owns the storage summary query and dashboard cards.
- `components` contains small shared states and layout pieces.
- `pages` combines features into complete routes.

React Router maps `/login`, `/dashboard` and nested folder dashboard URLs. Route
guards fetch the current session before showing a protected page. TanStack Query
owns server state and invalidates the affected file, folder or summary query
after successful changes.

The browser does not contain storage paths or database IDs that grant access by
themselves. It asks the API for every protected operation and the API checks the
session and owner.

## API application

The Express code follows a small layered structure:

```text
route -> authentication middleware -> controller -> service -> Prisma or storage
```

- Routes define HTTP methods and attach authentication.
- Controllers validate request data and turn service results into HTTP responses.
- Services hold file, folder, authentication and summary rules.
- Prisma is the metadata and session database client.
- The storage provider interface owns file byte reads and writes.
- Error middleware gives clients a consistent response for unexpected failures.

`createApp` builds the Express application from validated environment values.
`server.ts` handles database connection, first administrator creation, HTTP
startup and graceful shutdown.

## Request flow

A normal protected request follows these steps:

1. The browser sends the `filevault.sid` cookie with an `/api/v1` request.
2. Express loads that session from PostgreSQL.
3. Authentication middleware rejects the request if no user ID is present.
4. The controller checks params, query values or JSON with Zod.
5. A service runs the owner-scoped database or filesystem operation.
6. The controller returns JSON, an empty success response or a download stream.
7. TanStack Query refreshes affected dashboard data after a browser mutation.

The health route is the one deliberate public API route. Compose uses it to
decide when the API is ready before starting the web container.
