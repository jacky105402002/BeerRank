# Architecture Notes

## Status
Node 4 draft created. See the current MVP architecture spec.

Current architecture spec:

- `docs/specs/feature-beer-rating-mvp-architecture.md`

## Recommended MVP Stack
- Frontend: React + TypeScript + Vite.
- API: NestJS + TypeScript.
- Auth / database / storage: Supabase.
- Database: PostgreSQL.
- Deployment: local first, Zeabur public MVP later, Supabase hosted services for backend primitives.

## Rationale
BeerRank needs third-party auth, relational data, image storage, and simple ranking queries. Supabase keeps the MVP small while preserving a PostgreSQL data model that can later move to a custom backend if needed.

## Initial Modules
- Auth: third-party login and session handling.
- Profiles: public display name and avatar.
- Beers: normalized beer records.
- AI Matching: image + metadata assisted Beer candidate matching.
- Posts: up to 3 photos, rating, note, public/private visibility, and ownership.
- Comments: comment thread with one-level replies for MVP.
- Reactions: likes on posts and optionally comments.
- Rankings: derived beer score views.

## Flow / Architecture Contract
See `docs/specs/feature-beer-rating-mvp-flow-architecture.md`.

The key boundary is:
- AI Matching suggests Beer candidates.
- User confirmation resolves the Beer association.
- Posts owns publication.
- Rankings aggregate only published posts under canonical Beer records.
