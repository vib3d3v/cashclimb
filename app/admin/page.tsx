import { createAdminClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [postsRes, commentsRes, viewsRes, recentRes] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('approved', false),
    supabase.from('page_views').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id, title, slug, view_count, category, published, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total Posts',      value: postsRes.count ?? 0,    href: '/admin/posts',    color: '#D4AF37' },
    { label: 'Total Views',      value: (viewsRes.count ?? 0).toLocaleString(), href: '/admin/analytics', color: '#4A9B8E' },
    { label: 'Pending Comments', value: commentsRes.count ?? 0, href: '/admin/comments', color: '#C4704A' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="text-[#9A9490] text-sm mt-1">Welcome back to CashClimb Admin.</p>
        </div>
        <Link href="/admin/posts/new" className="cc-btn-primary">+ New Post</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-bg-2 border border-border rounded-xl p-6 hover:border-gold transition-colors">
            <div className="font-serif text-4xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[#9A9490] text-sm">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent posts */}
      <div className="bg-bg-2 border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-sm">Recent Posts</h2>
          <Link href="/admin/posts" className="text-gold text-xs font-semibold hover:text-gold-light">View all →</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Title', 'Category', 'Views', 'Status', 'Date', ''].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-bold tracking-widest uppercase text-[#6A6460]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentRes.data?.map(p => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg-3 transition-colors">
                <td className="px-6 py-4 text-sm font-medium max-w-[220px] truncate">{p.title}</td>
                <td className="px-6 py-4 text-xs text-[#9A9490]">{p.category}</td>
                <td className="px-6 py-4 text-xs text-[#9A9490]">{p.view_count}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded
                    ${p.published ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {p.published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-[#6A6460]">{p.created_at?.slice(0, 10)}</td>
                <td className="px-6 py-4">
                  <Link href={`/admin/posts/${p.id}/edit`} className="text-gold text-xs font-semibold hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
