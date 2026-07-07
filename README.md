# AI Editorial Engine Phase 2

Apply this patch to CashClimb first.

This is the first real platform behavior upgrade after the foundation patch. It changes the workflow from simple draft generation to an editorial loop.

## What it does

- Draft generation now runs the AI Editorial Engine automatically.
- The engine runs up to 3 improvement passes.
- Target score is 95.
- Score below 95 stays `review_required`.
- Score 95+ becomes `ready_for_review`.
- Nothing is published automatically.
- Admin still has to approve before publish.
- Existing drafts get a new `Run AI Editorial Engine` button.
- Includes the keyword fallback fix, with the TypeScript guard fixed.

## Apply

Copy the `cashclimb` folder contents into the CashClimb repo root.

Then run the Supabase SQL file:

```text
cashclimb/supabase/migrations/007_ai_editorial_engine.sql
```

Then run:

```bash
npm run build
git add .
git commit -m "Add AI editorial engine workflow"
git push origin main
```

## Notes

I verified TypeScript with:

```bash
npx tsc --noEmit
```

The full Next build could not be completed inside this sandbox because Next tried to download the Linux SWC package and the sandbox has no external npm network access. Your Vercel build should perform the real production build.
