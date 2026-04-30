CashClimb final stability patch

Copy these folders/files into the root of your CashClimb project and replace matching files.

What this fixes:
- Fix SEO Issues now calls the real SEO fixer and writes back to the posts table.
- Removed stale schema fields: body_html, cover_image, processing_started_at.
- Uses your actual posts columns: body and cover_url.
- Run Batch is queue-first and does not generate new keywords unless the queue is low.
- Keyword queue display now matches the queue order used by Run Batch.
- Future titles no longer force "A Practical CashClimb Guide".
- Safer string handling to prevent undefined.replace crashes.
- Keeps delete and cleanup keyword helper files in the patch.

After copying, run:
rm -rf .next
npm run dev

Before pushing:
1. Click Run Batch once.
2. Confirm it creates the top visible queued keyword.
3. Open that draft and click Fix SEO Issues.
4. Confirm no Request failed toast.
