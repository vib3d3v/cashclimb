import Link from 'next/link'
import AdminSignOutLink from '@/components/admin/AdminSignOutLink'

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/posts/new', label: '✏️  New Post' },
  { href: '/admin/posts', label: '📋 All Posts' },
  { href: '/admin/keywords', label: '🔎 Keywords' },
  { href: '/admin/comments', label: '💬 Comments' },
  { href: '/admin/workflow', label: '🧭 Workflow' },
  { href: '/admin/analytics', label: '📈 Analytics' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-56 flex-shrink-0 bg-bg-2 border-r border-border flex flex-col">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="w-7 h-7 bg-gold flex items-center justify-center text-bg font-black text-xs flex-shrink-0" style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
            C
          </div>
          <span className="font-serif font-bold text-lg">Cash<span className="text-gold">Climb</span></span>
        </Link>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#9A9490] hover:text-[#F0EDE8] hover:bg-bg-3 transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <AdminSignOutLink />
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </div>
    </div>
  )
}
