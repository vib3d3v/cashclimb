# CashClimb 💰

A full-stack finance blog built with **Next.js 14**, **Supabase**, and deployed on **Vercel**.

Features: rich text editor, image uploads, comments with moderation, analytics dashboard, SEO-optimised pages, sitemap, and cookie-based admin auth.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | Next.js 14 (App Router)           |
| Database    | Supabase (PostgreSQL)             |
| Auth        | Cookie-based admin token          |
| Storage     | Supabase Storage (cover images)   |
| Hosting     | Vercel                            |
| Styling     | Tailwind CSS                      |
| Editor      | Tiptap (rich text)                |

---

## Project Structure

```
cashclimb/
├── app/
│   ├── page.tsx                   # Home page
│   ├── blog/
│   │   ├── page.tsx               # Blog listing
│   │   └── [slug]/page.tsx        # Single post
│   ├── admin/
│   │   ├── layout.tsx             # Admin sidebar layout
│   │   ├── page.tsx               # Dashboard overview
│   │   ├── login/page.tsx         # Admin login
│   │   ├── posts/
│   │   │   ├── page.tsx           # All posts table
│   │   │   ├── new/page.tsx       # Create post
│   │   │   └── [id]/edit/page.tsx # Edit post
│   │   ├── comments/page.tsx      # Comment moderation
│   │   └── analytics/page.tsx     # Analytics charts
│   └── api/
│       ├── posts/route.ts         # GET list / POST create
│       ├── posts/[id]/route.ts    # GET / PATCH / DELETE
│       ├── comments/route.ts      # GET / POST / PATCH / DELETE
│       ├── analytics/route.ts     # GET summary / POST view
│       ├── upload/route.ts        # POST image upload
│       ├── sitemap/route.ts       # XML sitemap
│       └── auth/
│           ├── login/route.ts     # POST login / DELETE logout
│           └── logout/route.ts    # GET logout redirect
├── components/                    # Shared UI components
├── lib/                           # Supabase clients, helpers
├── types/index.ts                 # TypeScript types
├── supabase/migrations/           # SQL schema files
├── middleware.ts                  # Route protection
├── vercel.json                    # Vercel config
└── .env.example                   # Environment variable template
```

---

## Setup Guide

### Step 1 — Clone the project

```bash
git clone https://github.com/YOUR_USERNAME/cashclimb.git
cd cashclimb
npm install
```

---

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `cashclimb`) and a strong database password
3. Select a region close to your users
4. Wait ~2 minutes for provisioning

---

### Step 3 — Run the database migrations

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Open `supabase/migrations/001_schema.sql` and paste the entire contents → click **Run**
3. Open `supabase/migrations/002_rpc.sql` and paste + run that too
4. This creates all tables, RLS policies, indexes, and seed data

---

### Step 4 — Create the Storage bucket

1. In Supabase dashboard → **Storage** → **New bucket**
2. Name it exactly: `covers`
3. Check **Public bucket** → click **Create**
4. Go to **Policies** tab for the `covers` bucket → add a policy:
   - Policy name: `Public read`
   - Allowed operation: `SELECT`
   - Target roles: `anon`

---

### Step 5 — Set up environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# From Supabase: Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Your chosen admin password — keep this secret!
ADMIN_PASSWORD=your_very_secure_password_here
ADMIN_EMAIL=admin@cashclimb.com

# Your domain (update after deploying to Vercel)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env.local` to git.** It's in `.gitignore` by default.

---

### Step 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)
- Use the password you set in `ADMIN_PASSWORD`

---

### Step 7 — Deploy to Vercel

#### Option A: Vercel CLI (recommended)

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add all 5 from your `.env.local`.

#### Option B: GitHub + Vercel Dashboard

1. Push your code to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/cashclimb.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_URL` → set to your Vercel domain e.g. `https://cashclimb.vercel.app`
5. Click **Deploy**

---

### Step 8 — Add a custom domain (optional)

1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Add `cashclimb.com` (or your domain)
3. Update your DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your custom domain

---

## Admin Panel Guide

| URL | Purpose |
|-----|---------|
| `/admin` | Dashboard — post count, views, recent posts |
| `/admin/posts/new` | Write and publish a new post |
| `/admin/posts` | View, edit, delete all posts |
| `/admin/comments` | Approve or delete reader comments |
| `/admin/analytics` | Views over time, top posts, category breakdown |

### Publishing a post

1. Go to `/admin/posts/new`
2. Fill in title, excerpt, body (rich text editor supports bold, italic, headings, lists, blockquotes, images, links)
3. Upload a cover image (optional, max 5 MB)
4. Select category and author name
5. Click **Publish** (live immediately) or **Save Draft** (hidden from public)

### Comment moderation

All comments are held for approval by default. Go to `/admin/comments` to approve or delete them. Approved comments appear on the post page instantly.

---

## SEO Features

- **Dynamic `<title>` and `<meta description>`** on every page via Next.js Metadata API
- **Open Graph tags** for social sharing previews
- **XML Sitemap** at `/sitemap.xml` — auto-generated from published posts
- **Incremental Static Regeneration (ISR)** — pages regenerate every 60 seconds
- **`generateStaticParams`** — post pages are pre-built at deploy time
- **Semantic HTML** — proper heading hierarchy, `<article>`, `<nav>`, `<main>`
- **Reading time** — auto-calculated from post content

---

## API Reference

All admin API endpoints require the header:
```
x-admin-key: YOUR_ADMIN_PASSWORD
```

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | Public | List published posts |
| POST | `/api/posts` | Admin | Create a post |
| GET | `/api/posts/:id` | Admin | Get single post |
| PATCH | `/api/posts/:id` | Admin | Update post |
| DELETE | `/api/posts/:id` | Admin | Delete post |
| GET | `/api/comments?post_id=X` | Public | Get approved comments |
| POST | `/api/comments` | Public | Submit comment (pending) |
| PATCH | `/api/comments` | Admin | Approve/unapprove comment |
| DELETE | `/api/comments` | Admin | Delete comment |
| POST | `/api/analytics` | Public | Record a page view |
| GET | `/api/analytics` | Admin | Get analytics summary |
| POST | `/api/upload` | Admin | Upload cover image |
| GET | `/api/sitemap` | Public | XML sitemap |

---

## Common Issues

**"Invalid API key" error from Supabase**
→ Double-check `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in your env vars. Make sure there are no trailing spaces.

**Images not loading after upload**
→ Ensure your `covers` bucket in Supabase is set to **Public**. Check that `NEXT_PUBLIC_SUPABASE_URL` matches your project URL exactly.

**Admin redirects to login even after correct password**
→ Check that `ADMIN_PASSWORD` is set correctly in both `.env.local` and Vercel env vars. The cookie uses `httpOnly` so it won't be visible in browser devtools.

**Posts not appearing after publish**
→ ISR caches pages for 60 seconds. Either wait 60s or run `vercel --prod` to force a fresh deploy.

**Build fails on Vercel**
→ Make sure all 5 environment variables are set in the Vercel dashboard before deploying.

---

## License

MIT — free to use, modify, and deploy commercially.
