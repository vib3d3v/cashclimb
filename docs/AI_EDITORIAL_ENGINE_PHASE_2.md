# AI Editorial Engine Phase 2

This upgrade changes CashClimb from a simple draft generator into a safer editorial workflow.

## What changed

- Draft generation now runs the AI Editorial Engine automatically.
- New drafts are improved up to 3 passes until they reach a 95 quality target.
- Posts below 95 are kept as `review_required`.
- Posts at or above 95 move to `ready_for_review`, not directly published.
- Admins still manually approve before publishing.
- The editor now has a `Run AI Editorial Engine` button for existing drafts.
- Keyword generation fallback is included so the API does not return `inserted: 0` just because SerpAPI returned duplicates.

## Apply

Copy the files from this patch into the CashClimb repo, then run:

```bash
npm run build
```

Run this migration in Supabase:

```text
supabase/migrations/007_ai_editorial_engine.sql
```

Then commit and deploy.
