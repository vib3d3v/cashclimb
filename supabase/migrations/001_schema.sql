-- ============================================================
-- CashClimb Full Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── POSTS ────────────────────────────────────────────────────
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  excerpt     text not null,
  body        text not null,
  category    text not null check (category in (
                'Investing','Personal Finance','Credit',
                'Taxes','Real Estate','Retirement')),
  author      text not null,
  cover_url   text,
  published   boolean not null default false,
  read_time   text not null default '5 min',
  view_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute procedure update_updated_at();

-- ── COMMENTS ─────────────────────────────────────────────────
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  author_name   text not null,
  author_email  text not null,
  body          text not null,
  approved      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── PAGE VIEWS ───────────────────────────────────────────────
create table if not exists page_views (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade,
  path       text not null,
  referrer   text,
  user_agent text,
  viewed_at  timestamptz not null default now()
);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists posts_slug_idx       on posts(slug);
create index if not exists posts_published_idx  on posts(published);
create index if not exists posts_category_idx   on posts(category);
create index if not exists comments_post_idx    on comments(post_id);
create index if not exists views_post_idx       on page_views(post_id);
create index if not exists views_date_idx       on page_views(viewed_at);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table posts     enable row level security;
alter table comments  enable row level security;
alter table page_views enable row level security;

-- Public: read published posts only
create policy "Public read published posts"
  on posts for select
  using (published = true);

-- Public: read approved comments
create policy "Public read approved comments"
  on comments for select
  using (approved = true);

-- Public: insert comments (pending approval)
create policy "Public insert comments"
  on comments for insert
  with check (approved = false);

-- Public: insert page views
create policy "Public insert page views"
  on page_views for insert
  with check (true);

-- Admins (service role) manage everything — handled server-side

-- ── STORAGE BUCKET ───────────────────────────────────────────
-- Run separately in Supabase dashboard or via API:
-- Create a bucket called "covers" with public access enabled
-- insert into storage.buckets (id, name, public) values ('covers', 'covers', true);

-- ── SEED DATA ────────────────────────────────────────────────
insert into posts (title, slug, excerpt, body, category, author, published, read_time, view_count) values
(
  'The Compounding Secret the Ultra-Wealthy Don''t Talk About',
  'compounding-secret-ultra-wealthy',
  'Most investors focus on returns. The truly wealthy obsess over time. Here''s what two extra decades of compounding can mean for your portfolio.',
  '<p>Most investors focus on returns. The truly wealthy obsess over time. Compounding is often called the eighth wonder of the world, and for good reason.</p><p>When your money earns returns, and those returns themselves earn returns, the growth curve becomes exponential rather than linear.</p><p>Consider two investors: Alex starts at 25, investing $500/month at 8% average annual returns. Jordan starts at 35 with the same amount. By 65, Alex has roughly $1.75 million. Jordan? About $745,000. Same monthly investment, same returns — yet Alex ends up with over $1 million more simply because of a 10-year head start.</p><p>The practical takeaway: automate your investments immediately. Time in the market consistently beats timing the market.</p>',
  'Investing',
  'Eleanor Voss',
  true,
  '5 min',
  1842
),
(
  'How to Build a 6-Month Emergency Fund Without Feeling the Pain',
  'build-6-month-emergency-fund',
  'A proper emergency fund isn''t just about the number — it''s about building a psychological safety net that changes how you make every other financial decision.',
  '<p>Financial experts unanimously agree: before aggressive investing, before paying down low-interest debt — build your emergency fund. But most advice stops at "save 3–6 months of expenses" without explaining the how.</p><p>Here''s a system that works: First, calculate your true monthly expenses — not income, not what you think you spend, but actual bank statements reviewed line by line. Add a 15% buffer for irregular expenses.</p><p>Next, open a high-yield savings account completely separate from your checking account. Name it something emotionally resonant: "Peace of Mind Fund" or "Freedom Reserve."</p><p>The psychological transformation happens around month 3 of coverage. Suddenly, you stop making financial decisions from fear.</p>',
  'Personal Finance',
  'Marcus Webb',
  true,
  '4 min',
  1204
),
(
  'Index Funds vs ETFs: The Difference Actually Matters More Than You Think',
  'index-funds-vs-etfs',
  'Both track indexes, but the tax treatment, trading flexibility, and cost structures diverge in ways that can add up to thousands.',
  '<p>On the surface, index mutual funds and ETFs appear identical — both track a benchmark index, both offer broad diversification, both charge low fees. But the differences matter, especially as your portfolio grows.</p><p><strong>Tax efficiency:</strong> ETFs have a structural advantage here. The in-kind creation/redemption mechanism means ETFs rarely distribute capital gains.</p><p><strong>Minimum investments:</strong> Many index funds require $1,000–$3,000 minimums. Most ETFs can be purchased for the price of a single share.</p><p>For most investors in taxable accounts, ETFs edge out index funds on tax efficiency.</p>',
  'Investing',
  'Eleanor Voss',
  true,
  '6 min',
  987
),
(
  'The 50/30/20 Rule Is Outdated. Here''s What Works in 2026.',
  '50-30-20-rule-outdated-2026',
  'In an era of elevated housing costs and inflation-adjusted wages that haven''t kept pace, the classic budgeting rule needs a serious update.',
  '<p>The 50/30/20 rule was popularized in the early 2000s. In many U.S. cities today, housing alone can consume 40–50% of take-home pay. The math simply doesn''t work the same way.</p><p>A more realistic modern framework: move away from fixed percentages entirely and adopt a priority-based approach.</p><p><strong>Priority 1:</strong> Cover true needs first. Housing, food, utilities, minimum debt payments.</p><p><strong>Priority 2:</strong> Fund your future self. Automate retirement contributions at minimum to capture any employer match.</p><p><strong>Priority 3:</strong> Spend what remains on wants, guilt-free.</p>',
  'Personal Finance',
  'Priya Nair',
  true,
  '5 min',
  756
);
