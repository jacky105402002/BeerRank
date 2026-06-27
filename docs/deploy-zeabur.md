# BeerRank Zeabur Deployment Plan

Status: Draft for first public MVP deployment

GitHub repository:

```text
https://github.com/jacky105402002/BeerRank.git
```

## Services

BeerRank should be deployed as three Zeabur services.

| Service | Type | Source Path | Purpose |
| --- | --- | --- | --- |
| `beerrank-web` | Static frontend | `code/apps/web` | React/Vite web app |
| `beerrank-api` | Node.js backend | `code/apps/api` | NestJS API |
| `beerrank-db` | PostgreSQL / Supabase later | Zeabur DB service or Supabase | MVP persistence |

For the current mock-first stage, the API can run without DB. The DB service becomes necessary when Node 8 Supabase/PostgreSQL integration starts.

## Frontend Service

Recommended Zeabur settings:

```text
Root Directory: code/apps/web
```

Environment variables:

```text
VITE_BEERRANK_API_URL=https://<beerrank-api-domain>/api
```

Expected Zeabur auto-detection:

```text
Provider: static / Vite
Build Command: npm install && npm run build
Output Directory: dist
```

If Zeabur does not show build command fields, this is still okay as long as the root directory is `code/apps/web`.

Important:

Do not set the root directory to `code/apps/web/dist`. The `dist` folder is generated after build and is not committed to GitHub.

The web app is intentionally self-contained for Zeabur subdirectory deployment. It does not depend on `../../packages/shared` at install time.

## API Service

Recommended Zeabur settings:

```text
Root Directory: code/apps/api
```

Environment variables:

```text
PORT=3001
FRONTEND_ORIGINS=https://<beerrank-web-domain>
```

Expected Zeabur auto-detection:

```text
Provider: Node.js
Build Command: npm install && npm run build
Start Command: npm run start:prod
```

If API is detected as `static`, cancel that service and recreate it with root directory `code/apps/api`.

The API app is intentionally self-contained for Zeabur subdirectory deployment. It does not depend on `../../packages/shared` at install time.

Runtime URLs after deploy:

```text
https://<beerrank-api-domain>/api/health
https://<beerrank-api-domain>/api/docs
https://<beerrank-api-domain>/api/docs-json
```

## DB Service

Current MVP direction is still Supabase for Auth, PostgreSQL, and Storage.

Two possible paths:

1. Use Supabase hosted services and only store Supabase env vars in Zeabur API.
2. Use Zeabur PostgreSQL for DB, then add another storage/auth solution.

Recommended for BeerRank MVP:

```text
Use Supabase for Auth + PostgreSQL + Storage.
Use Zeabur for Web + API hosting.
```

Reason:

- Google login is already planned through Supabase Auth.
- Beer photos need object storage.
- Supabase gives DB, Auth, and Storage together, reducing backend work.

## Deployment Order

1. Push repository to GitHub.
2. Create API service first.
3. Verify `/api/health` and `/api/docs`.
4. Create Web service.
5. Set `VITE_BEERRANK_API_URL` to the deployed API URL.
6. Set API `FRONTEND_ORIGINS` to the deployed Web URL.
7. Rebuild both services.
8. Smoke test Feed, Leaderboard, Beer Detail, Review Composer, and AI Match.

## Current Gap Before Real MVP

The deployable demo can use mock API data now.

Before a usable MVP, Node 8 must add:

- Supabase Auth with Google login
- persistent review publishing
- photo upload to Supabase Storage
- comments persistence
- ranking aggregation from public eligible reviews
