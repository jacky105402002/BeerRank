create index if not exists idx_beers_status_style on beers(status, style);
create index if not exists idx_reviews_leaderboard_rules
  on reviews(beer_id, visibility, status, beer_confirmation_status, rating);

create or replace view eligible_reviews as
select
  r.*
from reviews r
join beers b on b.id = r.beer_id
where
  b.status = 'confirmed'
  and r.visibility = 'public'
  and r.status = 'published'
  and r.beer_confirmation_status = 'confirmed'
  and r.rating is not null
  and exists (
    select 1
    from review_photos rp
    where rp.review_id = r.id
  );

create or replace view beer_leaderboard as
with review_likes as (
  select
    review_id,
    count(*) filter (where type = 'like')::int as like_count
  from post_reactions
  group by review_id
),
beer_rollup as (
  select
    er.beer_id,
    avg(er.rating)::numeric(3, 2) as average_rating,
    count(er.id)::int as verified_review_count,
    coalesce(sum(coalesce(rl.like_count, 0)), 0)::int as like_count
  from eligible_reviews er
  left join review_likes rl on rl.review_id = er.id
  group by er.beer_id
)
select
  beer_id,
  average_rating,
  verified_review_count,
  like_count,
  (
    average_rating * log(greatest(verified_review_count, 1) + 1)
    + like_count * 0.05
  )::numeric(8, 3) as rank_score
from beer_rollup;
