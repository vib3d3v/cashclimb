-- Platform foundation migration
-- Purpose: prepare each site to be controlled by one shared AI publishing engine later.
-- Safe to run multiple times.


create table if not exists platform_sites (
  id text primary key,
  name text not null,
  domain text not null unique,
  niche text not null,
  country text default 'US',
  default_ai_provider text default 'openai',
  brand_voice text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into platform_sites (id, name, domain, niche, country, default_ai_provider, brand_voice) values ('cashclimb', 'CashClimb', 'https://cashclimb.com', 'finance', 'US', 'openai', 'Clear, practical personal-finance guidance with conservative claims.') on conflict (id) do update set name = excluded.name, domain = excluded.domain, niche = excluded.niche, brand_voice = excluded.brand_voice;

create table if not exists ai_workflow_jobs (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references platform_sites(id) on delete cascade,
  entity_type text not null check (entity_type in ('keyword', 'brief', 'post', 'social', 'refresh', 'indexing')),
  entity_id uuid,
  job_type text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')) default 'queued',
  priority integer not null default 50,
  provider text,
  model text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_quality_scores (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references platform_sites(id) on delete cascade,
  post_id uuid,
  overall_score integer not null default 0,
  passed boolean not null default false,
  checks jsonb not null default '{}'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  scorer_version text not null default 'platform-v1',
  created_at timestamptz not null default now()
);

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references platform_sites(id) on delete cascade,
  post_id uuid,
  platform text not null check (platform in ('x', 'linkedin', 'facebook', 'pinterest', 'bluesky')),
  post_type text not null check (post_type in ('single', 'thread', 'pin', 'carousel')) default 'single',
  status text not null check (status in ('draft', 'queued', 'posted', 'failed', 'cancelled')) default 'draft',
  body text,
  thread jsonb not null default '[]'::jsonb,
  target_url text,
  external_url text,
  scheduled_for timestamptz,
  posted_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table posts add column if not exists site_id text;
update posts set site_id = 'cashclimb' where site_id is null;
alter table posts alter column site_id set default 'cashclimb';

alter table posts add column if not exists quality_score integer;
alter table posts add column if not exists quality_checks jsonb not null default '{}'::jsonb;
alter table posts add column if not exists social_meta jsonb not null default '{}'::jsonb;
alter table posts add column if not exists refresh_after timestamptz;

create index if not exists posts_site_id_idx on posts(site_id);
create index if not exists ai_workflow_jobs_site_status_idx on ai_workflow_jobs(site_id, status, priority desc, run_after asc);
create index if not exists content_quality_scores_site_post_idx on content_quality_scores(site_id, post_id, created_at desc);
create index if not exists social_posts_site_status_idx on social_posts(site_id, platform, status, scheduled_for asc);

-- Optional tables. These exist in Northfield/CashClimb automation builds, but not every site.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'content_keywords') then
    alter table content_keywords add column if not exists site_id text;
    update content_keywords set site_id = 'cashclimb' where site_id is null;
    alter table content_keywords alter column site_id set default 'cashclimb';
    create index if not exists content_keywords_site_status_idx on content_keywords(site_id, status, priority desc, created_at asc);
  end if;

  if exists (select 1 from information_schema.tables where table_name = 'content_briefs') then
    alter table content_briefs add column if not exists site_id text;
    update content_briefs set site_id = 'cashclimb' where site_id is null;
    alter table content_briefs alter column site_id set default 'cashclimb';
    create index if not exists content_briefs_site_status_idx on content_briefs(site_id, status, created_at desc);
  end if;
end $$;
