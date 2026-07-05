# CashClimb SerpAPI Keyword Patch

## What changed

- Added `lib/automation/serpapi.ts` for SerpAPI-powered Google autocomplete keyword discovery.
- Updated the weekly keyword cron route `/api/admin/generate-keywords` to use SerpAPI first.
- Updated the admin automation keyword generator to use SerpAPI first.
- Kept the existing keyword generator as fallback if `SERPAPI_API_KEY` is missing or SerpAPI returns no usable suggestions.
- Added `SERPAPI_API_KEY` to `.env.example`.

## Required Vercel environment variable

Add this in Vercel Project Settings > Environment Variables:

```txt
SERPAPI_API_KEY=your_serpapi_key_here
```

The code also accepts `SERP_API_KEY` or `SERPAPI_KEY`, but `SERPAPI_API_KEY` is the preferred name.

## Behavior

- Existing queued keywords are still used before generating new ones.
- Duplicate queued or already-covered keywords are skipped.
- Unsafe or poor-fit finance keywords are filtered out.
- SerpAPI keywords are tagged with `source: serpapi` and notes saying they were generated via SerpAPI.

## Priority behavior update

- The admin Keywords page now shows active items first: queued, processing, failed, skipped, then completed.
- Draft automation now selects the lowest `priority` number first, then the oldest keyword inside the same priority.
- SerpAPI-generated keywords are queued as active items, so they should appear near the top after clicking Generate keywords.
