insert into profiles (id, display_name, avatar_url, bio, top_style)
values
  ('user-alex', 'Alex G.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop', null, 'IPA'),
  ('user-sam', 'Sam R.', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&h=160&fit=crop', null, 'Stout'),
  ('user-jordan', 'Jordan B.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop', 'Craft Beer Enthusiast', 'Hazy IPA')
on conflict (id) do update set
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  top_style = excluded.top_style,
  updated_at = now();

insert into breweries (id, name, country)
values
  ('brewery-cloudburst', 'Cloudburst Brewing', 'US'),
  ('brewery-holy-mountain', 'Holy Mountain Brewing', 'US'),
  ('brewery-elysian', 'Elysian Brewing', 'US'),
  ('brewery-alchemist', 'Alchemist', 'US'),
  ('brewery-russian-river', 'Russian River', 'US')
on conflict (id) do update set
  name = excluded.name,
  country = excluded.country,
  updated_at = now();

insert into beers (id, name, brewery_id, style, abv, image_url, status)
values
  ('beer-citra-ipa', 'Citra IPA', 'brewery-cloudburst', 'IPA', 6.5, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=900&h=900&fit=crop', 'confirmed'),
  ('beer-midnight-still', 'Midnight Still', 'brewery-holy-mountain', 'Stout', 9.2, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=900&h=900&fit=crop', 'confirmed'),
  ('beer-space-dust', 'Space Dust IPA', 'brewery-elysian', 'Double IPA', 8.2, 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=900&h=900&fit=crop', 'confirmed'),
  ('beer-heady-topper', 'Heady Topper', 'brewery-alchemist', 'Double IPA', 8.0, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=900&h=900&fit=crop', 'confirmed'),
  ('beer-pliny-elder', 'Pliny the Elder', 'brewery-russian-river', 'Double IPA', 8.0, 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=900&h=900&fit=crop', 'confirmed')
on conflict (id) do update set
  name = excluded.name,
  brewery_id = excluded.brewery_id,
  style = excluded.style,
  abv = excluded.abv,
  image_url = excluded.image_url,
  status = excluded.status,
  updated_at = now();

insert into reviews (id, author_profile_id, beer_id, rating, review_text, visibility, status, beer_confirmation_status, created_at)
values
  ('post-citra-alex', 'user-alex', 'beer-citra-ipa', 4.5, 'Crisp, citrusy, and perfect for a sunny afternoon. Bright hop aroma without becoming too bitter.', 'public', 'published', 'confirmed', '2026-06-27T10:00:00.000Z'),
  ('post-midnight-sam', 'user-sam', 'beer-midnight-still', 5.0, 'Dark chocolate, espresso, and roasted malts. Thick, smooth, and dangerously easy to drink.', 'public', 'published', 'confirmed', '2026-06-27T07:00:00.000Z')
on conflict (id) do update set
  author_profile_id = excluded.author_profile_id,
  beer_id = excluded.beer_id,
  rating = excluded.rating,
  review_text = excluded.review_text,
  visibility = excluded.visibility,
  status = excluded.status,
  beer_confirmation_status = excluded.beer_confirmation_status,
  updated_at = now();

insert into review_photos (id, review_id, url, sort_order)
values
  ('photo-citra-alex-1', 'post-citra-alex', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=900&h=900&fit=crop', 1),
  ('photo-citra-alex-2', 'post-citra-alex', 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=900&h=900&fit=crop', 2),
  ('photo-midnight-sam-1', 'post-midnight-sam', 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=900&h=900&fit=crop', 1)
on conflict (id) do update set
  review_id = excluded.review_id,
  url = excluded.url,
  sort_order = excluded.sort_order;

insert into comments (id, review_id, author_profile_id, parent_comment_id, body, created_at)
values
  ('comment-citra-1', 'post-citra-alex', 'user-jordan', null, 'This one has been on my list. The citrus note sounds exactly right.', '2026-06-27T10:12:00.000Z'),
  ('comment-citra-1-reply-1', 'post-citra-alex', 'user-alex', 'comment-citra-1', 'Worth trying fresh if you can find it.', '2026-06-27T10:18:00.000Z')
on conflict (id) do update set
  review_id = excluded.review_id,
  author_profile_id = excluded.author_profile_id,
  parent_comment_id = excluded.parent_comment_id,
  body = excluded.body,
  updated_at = now();

insert into post_reactions (id, review_id, profile_id, type)
values
  ('like-citra-jordan', 'post-citra-alex', 'user-jordan', 'like'),
  ('like-midnight-alex', 'post-midnight-sam', 'user-alex', 'like'),
  ('save-midnight-jordan', 'post-midnight-sam', 'user-jordan', 'save')
on conflict (id) do update set
  review_id = excluded.review_id,
  profile_id = excluded.profile_id,
  type = excluded.type;

insert into beer_match_suggestions (id, profile_id, beer_id, provider, status, confidence_score, confidence_level, reasons, raw_response)
values
  (
    'match-high-001',
    'user-jordan',
    'beer-space-dust',
    'mock',
    'suggested',
    0.980,
    'high',
    '[{"type":"label_text","label":"Label text matched Space Dust IPA","confidence":0.97},{"type":"brewery","label":"Brewery matched Elysian Brewing","confidence":0.94},{"type":"style","label":"Style matched Double IPA","confidence":0.88}]'::jsonb,
    '{"source":"seed"}'::jsonb
  )
on conflict (id) do update set
  profile_id = excluded.profile_id,
  beer_id = excluded.beer_id,
  provider = excluded.provider,
  status = excluded.status,
  confidence_score = excluded.confidence_score,
  confidence_level = excluded.confidence_level,
  reasons = excluded.reasons,
  raw_response = excluded.raw_response;
