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

## Data model

```mermaid
erDiagram
    AdminUser ||--o{ Folder : owns
    AdminUser ||--o{ StoredFile : owns
    Folder ||--o{ Folder : contains
    Folder ||--o{ StoredFile : contains

    AdminUser {
        uuid id PK
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    Folder {
        uuid id PK
        string name
        uuid parentFolderId FK
        uuid ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    StoredFile {
        uuid id PK
        string originalName
        string storageKey UK
        string mimeType
        string extension
        bigint sizeBytes
        string checksum
        uuid folderId FK
        uuid ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    UserSession {
        string sid PK
        json sess
        datetime expire
    }
```

Folders use a self-relation for nesting. A null `parentFolderId` means the
folder is at the root. A file also uses a nullable folder ID, so moving it to the
root only updates metadata and does not move physical bytes.

The folder service checks for duplicate names under the same parent, refuses to
delete non-empty folders and walks parent IDs to build breadcrumbs. The walk
tracks visited IDs and has a depth limit so bad data cannot cause an endless
cycle.

Stored files keep a SHA-256 checksum and the metadata needed for display,
search, sorting and downloads. `sizeBytes` is a PostgreSQL bigint and is changed
to a JSON-safe number by API controllers.

Session rows use the table shape expected by `connect-pg-simple`. They are not
linked to `AdminUser` with a foreign key because the session library owns the
JSON payload and expiry process.

## Filesystem storage

The API depends on a `StorageProvider` interface with `save`, `open`, `delete`
and `exists` operations. `LocalFilesystemStorage` is the current implementation
and works with a normal local directory or a NAS directory mounted into the
container.

Physical files are stored under:

```text
FILEVAULT_STORAGE_PATH/files/<random UUID storage key>
```

The storage provider only accepts UUID-shaped keys. Display names never enter
this path. A write first goes to a unique temporary name and is renamed to its
final key after the stream completes. This stops an interrupted upload from
looking like a complete stored file.

## Upload flow

```mermaid
sequenceDiagram
    participant Browser
    participant API
    participant Filesystem
    participant PostgreSQL

    Browser->>API: multipart upload stream
    API->>API: validate folder, size, name and extension
    API->>Filesystem: stream to temporary file
    API->>API: calculate checksum while streaming
    Filesystem-->>API: saved file
    API->>API: inspect detectable content type
    API->>PostgreSQL: create StoredFile metadata
    PostgreSQL-->>API: stored record
    API-->>Browser: 201 with file metadata
```

If content validation or metadata creation fails, the API removes the staged
file. Multiple browser uploads currently run one after another so each file can
report its part of the total progress without holding all contents in memory.

## Download and deletion flow

A download first finds a file by both file ID and session owner ID. The API then
opens the random storage key and pipes it to the response. Response headers use
the original filename and saved MIME type.

Deletion checks the same ownership rule. Metadata deletion and the storage
provider call are coordinated inside a Prisma transaction. The database can
roll back its deletion if the filesystem call fails.

A relational database transaction cannot fully roll back a filesystem change.
If the physical delete succeeds and the database commit later fails, manual
repair may be needed. Backups and operational checks are still required around
important data.

Rename and move operations only update metadata. Renaming validates the new
extension against the saved MIME type. Moving checks that the destination
folder belongs to the same owner and that the target folder does not already
contain a file with the same display name.

## Listing, search and summaries

Folder file lists are paginated and can sort by upload time, name or size.
Filename search is case-insensitive, owner-scoped and paginated across the whole
vault. Stable ID ordering is used after the selected sort field so page results
do not jump when two files have the same value.

The storage summary uses database aggregates for file count, folder count,
latest upload time and total bytes. It reports metadata totals rather than
scanning the filesystem on every dashboard load.

## Authentication flow

```mermaid
sequenceDiagram
    participant Browser
    participant API
    participant PostgreSQL

    Browser->>API: POST /auth/login with email and password
    API->>PostgreSQL: find administrator by email
    PostgreSQL-->>API: password hash
    API->>API: verify Argon2id hash
    API->>PostgreSQL: save server-side session
    API-->>Browser: user JSON and HTTP-only cookie
    Browser->>API: protected request with session cookie
    API->>PostgreSQL: load session
    API-->>Browser: owner-scoped response
```

