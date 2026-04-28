-- Editorial workflow upgrade for CashClimb
alter table posts add column if not exists status text not null default 'draft'
  check (status in ('draft', 'review_required', 'approved', 'published', 'rejected'));
alter table posts add column if not exists primary_keyword text;
alter table posts add column if not exists related_keywords jsonb not null default '[]'::jsonb;
alter table posts add column if not exists seo_title text;
alter table posts add column if not exists seo_description text;
alter table posts add column if not exists quality_score integer;
alter table posts add column if not exists risk_level text check (risk_level in ('low', 'medium', 'high'));
alter table posts add column if not exists review_notes text;
alter table posts add column if not exists published_at timestamptz;
alter table posts add column if not exists approved_at timestamptz;
alter table posts add column if not exists workflow_meta jsonb not null default '{}'::jsonb;

update posts
set status = case when published then 'published' else 'draft' end,
    published_at = coalesce(published_at, case when published then created_at else null end)
where status is null or status = 'draft';

create index if not exists posts_status_idx on posts(status);
create index if not exists posts_primary_keyword_idx on posts(primary_keyword);
create index if not exists posts_published_at_idx on posts(published_at desc);

create table if not exists keyword_queue (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  category text not null check (category in ('Investing','Personal Finance','Credit','Taxes','Real Estate','Retirement')),
  intent text not null default 'informational',
  priority integer not null default 100,
  source text not null default 'manual',
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'skipped')),
  brief jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

drop trigger if exists keyword_queue_updated_at on keyword_queue;
create trigger keyword_queue_updated_at
before update on keyword_queue
for each row execute procedure update_updated_at();

create index if not exists keyword_queue_status_idx on keyword_queue(status, priority, created_at);
create unique index if not exists keyword_queue_unique_active_idx on keyword_queue(lower(keyword), category, status)
where status in ('queued', 'processing');

create table if not exists quality_checks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists quality_checks_post_idx on quality_checks(post_id, created_at desc);

create table if not exists generation_runs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  keyword_queue_id uuid references keyword_queue(id) on delete set null,
  step text not null,
  model text,
  status text not null default 'started' check (status in ('started', 'completed', 'failed')),
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,4),
  latency_ms integer,
  details jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists generation_runs_post_idx on generation_runs(post_id, created_at desc);

create table if not exists publish_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  action text not null check (action in ('approved', 'published', 'rejected', 'unpublished')),
  actor text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists publish_events_post_idx on publish_events(post_id, created_at desc);
