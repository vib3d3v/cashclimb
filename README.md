# CashClimb Production Quality Engine

Apply the `cashclimb/` folder to the CashClimb repo root.

Then run the migrations in Supabase if they have not been run yet:

1. `supabase/migrations/007_ai_editorial_engine.sql`
2. `supabase/migrations/008_clean_geo_market_noise.sql`
3. `supabase/migrations/009_keyword_intelligence_engine.sql`
4. `supabase/migrations/010_production_quality_cleanup.sql`

Then deploy:

```bash
npm run build
git add .
git commit -m "Add production keyword and editorial quality engine"
git push origin main
```

What this fixes:

- No more `CashClimb` branding appended to SEO titles.
- No more `usukcaau`, `US/UK/CA/AU`, or slug geo noise.
- No truncated titles, SEO titles, excerpts, or meta descriptions.
- Titles cannot end with dangling words like `for`, `with`, `to`, or `step-by-step`.
- Slugs are generated from the cleaned final title, not the raw keyword.
- Existing bad records are cleaned by migration `010`.
- Manual cover image UI is removed from the admin form.
- The editorial checker now flags incomplete titles and metadata instead of giving them 100.
- The editorial engine normalizes title, slug, excerpt, SEO title, SEO description, keyword, related keywords, and body before rescoring.

Validation performed:

```bash
npx tsc --noEmit
```

Passed locally after applying this patch to the uploaded CashClimb codebase. Full `next build` could not complete in this sandbox because Next tried to download the Linux SWC package and internet access is blocked here.
