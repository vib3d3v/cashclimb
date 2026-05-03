# Patched fixes

- Removed stale `public/sitemap.xml` so Next.js serves the dynamic `app/sitemap.ts` sitemap.
- Made sitemap generation safe when Supabase environment variables are missing, so static pages still appear instead of failing.
- Added support for `NEXT_PUBLIC_SITE_URL` as a fallback to `NEXT_PUBLIC_APP_URL`.
- Removed the robots.txt query-string block that can cause SEO scanners to miss crawlable pages.
- Added canonical metadata and favicon metadata.
- Added `public/favicon.svg`.

After deploying, verify `/robots.txt` and `/sitemap.xml` on the live domain. SPF, DKIM, and DMARC still must be fixed in DNS, not in the codebase.
- Updated `app/robots.ts` to also respect `NEXT_PUBLIC_SITE_URL`.
