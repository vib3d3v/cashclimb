import { createAdminClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Ticker from '@/components/Ticker'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import type { Post } from '@/types'

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37',
  'Personal Finance': '#4A9B8E',
  Credit: '#C4704A',
  Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A',
  Retirement: '#C46A8A',
}

const CATEGORIES = [
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

export const revalidate = 60

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
            <Link href="/#standards" className="cc-btn-ghost inline-block">
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
                      {featured.author || 'CashClimb Editorial'}
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
            {[
              ['What readers need', 'Clear, useful explanations'],
              ['What builds trust', 'Visible editorial standards'],
              ['What makes it useful', 'Articles plus practical tools'],
            ].map(([title, body]) => (
              <div key={title} className="bg-bg-2 border border-border rounded-xl p-5">
                <div className="text-xs font-bold tracking-widest uppercase text-gold mb-2">
                  {title}
                </div>
                <div className="text-sm text-[#F0EDE8]">{body}</div>
              </div>
            ))}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold section-title">
              Featured Article
            </h2>
          </div>

          <Link
            href={`/blog/${featured.slug}`}
            className="grid grid-cols-1 md:grid-cols-2 bg-bg-2 border border-border rounded-2xl overflow-hidden hover:border-gold transition-colors group"
          >
            <div className="relative min-h-[280px] bg-gradient-to-br from-[#0D1A14] to-[#1A1000] flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)',
                  backgroundSize: '14px 14px',
                }}
              />
              <span className="font-serif text-[8rem] font-black text-gold opacity-[0.12] leading-none select-none">
                {featured.title[0]}
              </span>
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
                  By {featured.author || 'CashClimb Editorial'}
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

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="font-serif text-2xl font-bold section-title mb-6">
          Browse by Topic
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className="border border-border rounded-2xl p-5 bg-bg-2 hover:border-gold transition-colors"
            >
              <div className="font-serif text-xl font-bold text-[#F0EDE8] mb-2">
                {cat}
              </div>
              <div className="text-sm text-[#9A9490]">
                Explore practical guides and commentary in {cat.toLowerCase()}.
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="standards" className="border-y border-border bg-bg-2">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
            Editorial Standards
          </p>
          <h2 className="font-serif text-4xl font-black mb-6">
            Authority comes from process, not just a polished headline.
          </h2>
          <p className="text-[#9A9490] max-w-3xl leading-relaxed mb-10">
            A trustworthy finance site should show how content is created,
            reviewed, updated, and framed for readers making real money decisions.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-bg border border-border rounded-2xl p-6">
              <h3 className="font-serif text-xl font-bold mb-3 text-[#F0EDE8]">
                How we publish
              </h3>
              <p className="text-sm text-[#9A9490] leading-relaxed">
                Every guide should answer a real financial question and avoid
                hype, fear, and vague promises.
              </p>
            </div>

            <div className="bg-bg border border-border rounded-2xl p-6">
              <h3 className="font-serif text-xl font-bold mb-3 text-[#F0EDE8]">
                How we review
              </h3>
              <p className="text-sm text-[#9A9490] leading-relaxed">
                Articles should show the author, last updated date, review
                status, and when the guidance may depend on changing conditions.
              </p>
            </div>

            <div className="bg-bg border border-border rounded-2xl p-6">
              <h3 className="font-serif text-xl font-bold mb-3 text-[#F0EDE8]">
                How we earn trust
              </h3>
              <p className="text-sm text-[#9A9490] leading-relaxed">
                No paid rankings, no sponsored placements, and no disguised
                incentives presented as advice.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Author bio module',
              'Last updated and review date',
              'Clear educational disclaimer',
              'Topic-specific trust signals',
              'Better article summaries',
              'Reader-first explanations',
              'No inflated claims',
              'Practical tools and calculators',
            ].map((item) => (
              <div
                key={item}
                className="border border-border rounded-xl p-4 text-sm text-[#9A9490] bg-bg"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
          Helpful Tools
        </p>
        <h2 className="font-serif text-4xl font-black mb-6">
          Useful tools make the site feel like a financial resource, not just a blog.
        </h2>
        <p className="text-[#9A9490] max-w-3xl leading-relaxed mb-10">
          These can start as simple landing pages or coming-soon blocks. Their
          presence immediately makes the brand feel more useful and more serious.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Compound Growth Calculator',
              text: 'Show how time, return assumptions, and ongoing contributions affect long-term wealth.',
            },
            {
              title: 'Debt Payoff Planner',
              text: 'Compare repayment strategies and make interest costs easier to understand.',
            },
            {
              title: 'ETF Fee Impact Tool',
              text: 'Show how fees affect portfolio value over time.',
            },
            {
              title: 'Emergency Fund Target',
              text: 'Help readers estimate a more practical cash buffer.',
            },
          ].map((tool) => (
            <div
              key={tool.title}
              className="bg-bg-2 border border-border rounded-2xl p-6 hover:border-gold transition-colors"
            >
              <h3 className="font-serif text-xl font-bold mb-3 text-[#F0EDE8]">
                {tool.title}
              </h3>
              <p className="text-sm text-[#9A9490] leading-relaxed">
                {tool.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-bg-2">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
            People Behind the Content
          </p>
          <h2 className="font-serif text-4xl font-black mb-6">
            Show the humans responsible for the guidance.
          </h2>
          <p className="text-[#9A9490] max-w-3xl leading-relaxed mb-10">
            Even if you start with one editorial identity, this section improves
            credibility far more than anonymous publishing.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'CashClimb Editorial',
                role: 'Investing & Personal Finance',
                bio: 'Focused on practical investing, debt, and wealth-building guidance written for clarity.',
              },
              {
                name: 'Market & Strategy',
                role: 'Wealth Building',
                bio: 'Covers long-term investing, portfolio thinking, and financial decision-making frameworks.',
              },
              {
                name: 'Reader-Focused Guides',
                role: 'Money Basics',
                bio: 'Explains financial topics in plain English so readers can make better decisions with less noise.',
              },
            ].map((person) => (
              <div
                key={person.name}
                className="bg-bg border border-border rounded-2xl p-6"
              >
                <div className="font-serif text-2xl font-bold text-[#F0EDE8] mb-2">
                  {person.name}
                </div>
                <div className="text-sm text-gold font-semibold mb-4">
                  {person.role}
                </div>
                <p className="text-sm text-[#9A9490] leading-relaxed">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
              Newsletter
            </p>
            <h2 className="font-serif text-4xl font-black mb-6">
              Build a newsletter people actually trust.
            </h2>
            <p className="text-[#9A9490] leading-relaxed max-w-xl">
              A stronger signup message is specific, restrained, and useful. It
              should sound like a reader benefit, not a growth hack.
            </p>
          </div>

          <div className="bg-bg-2 border border-border rounded-2xl p-8">
            <h3 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              Get smarter about money, one email at a time.
            </h3>
            <p className="text-[#9A9490] text-sm leading-relaxed mb-4">
              Weekly investing and personal finance insights, plus new guides
              and tools when they are actually worth your time.
            </p>
            <p className="text-xs text-[#6A6460] leading-relaxed">
              No spam. No paid promotions disguised as advice.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-7xl mx-auto px-6 pb-20">
        <p className="text-xs font-bold tracking-widest uppercase text-gold mb-4">
          Reader FAQ
        </p>
        <h2 className="font-serif text-4xl font-black mb-10">
          A stronger FAQ removes friction and reinforces credibility.
        </h2>

        <div className="grid gap-4">
          {[
            {
              q: 'Is CashClimb financial advice?',
              a: 'No. CashClimb provides educational content and general financial commentary, not personalised advice.',
            },
            {
              q: 'How does CashClimb make money?',
              a: 'If you have no sponsorships, paid rankings, or affiliate incentives, say that clearly. If that changes later, disclose it plainly.',
            },
            {
              q: 'Who writes and reviews the articles?',
              a: 'Each article should identify the author, update date, and review status so readers can judge freshness and relevance.',
            },
            {
              q: 'Why should readers trust the content?',
              a: 'Because the site explains how content is written, what its limits are, and avoids hype or hidden incentives.',
            },
          ].map((item) => (
            <div
              key={item.q}
              className="bg-bg-2 border border-border rounded-2xl p-6"
            >
              <h3 className="font-serif text-xl font-bold text-[#F0EDE8] mb-3">
                {item.q}
              </h3>
              <p className="text-sm text-[#9A9490] leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
