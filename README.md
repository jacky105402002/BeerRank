# BeerRank

BeerRank is a beer review, rating, and leaderboard web app.

The MVP is being built with an engineering loop:

1. Product intent
2. UIUX prototype
3. Flow contract
4. Architecture
5. Scaffold
6. Frontend MVP
7. Mock API contract
8. Supabase integration
9. AI matching
10. Local QA
11. Public MVP deployment

## Repository Layout

```text
code/
  apps/
    web/       React + TypeScript + Vite frontend
    api/       NestJS TypeScript API
  packages/
    shared/    Shared DTOs and types
docs/          Product, architecture, API, and deployment notes
tasks/         Working task notes
```

## Local Development

Frontend:

```bash
cd code
npm run dev:web
```

API:

```bash
cd code
npm run dev:api
```

Local URLs:

- Web: `http://127.0.0.1:6677/`
- API health: `http://127.0.0.1:3001/api/health`
- Swagger: `http://127.0.0.1:3001/api/docs`

## Zeabur Deployment

See:

```text
docs/deploy-zeabur.md
```

Recommended services:

- `beerrank-web`: frontend static service, root directory `code/apps/web`
- `beerrank-api`: NestJS API service, root directory `code/apps/api`
- `beerrank-db`: database/auth/storage service, preferably Supabase for MVP
