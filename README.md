# CashClimb Geo Cleaner Fix

Patch this into the CashClimb repo root.

Fixes:
- Removes normalized geo suffixes like `usukcaau`, `US/UK/CA/AU`, `us uk ca au`, and `(US/UK/CA/AU)`.
- Cleans title, primary keyword, SEO title, SEO description, excerpt, related keywords, and draft body.
- Re-runs the cleaner inside the AI Editorial Engine before scoring.
- Cleans unpublished draft slugs when the editorial engine runs.
- Keeps published slugs unchanged to avoid breaking live URLs.

After applying:

```bash
npm run build
git add .
git commit -m "Fix geo suffix cleaner for SEO titles and keywords"
git push origin main
```

For existing affected drafts, open the article and click **Run AI Editorial Engine**. It will clean the bad suffix from the fields and rescore.
