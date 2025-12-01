# Architecture

File Vault uses a simple three-part setup. The React frontend talks to one
Express API, and the API uses PostgreSQL for metadata while the uploaded files
stay on the NAS filesystem.

```text
Browser
   |
   v
React frontend
   |
   v
Express API
   |       |
   v       v
PostgreSQL NAS filesystem
metadata   uploaded files
```

## Repository layout

```text
apps/
  web/       React frontend
  api/       Express backend
packages/
  shared/    Types and validation shared by both apps
docs/        Project and deployment documentation
storage/     Local development storage, ignored by Git
```

The project will use npm workspaces so both applications can be installed and
checked from the repository root.

## Frontend

The frontend will use React, TypeScript and Vite. React Router will handle the
login and dashboard routes. TanStack Query will handle requests, cached server
data and loading states. Tailwind CSS will be used for the interface.

The browser will not store authentication tokens in local storage. It will use
an HTTP-only session cookie supplied by the API.

## Backend

The backend will be one TypeScript Express application. Routes will pass work
to controllers and services so database and storage logic do not end up in one
large file. Zod will validate environment variables, request bodies and query
parameters.

The API will be available under `/api/v1`. A health endpoint will be available
without authentication, while file, folder and storage endpoints will require
an authenticated session.

## Database

PostgreSQL will store the administrator account, folders and file metadata. It
will not store uploaded file contents.

The main models will be:

- `AdminUser` for the single owner account
- `Folder` for nested folders
- `StoredFile` for names, sizes, checksums and storage keys
- session records used by the server-side session store

Prisma will handle database access and migrations.

## Authentication

There will be no public registration. The first administrator account will be
created from environment variables when the database does not contain an
administrator. The password will be hashed before it is saved and will not be
overwritten during later application starts.

The API will use server-side sessions with HTTP-only cookies. Production
cookies will use the secure setting. Login attempts will be rate limited and
failed logins will return the same general error message.

## File storage

Uploaded files will receive generated storage keys. A filename supplied by the
owner will never be used directly as a physical path. The database will keep
the original display name and other metadata.

Storage access will go through a small provider interface. The first provider
will use the local filesystem, which also works for a NAS directory mounted
inside the API container.

For local development, the storage path can point to an ignored directory in
the repository. In Docker, the host path will be mounted into the API container
and the API will only see the container path.

```yaml
services:
  api:
    volumes:
      - ${FILEVAULT_STORAGE_PATH}:/app/storage
```

Uploads and downloads will use streams so large files are not loaded fully into
memory.

## Deployment

Docker Compose will run the frontend, API and PostgreSQL services. Remote access
will initially use Tailscale so the API does not need to be exposed directly to
the public internet.

