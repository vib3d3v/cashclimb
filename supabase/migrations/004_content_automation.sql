-- CashClimb content automation hardening
-- Safe to run after 003_editorial_workflow.sql.

alter table posts add column if not exists automation_meta jsonb not null default '{}'::jsonb;

alter table keyword_queue add column if not exists opportunity_score integer;
alter table keyword_queue add column if not exists monetization_score integer;
alter table keyword_queue add column if not exists content_type text;

create index if not exists keyword_queue_priority_status_idx
  on keyword_queue(priority asc, status, created_at asc);

create index if not exists generation_runs_status_idx
  on generation_runs(status, created_at desc);

create or replace view automation_dashboard as
select
  (select count(*) from keyword_queue where status = 'queued') as queued_keywords,
  (select count(*) from keyword_queue where status = 'processing') as processing_keywords,
  (select count(*) from posts where published = false and coalesce(status, 'draft') in ('draft', 'review_required')) as drafts_needing_review,
  (select count(*) from posts where published = false and status = 'approved') as approved_drafts,
  (select count(*) from generation_runs where created_at > now() - interval '7 days') as runs_last_7_days;
