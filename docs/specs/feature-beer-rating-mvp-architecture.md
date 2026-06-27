# BeerRank MVP Architecture

Status: Draft for Node 4 review

Last updated: 2026-06-27

Engineering loop node: `Node 4: Architecture`

## Purpose

This document defines BeerRank's MVP technical architecture before scaffolding application code in:

```text
C:\code\BeerRank\code
```

The goal is to support:

- local development on this machine
- VSCode collaboration
- frontend-first UIUX implementation
- API and DB integration after UIUX is stable
- later public deployment on Zeabur

## Inputs

| Input | Source |
| --- | --- |
| Engineering loop | `docs/specs/feature-beer-rating-mvp-engineering-loop.md` |
| Flow contract | `docs/specs/feature-beer-rating-mvp-flow-contract.md` |
| Figma review | `docs/specs/feature-beer-rating-mvp-figma-review.md` |
| Flow/data alignment | `docs/specs/feature-beer-rating-mvp-flow-architecture.md` |

## Architecture Summary

```text
apps/web
  React + TypeScript + Vite
  browser locale detection
  mock data first
  later calls apps/api

apps/api
  NestJS + TypeScript
  REST API
  DTO-first contracts
  mock services first
  later integrates Supabase Auth/Postgres/Storage

Supabase
  Auth: Google login
  PostgreSQL: profiles, beers, reviews, comments, rankings
  Storage: review photos

AI Matching
  mock adapter first
  replaceable provider later
  AI suggests only; user confirmation is final

Deployment
  local first
  Zeabur public MVP later
```

## Code Workspace

Application code root:

```text
C:\code\BeerRank\code
```

Recommended scaffold:

```text
code
├─ apps
│  ├─ web
│  │  ├─ src
│  │  │  ├─ app
│  │  │  ├─ components
│  │  │  ├─ features
│  │  │  ├─ data
│  │  │  ├─ i18n
│  │  │  ├─ lib
│  │  │  └─ styles
│  │  ├─ public
│  │  ├─ package.json
│  │  └─ vite.config.ts
│  └─ api
│     ├─ src
│     │  ├─ auth
│     │  ├─ profiles
│     │  ├─ beers
│     │  ├─ reviews
│     │  ├─ comments
│     │  ├─ leaderboard
│     │  ├─ ai-match
│     │  ├─ media
│     │  └─ common
│     ├─ package.json
│     └─ nest-cli.json
├─ packages
│  └─ shared
│     └─ src
│        ├─ dto
│        ├─ types
│        └─ constants
├─ docker
├─ docker-compose.yml
├─ package.json
└─ README.md
```

## Monorepo Decision

Use npm workspaces for MVP.

Reasons:

- simple enough for a personal project
- works naturally with Vite and NestJS
- avoids early Turborepo/Nx overhead
- easy to open in VSCode

Root package should eventually expose:

