# CashClimb Editorial Quality Complete

Apply the contents of `cashclimb/` to the CashClimb repo root.

Run this migration in Supabase after applying:

```text
supabase/migrations/011_entity_based_quality_cleanup.sql
```

Then run:

```bash
npm run build
git add .
git commit -m "Add entity-based editorial quality engine"
git push origin main
```

What this fixes:

- Removes forced exact keyword repetition in the introduction, Quick Answer, and body sections.
- Switches generated copy to semantic/entity-based writing.
- Stops SEO titles from appending `| CashClimb`.
- Repairs incomplete titles, excerpts, SEO titles, meta descriptions, and slugs.
- Removes the cover image field from manual post forms and keeps `cover_url` null in new/edited posts.
- Cleans `usukcaau` and related geo-market noise from existing records.
- Adds an editorial check for exact keyword repetition.
- Keeps the quality gate at 95+ for ready-for-review.

Validation performed here:

```bash
npx tsc --noEmit
```

It passed. A full Next build could not complete in this sandbox because the environment could not download the Linux SWC package from npm, but the TypeScript check passed.
