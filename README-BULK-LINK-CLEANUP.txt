CashClimb bulk link cleanup patch

Files included:
- lib/link-cleaner.ts
- lib/normalize-links.ts
- app/api/admin/links/cleanup/route.ts
- components/admin/LinkCleanupButton.tsx
- app/admin/page.tsx
- app/admin/posts/[id]/edit/page.tsx
- lib/automation/db.ts
- app/api/admin/posts/[postId]/fix-seo/route.ts

What this patch does:
- Adds a reusable link cleaner/validator.
- Normalizes internal CashClimb links to relative paths.
- Normalizes external links to https:// URLs.
- Replaces known bad source URLs with working trusted URLs.
- Removes confirmed 404/410 external links while preserving the visible anchor text.
- Applies link cleanup on manual post save.
- Applies link cleanup on automation draft creation.
- Applies link cleanup when Fix SEO Issues runs.
- Adds /api/admin/links/cleanup for bulk cleanup of existing posts.
- Adds a Clean broken links button to the admin dashboard.

After copying these files into the project root:

rm -rf .next
npm run build
git add .
git commit -m "Add bulk external link cleanup"
git push origin main

After deploy:
- Go to /admin
- Click Clean broken links
- It will scan recent posts and clean broken external links.
