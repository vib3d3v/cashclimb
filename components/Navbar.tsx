'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Articles' },
    { href: '/about', label: 'About' },
    { href: '/editorial-standards', label: 'Standards' },
    { href: '/tools', label: 'Tools' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 bg-gold flex items-center justify-center text-bg font-black text-sm"
            style={{ clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}
          >
            C
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">
            Cash<span className="text-gold">Climb</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors ${
                pathname === link.href ? 'text-gold' : 'text-[#9A9490] hover:text-gold'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/admin/login?from=%2Fadmin"
            className="text-xs font-bold tracking-widest uppercase border border-border px-4 py-2 rounded text-[#9A9490] hover:text-gold hover:border-gold transition-all"
          >
            Editor Login
          </Link>

          <Link
            href="/blog"
            className="border border-gold text-gold text-xs font-bold tracking-widest uppercase px-4 py-2 rounded transition-all hover:bg-gold hover:text-bg"
          >
            Read Guides
          </Link>
        </div>

        <button
          className="md:hidden text-[#F0EDE8] text-2xl"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          type="button"
        >
          {open ? 'x' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-bg-2 border-b border-border px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#9A9490] hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/admin/login?from=%2Fadmin"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-[#9A9490] hover:text-gold transition-colors"
          >
            Editor Login
          </Link>

          <Link
            href="/blog"
            onClick={() => setOpen(false)}
            className="text-xs font-bold tracking-widest uppercase text-gold border border-gold rounded px-4 py-2 text-center hover:bg-gold hover:text-bg transition-all"
          >
            Read Guides
          </Link>
        </div>
      )}
    </nav>
  )
}
