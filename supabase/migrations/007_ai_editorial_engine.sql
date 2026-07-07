-- AI Editorial Engine status support.
-- Safe to run multiple times. This does not remove any existing data.

alter table if exists posts
  add column if not exists approved_at timestamptz,
  add column if not exists published_at timestamptz;

-- If workflow_meta does not exist in older databases, keep the engine metadata available.
alter table if exists posts
  add column if not exists workflow_meta jsonb default '{}'::jsonb;

-- Optional indexes for the new workflow states.
create index if not exists posts_status_quality_idx on posts(status, quality_score desc, updated_at desc);
create index if not exists generation_runs_post_step_idx on generation_runs(post_id, step, created_at desc);
