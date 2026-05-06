CashClimb link validation patch

Files included:
- lib/normalize-links.ts
- app/admin/posts/[id]/edit/page.tsx
- app/api/admin/posts/[postId]/fix-seo/route.ts
- app/api/cron/daily-draft/route.ts

What this fixes:
- Normalizes internal CashClimb URLs to relative links.
- Normalizes external URLs to https.
- Replaces known dead source URLs with valid trusted alternatives.
- Validates external links server-side before saving edited posts, Fix SEO output, and cron-generated drafts.
- Removes unfixable dead external anchors instead of saving 404 links.

After copying these files into the project root:
rm -rf .next
npm run build
git add .
git commit -m "Validate and normalize external article links"
git push origin main
