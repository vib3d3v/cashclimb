import { createAdminClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Ticker from '@/components/Ticker'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/types'
import type { Metadata } from 'next'
import { getAutoAuthor } from '@/lib/seo-authors'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')
const socialImage = '/opengraph-image'

export const metadata: Metadata = {
  title: 'CashClimb — Personal Finance & Investing Intelligence',
  description:
    'Clear, jargon-free financial insights on investing, personal finance, credit, and wealth-building for people who take their financial future seriously.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CashClimb — Personal Finance & Investing Intelligence',
    description:
      'Clear, jargon-free financial insights on investing, personal finance, credit, and wealth-building for people who take their financial future seriously.',
    url: siteUrl,
    type: 'website',
    images: [{ url: socialImage, width: 1200, height: 630, alt: 'CashClimb' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CashClimb — Personal Finance & Investing Intelligence',
    description:
      'Clear, jargon-free financial insights on investing, personal finance, credit, and wealth-building for people who take their financial future seriously.',
    images: [socialImage],
  },
}

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37',
  'Personal Finance': '#4A9B8E',
  Credit: '#C4704A',
  Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A',
  Retirement: '#C46A8A',
}

export const revalidate = 60

function resolveAuthorName(post?: Post | null) {
  if (!post) return 'Daniel Reeves'

  const fallbackAuthor = getAutoAuthor('cashclimb', post.category)

  if (!post.author || post.author.toLowerCase().includes('editorial')) {
    return fallbackAuthor.name
  }

  return post.author
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

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

      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gold mb-4">
            Independent Financial Education
          </p>

          <h1 className="font-serif text-5xl lg:text-6xl font-black leading-[1.08] mb-6">
            Clear financial guidance that feels credible before it feels clever.
          </h1>

          <p className="text-[#9A9490] text-lg leading-relaxed mb-8 max-w-xl">
            CashClimb helps readers make smarter decisions about investing,
            debt, retirement, and long-term wealth building with practical,
            plain-English guidance and transparent editorial standards.
          </p>

          <div className="flex gap-4 flex-wrap mb-6">
            <Link href="/blog" className="cc-btn-primary inline-block">
              Explore Trusted Guides
            </Link>
            <Link href="/editorial-standards" className="cc-btn-ghost inline-block">
              See Editorial Standards
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              'No sponsored rankings',
              'No ads or paywalls',
              'Reviewed for clarity',
              'Plain-English guidance',
            ].map((item) => (
              <div
                key={item}
                className="bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-[#F0EDE8]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="bg-bg-2 border border-border rounded-2xl p-8">
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="cat-badge bg-gold text-bg">Featured Guide</span>
              {featured && (
                <span
                  className="cat-badge"
                  style={{
                    background: `${CAT_COLORS[featured.category]}22`,
                    color: CAT_COLORS[featured.category],
                  }}
                >
                  {featured.category}
                </span>
              )}
            </div>

            {featured ? (
              <>
                <h2 className="font-serif text-3xl font-bold leading-snug text-[#F0EDE8] mb-4">
                  {featured.title}
                </h2>

                <p className="text-[#9A9490] leading-relaxed mb-6">
                  {featured.excerpt}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Author</div>
                    <div className="text-[#F0EDE8] font-semibold">
                      {resolveAuthorName(featured)}
                    </div>
                  </div>
                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Updated</div>
                    <div className="text-[#F0EDE8] font-semibold">
                      {formatDate(featured.updated_at || featured.created_at)}
                    </div>
                  </div>
                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Reading time</div>
                    <div className="text-[#F0EDE8] font-semibold">
                      {featured.read_time}
                    </div>
                  </div>
                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Review status</div>
                    <div className="text-gold font-semibold">Reviewed</div>
                  </div>
                </div>

                <Link
                  href={`/blog/${featured.slug}`}
                  className="text-gold font-bold text-sm inline-flex items-center gap-2 hover:text-gold-light transition-colors"
                >
                  Read Featured Guide →
                </Link>
              </>
            ) : (
              <>
                <h2 className="font-serif text-3xl font-bold leading-snug text-[#F0EDE8] mb-4">
                  Thoughtful personal finance guidance, built for trust.
                </h2>
                <p className="text-[#9A9490] leading-relaxed">
                  Publish your first reviewed guide to highlight it here.
                </p>
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-bg-2 border border-border rounded-xl p-5">
              <div className="text-xs font-bold tracking-widest uppercase text-gold mb-2">
                What readers need
              </div>
              <div className="text-sm text-[#F0EDE8]">
                Clear, useful explanations
              </div>
            </div>

            <Link
              href="/editorial-standards"
              className="bg-bg-2 border border-border rounded-xl p-5 hover:border-gold transition-colors"
            >
              <div className="text-xs font-bold tracking-widest uppercase text-gold mb-2">
                What builds trust
              </div>
              <div className="text-sm text-[#F0EDE8]">
                Visible editorial standards
              </div>
            </Link>

            <div className="bg-bg-2 border border-border rounded-xl p-5">
              <div className="text-xs font-bold tracking-widest uppercase text-gold mb-2">
                What makes it useful
              </div>
              <div className="text-sm text-[#F0EDE8]">
                Articles plus practical tools
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-bg-2">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-5">
            How CashClimb Works
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Every guide should answer a real financial decision',
              'Content is updated when conditions materially change',
              'No sponsored placements or paid rankings',
              'Written for clarity, not complexity',
            ].map((item) => (
              <div
                key={item}
                className="border border-border rounded-xl p-5 text-sm text-[#9A9490] bg-bg"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {featured && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="font-serif text-2xl font-bold section-title mb-6">
            Featured Article
          </h2>

          <Link
            href={`/blog/${featured.slug}`}
            className="grid grid-cols-1 md:grid-cols-2 bg-bg-2 border border-border rounded-2xl overflow-hidden hover:border-gold transition-colors group"
          >
            <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
              {featured.cover_url ? (
                <>
                  <Image
                    src={featured.cover_url}
                    alt={featured.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-y-0 right-0 hidden md:block w-24 bg-gradient-to-l from-[#111111] via-[#111111]/70 to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="bg-[#111] w-full h-full flex items-center justify-center text-[#666] text-sm">
                  No image
                </div>
              )}
            </div>

            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="cat-badge bg-gold text-bg">Featured</span>
                <span
                  className="cat-badge"
                  style={{
                    background: `${CAT_COLORS[featured.category]}22`,
                    color: CAT_COLORS[featured.category],
                  }}
                >
                  {featured.category}
                </span>
                <span className="cat-badge bg-[#1A1A1A] text-[#F0EDE8]">
                  Reviewed
                </span>
              </div>

              <h3 className="font-serif text-2xl lg:text-3xl font-bold leading-snug text-[#F0EDE8] mb-4 group-hover:text-gold transition-colors">
                {featured.title}
              </h3>

              <p className="text-[#9A9490] leading-relaxed mb-6">
                {featured.excerpt}
              </p>

              <div className="flex gap-4 text-sm flex-wrap mb-6">
                <span className="text-[#9A9490]">
                  By {resolveAuthorName(featured)}
                </span>
                <span className="text-[#6A6460]">
                  Updated {formatDate(featured.updated_at || featured.created_at)}
                </span>
                <span className="text-gold font-semibold">{featured.read_time}</span>
              </div>

              <span className="text-gold font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Read Article →
              </span>
            </div>
          </Link>
        </section>
      )}

      {rest.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold section-title">
              Latest Articles
            </h2>
            <Link
              href="/blog"
              className="text-gold text-sm font-semibold hover:text-gold-light transition-colors"
            >
              See All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}