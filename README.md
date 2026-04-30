CashClimb login/admin patch

Overwrite these files in your CashClimb project:

- app/admin/login/page.tsx
- app/admin/login/LoginForm.tsx
- app/api/admin/login/route.ts
- app/admin/posts/[id]/edit/page.tsx

What this fixes:
- Live admin login now sets the cc-admin-token cookie that middleware expects.
- Login accepts ADMIN_EMAIL, ADMIN_USERNAME, or admin with the configured ADMIN_PASSWORD.
- Login redirects back to the requested admin page after success.
- Post edit page wraps PostSaveToast in Suspense to avoid useSearchParams build issues.

After replacing:
1. npm run build
2. git add .
3. git commit -m "Fix live admin login"
4. git push origin main

Vercel env required:
ADMIN_PASSWORD=your password
ADMIN_EMAIL=your email OR ADMIN_USERNAME=admin
