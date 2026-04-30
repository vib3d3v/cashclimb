
CashClimb Patch Instructions

1. Replace lib/automation/db.ts with db.ts in this package.
2. Add safe() helper to:
   - lib/ai-editor.ts
   - lib/automation/seo-fixer.ts
   - lib/automation/content.ts
3. Replace all .replace/.trim/.toLowerCase usages with safe().
4. Ensure all routes use:
   body (not body_html)
   cover_url (not cover_image)
5. Restart:
   rm -rf .next && npm run dev
