# AI Publisher Platform Upgrade

## What changed in this package

This codebase now has a first safe platform layer. It does not merge production sites yet. It prepares the site to be controlled by one shared admin/AI engine later.

Added:

- `lib/platform/site-config.ts`
- `lib/platform/quality-score.ts`
- `lib/platform/social.ts`
- platform database migration

## Why this is the safe first step

The three sites have similar publishing needs, but they are not identical. Northfield and CashClimb use Supabase. HustlePath is older and uses a different database layer. A direct merge would be risky.

This phase adds the common primitives first:

- `site_id`
- platform site registry
- AI workflow jobs
- content quality scores
- social post queue
- article refresh metadata

## Database migration

Run the new platform migration in the correct database for this site:

- CashClimb: `supabase/migrations/006_platform_foundation.sql`
- Northfield Journal: `supabase/migrations/006_platform_foundation.sql`
- HustlePath: `sql/2026-07-07-platform-foundation.sql`

## Next implementation phases

### Phase 1: shared platform foundation

- Keep all domains separate.
- Keep the current public sites running.
- Start tagging records with `site_id`.
- Store AI workflow jobs in `ai_workflow_jobs`.
- Store article checks in `content_quality_scores`.
- Store X/social drafts in `social_posts`.

### Phase 2: one admin dashboard

Create a new platform admin that can switch between sites:

- Northfield Journal
- CashClimb
- HustlePath Daily

The admin should read from the same logical tables using `site_id` filters.

### Phase 3: AI quality engine

Before publishing, run:

- article depth check
- search intent check
- internal link count check
- disclosure check
- FAQ/schema check
- duplicate intent check
- keyword cannibalization check

Articles below the required score should remain in draft.

### Phase 4: social distribution

When an article is published:

- generate one X post
- generate one X thread
- queue the post in `social_posts`
- manually approve first
- later connect the X API for automatic posting

### Phase 5: true multi-site engine

Once the three sites work with `site_id`, extract shared logic into one repository or package:

- content planning
- keyword generation
- article drafting
- SEO checks
- internal linking
- social distribution
- refresh queue

## Important notes

Do not delete the individual sites yet. The correct path is incremental migration.

The final target is:

```text
One admin/backend engine
Three separate public domains
Shared AI, SEO, publishing, and social workflow
```
