# Database Notes

Status: L01 schema and migration applied to Zeabur PostgreSQL

Current schema sources:

- `docs/specs/feature-beer-rating-mvp-flow-architecture.md`
- `docs/specs/feature-beer-rating-mvp-architecture.md`

Implemented L01 entities:

- `profiles`
- `breweries`
- `beers`
- `reviews`
- `review_photos`, up to 3 per review with `sort_order = 1` as primary image
- `comments`
- `post_reactions`
- `beer_match_suggestions`
- `schema_migrations`
- `eligible_reviews` view
- `beer_leaderboard` view

Important MVP ranking rule:

- only public, published, confirmed reviews with photos and ratings count toward leaderboard scoring.

Migration commands:

```bash
cd code/apps/api
npm run db:migrate
npm run db:verify
```

Required environment variable:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Migration files:

- `code/apps/api/migrations/001_initial_schema.sql`
- `code/apps/api/migrations/002_seed_demo_data.sql`

Latest L01 verification:

```text
profiles=3
breweries=5
beers=5
reviews=2
review_photos=3
comments=2
post_reactions=3
beer_match_suggestions=1
schema_migrations=2
```
