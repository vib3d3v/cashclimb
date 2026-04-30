CashClimb Advanced Content Fixer Patch

What this adds:
- Fix Content Depth + Tone button in the SEO checklist card
- /api/admin/posts/[postId]/fix-content backend route
- lib/automation/advanced-content-fixer.ts
- editorial workflow tweak so normal disclaimers do not trigger the advisory phrasing warning

What it fixes:
- Expands thin drafts toward 900+ words
- Adds practical depth sections
- Adds example scenarios
- Sanitizes overly direct financial-advice phrasing
- Re-runs the editorial score and saves quality check history

Install:
1. Copy the app, components, and lib folders into the CashClimb project root.
2. Replace matching files.
3. Restart Next.js:
   CTRL+C
   npm run dev
4. Open a draft and click Fix Content Depth + Tone.

Notes:
- This does not publish automatically.
- It updates draft content, score, risk level, read time, and review notes.
- It keeps the admin auth guard active.
