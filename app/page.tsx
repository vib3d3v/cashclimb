import { createAdminClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Ticker from '@/components/Ticker'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import type { Post } from '@/types'

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37', 'Personal Finance': '#4A9B8E',
  Credit: '#C4704A', Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A', Retirement: '#C46A8A',
}
const CATEGORIES = ['Investing', 'Personal Finance', 'Credit', 'Taxes', 'Real Estate', 'Retirement']

export const revalidate = 60 // ISR: regenerate every 60s

export default async function HomePage() {
  const supabase = createAdminClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(7)

  const allPosts: Post[] = posts ?? []
  const [featured, ...rest] = allPosts

  return (
    <>
      <Navbar />
      <Ticker />

      {/* ── HERO ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gold mb-4">
            📈 Personal Finance &amp; Investing Intelligence
          </p>
          <h1 className="font-serif text-5xl lg:text-6xl font-black leading-[1.08] mb-6">
            Master Your Money.<br />
            <em className="text-gold not-italic">Build Real Wealth.</em>
          </h1>
          <p className="text-[#9A9490] text-lg leading-relaxed mb-8 max-w-lg">
            CashClimb delivers clear, jargon-free financial insights — from investing fundamentals to advanced
            wealth strategies — written for people who take their financial future seriously.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/blog" className="cc-btn-primary inline-block">Read Articles</Link>
            <Link href="/admin" className="cc-btn-ghost inline-block">Write a Post</Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: `${allPosts.length}+`, l: 'Articles' },
            { n: '6', l: 'Topics' },
            { n: '100%', l: 'Free' },
            { n: '$0', l: 'Ads / Paywalls' },
            { n: '5★', l: 'Reader Rating' },
            { n: '∞', l: 'Value' },
          ].map(s => (
            <div key={s.l} className="bg-bg-2 border border-border rounded-xl p-5">
              <div className="font-serif text-3xl font-black text-gold">{s.n}</div>
              <div className="text-[#9A9490] text-xs mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────────── */}
      {featured && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold section-title">Featured Article</h2>
          </div>
          <Link
            href={`/blog/${featured.slug}`}
            className="grid grid-cols-1 md:grid-cols-2 bg-bg-2 border border-border rounded-2xl
                       overflow-hidden hover:border-gold transition-colors group"
          >
            {/* Cover / pattern */}
            <div className="relative min-h-[280px] bg-gradient-to-br from-[#0D1A14] to-[#1A1000] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />
              <span className="font-serif text-[8rem] font-black text-gold opacity-[0.12] leading-none select-none">
                {featured.title[0]}
              </span>
            </div>
            {/* Body */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex gap-2 mb-4">
                <span className="cat-badge bg-gold text-bg">Featured</span>
                <span className="cat-badge" style={{ background: `${CAT_COLORS[featured.category]}22`, color: CAT_COLORS[featured.category] }}>
                  {featured.category}
                </span>
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl font-bold leading-snug text-[#F0EDE8] mb-4 group-hover:text-gold transition-colors">
                {featured.title}
              </h3>
              <p className="text-[#9A9490] leading-relaxed mb-6">{featured.excerpt}</p>
              <div className="flex gap-4 text-sm flex-wrap">
                <span className="text-[#9A9490]">By {featured.author}</span>
                <span className="text-[#6A6460]">{featured.created_at?.slice(0, 10)}</span>
                <span className="text-gold font-semibold">{featured.read_time} read</span>
              </div>
              <span className="mt-6 text-gold font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Read Article →
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* ── LATEST ARTICLES ──────────────────────── */}
      {rest.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold section-title">Latest Articles</h2>
            <Link href="/blog" className="text-gold text-sm font-semibold hover:text-gold-light transition-colors">
              See All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.slice(0, 3).map(post => <PostCard key={post.id} post={post} />)}
          </div>
        </section>
      )}

      {/* ── TOPICS ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="font-serif text-2xl font-bold section-title mb-6">Browse by Topic</h2>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className="border border-border rounded-full px-5 py-2.5 text-sm font-semibold
                         text-[#9A9490] hover:border-gold hover:text-gold transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