There is no registration route. On first startup, the API creates one
administrator from environment values if the database has no administrator.
Later restarts leave that account unchanged.

The browser asks `/auth/session` for the current user. Signed-out routes send an
active session to the dashboard, while protected routes send a missing session
to login. The browser stores no bearer token or password.

## Browser cache rules

TanStack Query keys follow the resource being displayed:

- session queries use one shared authentication key
- file lists include the current folder and list options
- folder lists include the current parent folder
- folder trees and breadcrumbs have separate keys
- searches include text and page number
- storage totals use a single summary key

Mutation success handlers invalidate the smallest useful key prefix. For
example, a file upload refreshes the current folder and storage summary. Moving
a file refreshes its current list. Creating or deleting a folder refreshes its
parent and the summary.

The server remains the source of truth. The current interface does not use
optimistic file or folder changes because a storage or database operation can
still fail after the button is pressed.

## Production deployment

```mermaid
flowchart TB
    Tailnet[Tailscale client] --> Serve[Tailscale Serve HTTPS]
    Serve -->|localhost 8080| Nginx[Nginx web container]
    Nginx -->|private network| API[Node API container]
    API --> DB[(PostgreSQL volume)]
    API --> NAS[(Host or NAS bind mount)]
```

Compose starts services by health:

1. PostgreSQL accepts connections.
2. The API entrypoint applies pending Prisma migrations.
3. The API connects, creates the first administrator if needed and serves its
   health route.
4. Nginx starts after the API becomes healthy.

The API image builds TypeScript in one stage and runs compiled JavaScript in a
smaller production stage. The web image builds Vite assets and copies them into
Nginx. Nginx handles React route fallback, long-lived asset caching and streamed
API proxying.

PostgreSQL uses a named Docker volume. File contents use a bind mount because a
NAS path must stay visible and manageable outside Docker. This also keeps large
file data out of container layers and PostgreSQL backups.

## Main design choices

### One API application

Authentication, metadata and storage operations live in one Express service.
This is easier to understand and deploy than separate services for a
single-owner portfolio project. The service boundaries in the code still keep
storage and database rules replaceable.

### Database metadata and filesystem bytes

PostgreSQL is good at relationships, ownership, search and sorting. A filesystem
or NAS is better suited to large byte streams. Splitting them keeps both jobs
simple, but it means backups and consistency checks must cover two data stores.

### Server-side sessions

Server sessions allow immediate logout and avoid putting account claims in a
browser-managed token. They require a shared persistent session store, which is
why PostgreSQL is also used by `express-session`.

### Sequential multi-file uploads

The browser uploads selected files one at a time. This gives simple combined
progress and avoids several large concurrent streams overwhelming a small NAS.
The tradeoff is lower throughput when many small files are selected.

### No destructive folder cascade

Folders must be empty before deletion. This adds steps when removing a large
tree, but it makes an accidental folder click unable to erase all nested files.

### Private access first

The production design uses private HTTPS through Tailscale rather than public
sharing. This matches the single-owner goal and reduces exposed surface area.
It also means every client needs tailnet access before it can reach File Vault.

## Failure handling

The API exits when startup validation, database connection or administrator
bootstrap fails. Compose restarts it and health checks stop Nginx from treating
an unhealthy API as ready.

At request time, expected validation and conflict cases use specific status
codes. Unexpected errors reach the shared error handler. The frontend keeps
loading, empty and error states separate and offers retries for dashboard reads.

Current observability is intentionally small: container logs and health routes.
A larger deployment could add structured logs, metrics, storage reconciliation
and alerts without changing the browser API shape.

## Extension points

The clearest future extension points are:

- another `StorageProvider` for S3-compatible or remote object storage
- account settings for password rotation and multi-factor authentication
- background jobs for malware scanning and storage reconciliation
- audit records for login and file actions
- resumable or chunked uploads for unstable connections
- shared folders or links with a separate permission model

These features are outside the first stable single-owner release and would need
new security and data-consistency decisions before implementation.
