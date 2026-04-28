'use client'
import { useEffect, useState } from 'react'
import { useCookies } from '@/lib/use-cookies'

interface AnalyticsData {
  total_posts: number
  total_views: number
  total_comments: number
  posts_this_month: number
  top_posts: { title: string; slug: string; view_count: number; category: string }[]
  views_by_day: { date: string; views: number }[]
  views_by_category: { category: string; views: number }[]
  recent_comments: { id: string; author_name: string; body: string; created_at: string }[]
}

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37',
  'Personal Finance': '#4A9B8E',
  Credit: '#C4704A',
  Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A',
  Retirement: '#C46A8A',
}

export default function AnalyticsPage() {
  const adminKey = useCookies('cc-admin-token')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminKey) return
    fetch('/api/analytics', { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [adminKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6A6460] text-sm animate-pulse">Loading analytics…</div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-red-400 text-sm">Failed to load analytics data.</div>
  }

  const maxViews = Math.max(...(data.views_by_day?.map(d => d.views) ?? [1]), 1)
  const maxCatViews = Math.max(...(data.views_by_category?.map(c => c.views) ?? [1]), 1)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">Analytics</h1>
          <p className="text-[#9A9490] text-sm mt-1">Last 30 days overview</p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Posts',       value: data.total_posts,         color: '#D4AF37', icon: '📝' },
          { label: 'Total Views',       value: data.total_views.toLocaleString(), color: '#4A9B8E', icon: '👁' },
          { label: 'Total Comments',    value: data.total_comments,      color: '#7B68D4', icon: '💬' },
          { label: 'Posts This Month',  value: data.posts_this_month,    color: '#C46A8A', icon: '📅' },
        ].map(s => (
          <div key={s.label} className="bg-bg-2 border border-border rounded-xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-serif text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[#9A9490] text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── VIEWS OVER TIME ── */}
      <div className="bg-bg-2 border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-sm mb-6">Views — Last 30 Days</h2>
        <div className="flex items-end gap-1 h-40">
          {data.views_by_day.map(d => {
            const pct = maxViews === 0 ? 0 : (d.views / maxViews) * 100
            const isWeekend = [0, 6].includes(new Date(d.date).getDay())
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                  <div className="bg-bg-3 border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
                    <span className="text-[#F0EDE8] font-semibold">{d.views}</span>
                    <span className="text-[#6A6460] ml-1">{d.date.slice(5)}</span>
                  </div>
                </div>
                <div
                  className="w-full rounded-sm transition-all duration-200 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    background: isWeekend ? '#4A9B8E' : '#D4AF37',
                    opacity: pct === 0 ? 0.2 : 0.85,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#6A6460]">
          <span>{data.views_by_day[0]?.date.slice(5)}</span>
          <span>{data.views_by_day[14]?.date.slice(5)}</span>
          <span>{data.views_by_day[29]?.date.slice(5)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── TOP POSTS ── */}
        <div className="bg-bg-2 border border-border rounded-xl p-6">
          <h2 className="font-semibold text-sm mb-5">Top Posts by Views</h2>
          <div className="space-y-4">
            {data.top_posts.length === 0 && (
              <p className="text-[#6A6460] text-xs">No published posts yet.</p>
            )}
            {data.top_posts.map((p, i) => {
              const pct = data.top_posts[0]?.view_count
                ? (p.view_count / data.top_posts[0].view_count) * 100
                : 0
              return (
                <div key={p.slug}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-[#6A6460] w-4 flex-shrink-0">
                        #{i + 1}
                      </span>
                      <span className="text-sm text-[#F0EDE8] truncate">{p.title}</span>
                    </div>
                    <span className="text-xs text-gold font-semibold ml-3 flex-shrink-0">
                      {p.view_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: CAT_COLORS[p.category] ?? '#D4AF37' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── VIEWS BY CATEGORY ── */}
        <div className="bg-bg-2 border border-border rounded-xl p-6">
          <h2 className="font-semibold text-sm mb-5">Views by Category</h2>
          <div className="space-y-4">
            {data.views_by_category.length === 0 && (
              <p className="text-[#6A6460] text-xs">No data yet.</p>
            )}
            {data.views_by_category
              .sort((a, b) => b.views - a.views)
              .map(c => {
                const pct = (c.views / maxCatViews) * 100
                const color = CAT_COLORS[c.category] ?? '#888'
                return (
                  <div key={c.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm" style={{ color }}>{c.category}</span>
                      <span className="text-xs text-[#9A9490] font-semibold">{c.views.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* ── RECENT COMMENTS ── */}
      <div className="bg-bg-2 border border-border rounded-xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-sm">Recent Comments</h2>
          <a href="/admin/comments" className="text-gold text-xs font-semibold hover:text-gold-light">
            Manage all →
          </a>
        </div>
        {data.recent_comments.length === 0 ? (
          <p className="text-[#6A6460] text-xs">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {data.recent_comments.slice(0, 5).map(c => (
              <div key={c.id} className="flex justify-between items-start gap-4 py-3 border-b border-border last:border-0">
                <div>
                  <span className="text-sm font-semibold text-[#F0EDE8]">{c.author_name}</span>
                  <p className="text-xs text-[#9A9490] mt-0.5 line-clamp-2">{c.body}</p>
                </div>
                <span className="text-xs text-[#6A6460] flex-shrink-0">{c.created_at?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
