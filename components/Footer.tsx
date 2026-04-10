import Link from 'next/link'

const categories = [
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

export default function Footer() {
  return (
    <footer className="bg-bg-2 border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="font-serif text-xl font-bold mb-3">
              Cash<span className="text-gold">Climb</span>
            </div>
            <p className="text-[#9A9490] text-sm leading-relaxed max-w-xs">
              Practical personal finance and investing guidance built to be
              clear, useful, and trustworthy.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
              Topics
            </div>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/blog?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-[#9A9490] hover:text-gold transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
              Site
            </div>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/blog', label: 'All Articles' },
                { href: '/#faq', label: 'FAQ' },
                { href: '/admin', label: 'Write a Post' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#9A9490] hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
              Trust
            </div>
            <ul className="space-y-2">
              {[
                { href: '/#standards', label: 'Editorial Standards' },
                { href: '/#faq', label: 'Reader FAQ' },
                { href: '/blog', label: 'Reviewed Articles' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#9A9490] hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between gap-4">
          <span className="text-[#6A6460] text-sm">
            © {new Date().getFullYear()} CashClimb. All rights reserved.
          </span>
          <span className="text-[#6A6460] text-xs max-w-md leading-relaxed">
            Content is for informational and educational purposes only and does
            not constitute financial advice. Investing involves risk, including
            possible loss of principal.
          </span>
        </div>
      </div>
    </footer>
  )
}
