import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// POST /api/analytics  — record a page view (public)
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { post_id, path } = await req.json()
  const referrer   = req.headers.get('referer') ?? ''
  const user_agent = req.headers.get('user-agent') ?? ''

  // Insert page view
  await supabase.from('page_views').insert({ post_id: post_id ?? null, path, referrer, user_agent })

  // Increment post view counter
  if (post_id) {
    await supabase.rpc('increment_view', { post_id })
  }

  return NextResponse.json({ ok: true })
}

// GET /api/analytics  — full analytics summary (admin only)
export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const [postsRes, commentsRes, viewsRes, topPostsRes, recentCommentsRes] = await Promise.all([
    supabase.from('posts').select('id, category, created_at', { count: 'exact' }),
    supabase.from('comments').select('id', { count: 'exact' }),
    supabase.from('page_views').select('id', { count: 'exact' }),
    supabase
      .from('posts')
      .select('title, slug, view_count, category')
      .eq('published', true)
      .order('view_count', { ascending: false })
      .limit(5),
    supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Posts this month
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count: postsThisMonth } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', firstOfMonth)

  // Views by day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentViews } = await supabase
    .from('page_views')
    .select('viewed_at')
    .gte('viewed_at', thirtyDaysAgo)

  // Bucket views by day
  const viewsByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    viewsByDay[key] = 0
  }
  recentViews?.forEach(v => {
    const key = v.viewed_at.slice(0, 10)
    if (key in viewsByDay) viewsByDay[key]++
  })

  // Views by category
  const catMap: Record<string, number> = {}
  topPostsRes.data?.forEach(p => {
    catMap[p.category] = (catMap[p.category] ?? 0) + p.view_count
  })
  const viewsByCategory = Object.entries(catMap).map(([category, views]) => ({ category, views }))

  return NextResponse.json({
    total_posts:      postsRes.count ?? 0,
    total_views:      viewsRes.count ?? 0,
    total_comments:   commentsRes.count ?? 0,
    posts_this_month: postsThisMonth ?? 0,
    top_posts:        topPostsRes.data ?? [],
    views_by_day:     Object.entries(viewsByDay).map(([date, views]) => ({ date, views })),
    views_by_category: viewsByCategory,
    recent_comments:  recentCommentsRes.data ?? [],
  })
}