```json
{
  "scripts": {
    "dev": "npm run dev --workspaces",
    "dev:web": "npm --workspace apps/web run dev",
    "dev:api": "npm --workspace apps/api run start:dev",
    "build": "npm run build --workspaces",
    "typecheck": "npm run typecheck --workspaces"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

## Ports

| Service | Port | Notes |
| --- | --- | --- |
| Web | `6677` | `6666` is blocked by Chromium as an unsafe port |
| API | `3001` | NestJS local API |
| Supabase local | deferred | hosted Supabase preferred after mock phase |
| Docker services | TBD | define only when real local dependencies are introduced |

## Development Phases

### Phase A: Frontend Mock MVP

Goal:

- Implement Figma canonical flow as a working React app.
- Use mock data and local state.
- No real API dependency.

Includes:

- routes
- app shell
- bilingual locale strings
- Feed
- Review Composer
- AI Match states
- Comments
- Visibility selector
- Multi-photo UI
- Publish success
- Beer Detail
- Leaderboard
- Profile

Does not include:

- Supabase login
- real image upload
- real database writes
- real AI calls

### Phase B: API Mock

Goal:

- Add NestJS API that returns the same shapes as frontend mock data.
- Keep services deterministic and in-memory or file-backed if needed.

Includes:

- DTOs
- controllers
- mock services
- REST endpoints
- validation pipes
- shared types alignment

Does not include:

- Supabase integration
- production auth enforcement
- real storage upload

### Phase C: Supabase Integration

Goal:

- Replace mock persistence with Supabase Auth/Postgres/Storage.

Includes:

- Google login
- JWT validation in NestJS
- database schema/migrations
- storage bucket for review photos
- public/private review rules
- ranking queries

### Phase D: AI Matching Provider

Goal:

- Replace mock AI match adapter with real provider.

Includes:

- image/text matching request
- confidence levels
- reason signals
- audit storage
- fallback behavior

### Phase E: Public MVP

Goal:

- Deploy local MVP publicly.

Target:

- Zeabur for web/API
- Supabase hosted services for Auth/Postgres/Storage

## Frontend Architecture

### Routing

Use `react-router-dom`.

Routes:

| Route | Page |
| --- | --- |
| `/` | redirect to `/feed` |
| `/feed` | `FeedPage` |
| `/review/new` | `ReviewComposerPage` |
| `/review/new/match` | `BeerMatchPage` |
| `/beers/:beerId` | `BeerDetailPage` |
| `/leaderboard` | `LeaderboardPage` |
| `/profile` | `ProfilePage` |

Comments can start as modal/sheet state rather than a URL route.

### State

Use React state/context first.

Recommended contexts:

| Context | Responsibility |
| --- | --- |
| `AuthContext` | current user/session mock, later Supabase session |
| `LocaleContext` | browser language detection and translation strings |
| `ReviewDraftContext` | current review draft across composer/match states |

Do not add Zustand until:

- review draft state becomes hard to reason about
- multiple unrelated pages need shared mutation
- mock/API swap becomes noisy

### Styling

Use plain CSS or CSS Modules first.

Recommended:

- global tokens in `styles/tokens.css`
- app layout in `styles/app.css`
- feature-level CSS Modules for complex page styling

No Tailwind in MVP first pass.

### Localization

Locale detection:

- `zh-TW` when browser language starts with `zh`
- `en` otherwise

Store locale dictionaries in:

```text
apps/web/src/i18n
```

Translation files:

```text
en.ts
zh-TW.ts
```

Scope:

- labels
- buttons
- validation
- trust explanations
- empty/loading/error states

User-generated beer/review/comment content should not be auto-translated in MVP.

### Mock Data

Mock data should live in:

```text
apps/web/src/data/mock
```

Use the shapes defined in:

```text
docs/specs/feature-beer-rating-mvp-flow-contract.md
```

## API Architecture

Use NestJS.

### Modules

| Module | Responsibility |
| --- | --- |
| `AuthModule` | Supabase JWT validation later; mock current user first |
| `ProfilesModule` | current user profile and public profile data |
| `BeersModule` | beer detail, search, create user beer draft |
| `ReviewsModule` | publish/read reviews, public/private eligibility |
| `CommentsModule` | comment thread and one-level replies |
| `LeaderboardModule` | ranking rows and score formula |
| `AiMatchModule` | mock/real Beer candidate suggestions |
| `MediaModule` | photo upload/storage abstraction |

### API Style

- REST first.
- DTO-first.
- Validate all create/update requests.
- Keep API response DTOs close to Flow Contract.
- No GraphQL in MVP.

### API Prefix

Use:

```text
/api
```

Example:

```text
GET /api/feed
GET /api/beers/:beerId
POST /api/reviews
```

### Auth Strategy

Phase A/B:

- mock signed-in/signed-out state
- mock `CurrentUser`

Phase C:

- frontend uses Supabase Auth
- API receives Supabase JWT
- NestJS guard verifies token and maps to profile

Protected write endpoints:

- `POST /api/reviews`
- `POST /api/reviews/:postId/like`
- `DELETE /api/reviews/:postId/like`
- `POST /api/posts/:postId/comments`
- `POST /api/comments/:commentId/like`
- `POST /api/beers`

Public read endpoints:

- `GET /api/feed`
- `GET /api/beers/:beerId`
- `GET /api/beers/search`
- `GET /api/leaderboard`
- `GET /api/posts/:postId/comments`

## Database Architecture

Supabase PostgreSQL after mock phase.

### Tables

| Table | Purpose |
| --- | --- |
| `profiles` | public user profile linked to Supabase auth user |
| `breweries` | brewery records |
| `beers` | beer catalog, including user-created `needs_review` records |
| `beer_posts` | review posts with rating, text, visibility, status |
| `post_images` | up to three images per post; first/primary image marked |
| `post_likes` | post likes |
| `post_comments` | comment thread with one-level replies for MVP |
| `comment_likes` | optional comment likes |
| `beer_match_suggestions` | AI suggestion audit trail |

### Important Columns

`beer_posts` should include:

- `id`
- `user_id`
- `beer_id`
- `rating_overall`
- `review_text`
- `visibility`: `public | private`
- `status`: `published | deleted`
- `created_at`
- `updated_at`
- `deleted_at`

`post_images` should include:

- `id`
- `post_id`
- `storage_path`
- `sort_order`
- `is_primary`
- `alt_text`
- `created_at`

`post_comments` should include:

- `id`
- `post_id`
- `user_id`
- `parent_comment_id`
- `body`
- `created_at`
- `deleted_at`

### Ranking Eligibility Query

A review contributes to rankings only when:

```sql
beer_posts.status = 'published'
AND beer_posts.visibility = 'public'
AND beer_posts.beer_id IS NOT NULL
AND beer_posts.rating_overall IS NOT NULL
AND EXISTS (
  SELECT 1
  FROM post_images
  WHERE post_images.post_id = beer_posts.id
)
```

### Ranking Formula

MVP formula:

```text
average_rating * log10(verified_review_count + 1) + like_count * 0.05
```

Implementation:

- Phase B mock: compute in frontend/API mock data.
- Phase C Supabase: use SQL view first.
- Later: materialized view or job if performance demands it.

## Media Architecture

MVP first code pass:

- mock local image URLs
- no real upload

Supabase phase:

- bucket: `review-photos`
- max three images per post
- first image is primary by `sort_order = 0` and/or `is_primary = true`
- API validates image count and ownership

## AI Matching Architecture

Define adapter boundary:

```ts
interface BeerMatchAdapter {
  suggestCandidates(input: BeerMatchInput): Promise<BeerMatchResponseDto>;
}
```

Mock adapter:

- deterministic high-confidence response
- deterministic low-confidence response
- deterministic no-results response

Real adapter later:

- image + metadata input
- returns candidates, confidence, and reason signals
- never writes final Beer association

Final Beer association belongs to user action.

## Docker / Local Services

Docker is available but not required for the first frontend mock pass.

Recommended sequence:

1. Scaffold web/API without Docker dependency.
2. Add `docker-compose.yml` for API + optional local service simulation.
3. Do not run local Supabase unless hosted Supabase slows iteration or network access becomes a blocker.

Future Docker candidates:

- API container
- optional local Postgres for isolated schema testing
- optional local Supabase stack if needed

## Deployment Architecture

Target public MVP:

- Zeabur for web and API
- Supabase hosted Auth/Postgres/Storage

Deployment assumptions:

- web and API can be separate services
- API receives environment variables for Supabase URL/keys
- frontend receives public Supabase anon key and API base URL
- no production AI key until AI provider phase

## Environment Variables

Frontend:

```text
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

API:

```text
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
AI_PROVIDER=mock
```

Do not commit real keys.

## Architecture Decisions

| Decision | Choice |
| --- | --- |
| Code location | `C:\code\BeerRank\code` |
| Monorepo | npm workspaces |
| Frontend | React + TypeScript + Vite |
| API | NestJS + TypeScript |
| Styling | plain CSS / CSS Modules |
| Routing | `react-router-dom` |
| State | React context/state first |
| Auth | Supabase Auth, Google login |
| DB | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI | mock adapter first, real provider later |
| Web port | `6677` |
| API port | `3001` |
| Public deploy | Zeabur + Supabase |

## Node 4 Exit Gate

Node 4 can be considered ready for Scaffold when:

- code workspace structure is accepted
- npm workspaces accepted
- web/API ports accepted
- frontend-first mock phase accepted
- API mock phase accepted
- Supabase integration is intentionally deferred
- Docker is optional, not blocking first scaffold
- public deployment deferred until local MVP works

Current recommendation:

Proceed to `Node 5: Scaffold` after user confirms this architecture.
