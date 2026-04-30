CashClimb SEO Autofix Patch

Copy these folders into the CashClimb project root and replace matching files.

Adds:
- components/admin/SEOFixButton.tsx
- updated components/admin/SEOChecklistCard.tsx with Fix SEO issues button
- app/api/admin/posts/[postId]/fix-seo/route.ts
- app/api/admin/quality-checks/[postId]/route.ts
- lib/automation/seo-fixer.ts
- updated lib/editorial-workflow.ts

After copying:
1. Stop dev server
2. Run npm run dev
3. Open a draft post
4. Click Fix SEO issues
5. Then click Re-run SEO checklist to confirm

This patch does not publish posts automatically. It updates the draft, rescans the checklist, and leaves unresolved items for manual review.
