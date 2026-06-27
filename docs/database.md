# Database Notes

Status: Draft placeholder. To be completed by the data-modeler phase.

Current schema sources:

- `docs/specs/feature-beer-rating-mvp-flow-architecture.md`
- `docs/specs/feature-beer-rating-mvp-architecture.md`

Expected entities:
- users / auth identities.
- profiles.
- beers.
- breweries.
- beer_posts.
- post_images, up to 3 per post with primary image.
- post_likes.
- post_comments.
- comment_likes.
- beer_match_suggestions.
- beer_ranking_stats or leaderboard view.

Important MVP ranking rule:

- only public, published, confirmed reviews with photos and ratings count toward leaderboard scoring.

Draft schema and indexing notes:
- `docs/specs/feature-beer-rating-mvp-flow-architecture.md`
