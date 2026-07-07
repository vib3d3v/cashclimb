-- CashClimb keyword intelligence engine support
-- Safe to run more than once.

alter table keyword_queue add column if not exists keyword_score integer;
alter table keyword_queue add column if not exists score_breakdown jsonb not null default '{}'::jsonb;
alter table keyword_queue add column if not exists topic_cluster text;
alter table keyword_queue add column if not exists topic_role text;
alter table keyword_queue add column if not exists demand_signal integer;
alter table keyword_queue add column if not exists difficulty_signal integer;

create index if not exists keyword_queue_score_status_idx
  on keyword_queue(status, keyword_score desc, priority asc, created_at asc);

create index if not exists keyword_queue_cluster_idx
  on keyword_queue(topic_cluster, status, priority asc);

-- Clean old geo-market noise from existing articles.
update posts
set
  title = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(title, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g')), ''),
  excerpt = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(excerpt, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g')), ''),
  primary_keyword = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(primary_keyword, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g')), ''),
  seo_title = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(seo_title, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g')), ''),
  seo_description = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(seo_description, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g')), ''),
  body = nullif(trim(regexp_replace(regexp_replace(regexp_replace(coalesce(body, ''), '\\(?\\s*us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au\\s*\\)?', '', 'gi'), 'usukcaau', '', 'gi'), '\\s+', ' ', 'g')), ''),
  slug = trim(both '-' from regexp_replace(regexp_replace(regexp_replace(coalesce(slug, ''), 'usukcaau', '', 'gi'), 'us-uk-ca-au|us_uk_ca_au', '', 'gi'), '-+', '-', 'g'))
where
  title ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or excerpt ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or primary_keyword ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or related_keywords::text ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or seo_title ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or seo_description ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or body ~* 'usukcaau|us\\s*/\\s*uk\\s*/\\s*ca\\s*/\\s*au'
  or slug ~* 'usukcaau|us-uk-ca-au|us_uk_ca_au';

-- Re-prioritize queued keywords if they already contain score metadata in brief.
update keyword_queue
set
  keyword_score = nullif((brief->>'score')::int, 0),
  score_breakdown = coalesce(brief->'score_breakdown', '{}'::jsonb),
  topic_cluster = nullif(brief->>'cluster', ''),
  topic_role = nullif(brief->>'cluster_type', ''),
  demand_signal = nullif((brief->'score_breakdown'->>'demand')::int, 0),
  difficulty_signal = nullif((brief->'score_breakdown'->>'difficulty')::int, 0)
where brief ? 'score';
