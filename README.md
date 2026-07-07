# CashClimb Keyword Intelligence Engine

This is the complete CashClimb keyword intelligence upgrade, not a small one-off patch.

## What it adds

- SerpAPI keyword intelligence instead of basic keyword fetching.
- Collects candidates from Google Autocomplete, related searches, People Also Ask, and high-value finance fallback seeds.
- Scores keywords by demand proxy, competition proxy, search intent, commercial value, topical authority value, coverage gap, and freshness.
- Prioritizes high-value long-tail keywords that are more likely to help traffic and rankings.
- Prevents duplicate intent and already-covered topics from being queued again.
- Builds topic clusters and stores strategy metadata inside keyword briefs.
- Keeps the AI editorial engine workflow.
- Cleans `usukcaau`, `US/UK/CA/AU`, and similar geo noise from titles, slugs, keywords, excerpts, body, and metadata.
- Keeps drafts as `ready_for_review` only after the editorial engine passes the quality threshold.

## Apply

Copy the `cashclimb` folder contents into your CashClimb repo root.

Then run this SQL in Supabase:

```text
supabase/migrations/009_keyword_intelligence_engine.sql
```

Then run:

```bash
npm run build
git add .
git commit -m "Add keyword intelligence engine"
git push origin main
```

## Test

1. Go to `/admin/automation`.
2. Click **Generate Keywords**.
3. New queued keywords should be cleaner, higher-intent finance topics.
4. Click **Draft Next**.
5. Draft should target the highest-priority keyword first.
6. Check the article title, slug, primary keyword, and excerpt. There should be no `usukcaau`.

## Notes

SerpAPI does not always return exact monthly search volume. This engine uses available SERP signals as a demand proxy, plus commercial finance heuristics and coverage-gap scoring. If you later connect a provider with exact keyword volume and KD, the scoring layer can accept those values without changing the rest of the pipeline.
