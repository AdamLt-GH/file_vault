# Release checklist

Use this list before tagging a stable File Vault release.

## Repository checks

Run from the project root:

```sh
npm ci
npm run prisma:generate --workspace @file-vault/api
npm run lint
npm run typecheck
npm test
npm run build
```

Confirm that:

- the worktree contains only the intended release changes
- `.env`, stored files, database data and backups are not tracked
- package versions match across the root, API, web and lockfile
- the changelog has the release version and date
- README commands and documentation links work

## Container checks

Run these on a host with Docker Engine available:

```sh
docker compose build
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:8080/health
```

Check that PostgreSQL becomes healthy first, the API applies migrations, and the
web container becomes healthy last. Inspect logs if any service does not settle:

```sh
docker compose logs database
docker compose logs api
docker compose logs web
```

## Manual workflow checks

Use a temporary file and folder to check:

1. Login and logout.
2. Create a nested folder.
3. Upload one file and several files.
4. Confirm upload progress and storage totals change.
5. Search for an uploaded filename.
6. Sort and page through file results.
7. Download and compare a file.
8. Rename and move the file.
9. Delete the file, then delete its empty folders.
10. Confirm a signed-out browser cannot open the dashboard or download URL.

## Deployment checks

- Confirm the production address uses HTTPS.
- Confirm the web port is bound only where intended.
- Confirm router forwarding and Tailscale Funnel are disabled.
- Confirm the API container user can write the mounted storage directory.
- Create a PostgreSQL dump and a matching file-directory backup.
- Test a restore away from the live storage location.

## Tagging

After every required check passes:

```sh
git tag -a v1.0.0 -m "File Vault 1.0.0"
git push origin v1.0.0
```
