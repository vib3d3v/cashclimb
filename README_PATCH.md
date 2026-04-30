# CashClimb stability patch

Copy these files into your CashClimb project root and replace matching files.

Fixes included:
- `body_html` / `cover_image` schema mismatches removed. The patch uses `body` and `cover_url` only.
- `Fix SEO issues` now calls the real SEO fixer route and returns the payload the UI expects.
- Queue batch generation is queue-first, locks keywords, skips duplicates, and does not use missing Supabase columns.
- Repetitive title fallback `A Practical CashClimb Guide` removed from future generated drafts.
- Added keyword cleanup route for the `Clean duplicates` button.
- Safer string handling in editorial helpers to reduce `.replace()` crashes.

After copying:

```bash
rm -rf .next
npm run dev
```

Test:
1. Click Clean duplicates.
2. Click Run Batch once.
3. Open generated draft.
4. Click Fix SEO issues.
