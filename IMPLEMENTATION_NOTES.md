# CashClimb Editorial Workflow Upgrade

This upgrade adds a review-first finance publishing workflow on top of the existing CashClimb blog generator.

## Added pieces

- `supabase/migrations/003_editorial_workflow.sql`
  - adds workflow columns to `posts`
  - adds `keyword_queue`, `quality_checks`, `generation_runs`, and `publish_events`
- `lib/editorial-workflow.ts`
  - finance-safe quality evaluator
  - status recommendation helper
- `lib/admin-guard.ts`
  - shared admin header validation for protected API routes
- `app/api/admin/keyword-queue/route.ts`
  - list and create queued keywords
- `app/api/admin/quality-checks/[postId]/route.ts`
  - run automated quality checks for a post
- `app/api/admin/articles/approve/route.ts`
  - mark a post as approved
- `app/api/admin/articles/publish/route.ts`
  - publish an approved post
- `app/admin/workflow/page.tsx`
  - workflow overview page
- `app/api/cron/daily-draft/route.ts`
  - now saves `primary_keyword`, `related_keywords`, `quality_score`, `risk_level`, `status`, and a `quality_checks` row for each generated draft

## New workflow

1. Queue a keyword in `keyword_queue`
2. Generate a draft through your existing cron pipeline
3. Auto-evaluate the finance article
4. Route the post into `approved` or `review_required`
5. Approve manually when needed
6. Publish through the new publish API

## Run the migration

Apply this in Supabase SQL Editor:

- `supabase/migrations/003_editorial_workflow.sql`

## Protected admin APIs

All new admin routes require:

- header: `x-admin-key: <ADMIN_PASSWORD>`

## Suggested next step

Build a small admin action bar on the draft list page to call:

- `POST /api/admin/quality-checks/:postId`
- `POST /api/admin/articles/approve`
- `POST /api/admin/articles/publish`

That will turn the backend workflow added here into a fully clickable editorial UI.
