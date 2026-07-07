# CashClimb SEO title and keyword quality fix

This patch makes the editorial engine smarter about keyword/title matching and improves SEO title generation.

## What it changes

- Replaces the strict exact-match keyword warning with semantic keyword-term coverage.
- Adds checks for SEO-worthy primary keywords and title/search-intent alignment.
- Cleans noisy market suffixes like `(US/UK/CA/AU)` from new keyword inserts.
- Filters weak/spammy keyword ideas before they enter the queue.
- Generates cleaner SEO-focused article titles from the primary keyword.
- Makes the AI editorial engine add the primary keyword naturally near the opening when needed.
- Updates related keywords to use meaningful keyword terms instead of random filler.

## Files changed

- `lib/seo/keyword-quality.ts`
- `lib/editorial-workflow.ts`
- `lib/automation/advanced-content-fixer.ts`
- `lib/automation/content.ts`
- `lib/automation/db.ts`

## Apply

Copy the `cashclimb/` folder contents into the CashClimb repo root, then run:

```bash
npm run build
git add .
git commit -m "Improve SEO title and keyword quality checks"
git push origin main
```

No SQL migration needed.

After deployment, open an existing article and click **Run AI Editorial Engine** or **Re-run SEO Checklist**. The old keyword warning should stop appearing when the title/opening already contains the important searchable terms.
