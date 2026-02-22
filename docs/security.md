# Security decisions

File Vault is a single-owner storage application meant to run on a private
server or NAS. The security design focuses on one administrator, private network
access and keeping uploaded files outside the public web root.

This document explains the controls that are in the project and the limits that
still matter when deploying it.

## Threat model

The app is designed to reduce these risks:

- an unauthenticated visitor listing, downloading or changing files
- one request guessing another owner's file or folder ID
- password guessing against the login route
- uploaded filenames escaping the configured storage directory
- unsupported or disguised file types being accepted without checks
- application secrets or stored files being committed to Git

The main expected deployment is a trusted NAS reached over a LAN or a private
Tailscale network. It is not designed as a public multi-user cloud service.

## Administrator account

File Vault creates one administrator when the API first starts against an empty
database. The email and starting password come from environment variables. The
password is hashed with Argon2id before it is saved, and the original password
is not stored in PostgreSQL.

Later restarts do not replace the existing administrator. Changing
`FILEVAULT_ADMIN_PASSWORD` after the first startup therefore does not change the
saved login by itself.

The login route:

- normalises the email before checking it
- returns the same general message for a wrong email or password
- allows five failed attempts per 15-minute window
- does not count successful requests against the failed-attempt limit

## Sessions

Sessions use a random ID in the browser and store session data in PostgreSQL.
The cookie is:

- HTTP-only so browser scripts cannot read it
- `SameSite=Lax` to reduce cross-site request risks
- marked secure in production so it is only sent over HTTPS
- renewed while the owner remains active
- limited by `SESSION_TTL_HOURS`, with a maximum accepted value of seven days

Logging out destroys the server-side session and clears the cookie. The session
secret must be at least 32 characters and should be a long random value that is
not reused elsewhere.

## Authorisation and ownership

Every file, folder, search and storage-summary route requires an authenticated
session. File and folder database queries include the current owner's ID instead
of trusting an ID supplied by the browser.

This ownership check is kept even though the current product has one account. It
prevents an object ID from becoming the only check around a stored file and
makes the boundary clear if account support changes later.

## Upload handling

Uploads are streamed instead of being held completely in API memory. The API:

- applies a configurable maximum upload size
- rejects empty, oversized and path-like filenames
- allows only listed extensions and matching MIME types
- checks detectable file contents against the extension after storage
- assigns a random storage key instead of using the original filename as a path
- calculates a SHA-256 checksum while streaming the file
- removes a staged file when validation or metadata creation fails

Original filenames remain metadata for display and downloads. They do not
control the physical path on disk.

File type checks lower accidental risk but they are not malware scanning. A
supported document or archive can still contain unsafe content and should be
handled carefully after download.

## HTTP and API defaults

The API removes the Express identification header and uses Helmet for common
security headers. CORS accepts one configured browser origin with credentials.
JSON request bodies are limited to 1 MB, and route inputs are checked with Zod
before database or storage work begins.

Errors use general client messages. Unexpected errors are handled by the API
error middleware instead of returning stack traces as normal JSON responses.
