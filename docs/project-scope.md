# Project scope

## Goal

File Vault is a private file storage application for one person. It is meant to
run on a Docker-compatible NAS and be opened from a browser on an authorised
device.

The project is small enough to finish as a university portfolio project while
still showing full-stack development, security, testing and deployment work.

## Main features

File Vault allows the owner to:

- log in and log out
- create and browse nested folders
- upload one or more files
- download, rename and delete files
- search and sort stored files
- view recent uploads and basic storage information
- access the application remotely through Tailscale

## Security goals

The first release includes:

- a single administrator account with a hashed password
- HTTP-only authentication cookies
- protected frontend and backend routes
- rate limiting for login attempts
- request validation with Zod
- generated storage keys and path traversal protection
- configurable file size and file type checks
- safe error responses in production
- environment variables for credentials and deployment settings

Real credentials, uploaded files, database backups, private NAS addresses,
session secrets and certificates must never be committed.

## Not included

The first version will not include:

- public registration or multiple accounts
- public file sharing
- team features or file collaboration
- payment features
- desktop or mobile applications
- file version history
- two-factor authentication
- resumable uploads
- S3 storage
- microservices or Kubernetes

These features would make the project much larger without helping its main
goal.

## Development milestones

1. Set up the monorepo, database, API, frontend and authentication.
2. Add filesystem storage, uploads, downloads and file metadata.
3. Add nested folders, breadcrumbs, renaming and moving.
4. Add multiple uploads, progress, search, sorting and storage summaries.
5. Finish Docker deployment, NAS instructions, security notes and the README.

All five milestones are complete for the first release. Each workspace passes
linting, TypeScript checks, automated tests and a production build.
