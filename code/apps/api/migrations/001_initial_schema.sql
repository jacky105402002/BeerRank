create table if not exists profiles (
  id text primary key,
  auth_provider text,
  auth_provider_user_id text unique,
  display_name text not null,
  avatar_url text not null,
  bio text,
  top_style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists breweries (
  id text primary key,
  name text not null unique,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists beers (
  id text primary key,
  brewery_id text not null references breweries(id),
  name text not null,
  style text not null,
  abv numeric(4, 1),
  image_url text,
  status text not null default 'confirmed',
  created_by_profile_id text references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brewery_id, name)
);

create table if not exists reviews (
  id text primary key,
  author_profile_id text not null references profiles(id),
  beer_id text not null references beers(id),
  rating numeric(2, 1) not null check (rating >= 0 and rating <= 5),
  review_text text not null default '',
  visibility text not null check (visibility in ('public', 'private')),
  status text not null default 'published' check (status in ('draft', 'published', 'deleted')),
  beer_confirmation_status text not null default 'confirmed' check (beer_confirmation_status in ('unconfirmed', 'ai_suggested', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_photos (
  id text primary key,
  review_id text not null references reviews(id) on delete cascade,
  url text not null,
  sort_order int not null check (sort_order between 1 and 3),
  created_at timestamptz not null default now(),
  unique (review_id, sort_order)
);

create table if not exists comments (
  id text primary key,
  review_id text not null references reviews(id) on delete cascade,
  author_profile_id text not null references profiles(id),
  parent_comment_id text references comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists post_reactions (
  id text primary key,
  review_id text not null references reviews(id) on delete cascade,
  profile_id text not null references profiles(id),
  type text not null check (type in ('like', 'save')),
  created_at timestamptz not null default now(),
  unique (review_id, profile_id, type)
);

create table if not exists beer_match_suggestions (
  id text primary key,
  review_id text references reviews(id) on delete cascade,
  profile_id text references profiles(id),
  beer_id text references beers(id),
  provider text not null default 'mock',
  status text not null default 'suggested' check (status in ('suggested', 'accepted', 'rejected', 'manual_search', 'new_beer_created')),
  confidence_score numeric(4, 3) not null check (confidence_score >= 0 and confidence_score <= 1),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low', 'none')),
  reasons jsonb not null default '[]'::jsonb,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_beers_style on beers(style);
create index if not exists idx_reviews_beer_id on reviews(beer_id);
create index if not exists idx_reviews_author_profile_id on reviews(author_profile_id);
create index if not exists idx_reviews_public_published on reviews(beer_id, created_at desc)
  where visibility = 'public' and status = 'published' and beer_confirmation_status = 'confirmed';
create index if not exists idx_review_photos_review_id on review_photos(review_id, sort_order);
create index if not exists idx_comments_review_id on comments(review_id, created_at);
create index if not exists idx_post_reactions_review_id on post_reactions(review_id, type);
create index if not exists idx_beer_match_suggestions_review_id on beer_match_suggestions(review_id);

create or replace view eligible_reviews as
select
  r.*
from reviews r
where
  r.visibility = 'public'
  and r.status = 'published'
  and r.beer_confirmation_status = 'confirmed'
  and r.rating is not null
  and exists (
    select 1
    from review_photos rp
    where rp.review_id = r.id
  );

create or replace view beer_leaderboard as
select
  b.id as beer_id,
  avg(er.rating)::numeric(3, 2) as average_rating,
  count(er.id)::int as verified_review_count,
  count(pr.id) filter (where pr.type = 'like')::int as like_count,
  (
    avg(er.rating) * log(greatest(count(er.id), 1) + 1)
    + count(pr.id) filter (where pr.type = 'like') * 0.05
  )::numeric(8, 3) as rank_score
from beers b
join eligible_reviews er on er.beer_id = b.id
left join post_reactions pr on pr.review_id = er.id
group by b.id;
