# Changelog

All notable changes to File Vault are recorded here.

## 1.0.0 - 2026-02-25

### Added

- Single-administrator login with PostgreSQL-backed sessions
- Streamed uploads with size, filename, extension, MIME and content checks
- SHA-256 checksums and random physical storage keys
- File listing, download, rename, move and delete actions
- Nested folders with breadcrumbs, rename and guarded deletion
- Multiple drag-and-drop uploads with combined progress
- Global filename search with pagination
- File sorting and paginated folder lists
- Storage totals for used bytes, files, folders and latest upload
- Responsive dashboard layouts and retryable error states
- API, storage and browser workflow tests

### Security

- Argon2id password hashing
- Owner-scoped file and folder queries
- HTTP-only, same-site and secure production cookies
- Login rate limiting and general failed-login messages
- Helmet headers, exact CORS origin and validated environment values
- Private HTTPS deployment through Tailscale Serve

### Deployment

- Multi-stage API and web container images
- Nginx static serving and streamed API proxying
- Health-checked Docker Compose startup
- PostgreSQL volume and configurable host or NAS file mount
- Automatic Prisma migrations when the API container starts

### Documentation

- Local development guide
- NAS deployment, update, backup and restore guide
- Tailscale private-access guide
- Security decisions and known limits
- Architecture, data flow and tradeoff notes
- Full portfolio README
