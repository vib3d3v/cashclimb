CashClimb patch

Copy these files into your CashClimb project root and overwrite the matching files.

Files included:
- lib/normalize-links.ts
- app/admin/posts/[id]/edit/page.tsx
- components/admin/SEOFixButton.tsx
- app/api/admin/posts/[postId]/fix-seo/route.ts
- app/blog/[slug]/page.tsx
- components/PostCard.tsx

What this fixes:
- Fix SEO Issues now receives the real post.id from the edit page, with URL fallback in the button.
- The fix-seo API accepts postId and also safely falls back to id.
- Save Post normalizes article links before saving.
- Internal CashClimb links become clean relative links. External links become https links.
- Author initials no longer shrink/cramp in the author card or post card.
- Blog article layout is constrained so long titles/content/sidebar do not overflow.

After copying files:
rm -rf .next
npm run build
npm run dev
