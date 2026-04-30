'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminSignOutLink from './AdminSignOutLink'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/posts/new', label: 'Write', icon: '✏️' },
  { href: '/admin/posts', label: 'All Posts', icon: '📋' },
  { href: '/admin/keywords', label: 'Keywords', icon: '🔎' },
  { href: '/admin/automation', label: 'Automation', icon: '⚙️' },
  { href: '/admin/comments', label: 'Comments', icon: '💬'},
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-bg-2 border-r border-border flex flex-col">
      <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div
          className="w-7 h-7 bg-gold flex items-center justify-center text-bg font-black text-xs flex-shrink-0"
          style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}
        >
          C
        </div>
        <span className="font-serif font-bold text-lg">Cash<span className="text-gold">Climb</span></span>
      </Link>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-bg-3 text-gold border border-border'
                  : 'text-[#9A9490] hover:text-[#F0EDE8] hover:bg-bg-3'
              }`}
            >
              <span className="mr-2">{item.icon}</span>{item.label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 p-4 border-t border-border">
        <Link href="/" className="block rounded-lg border border-border px-3 py-2 text-sm font-medium text-[#9A9490] hover:border-gold hover:text-gold">
          View site
        </Link>
        <AdminSignOutLink />
      </div>
    </aside>
  )
}
