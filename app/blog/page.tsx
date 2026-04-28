import { createAdminClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PostCard from '@/components/PostCard'
import type { Post } from '@/types'
import type { Metadata } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')
const canonicalUrl = `${siteUrl}/blog`
const socialImage = `${siteUrl}/opengraph-image`

const CATEGORIES = [
  'All',
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

export const metadata: Metadata = {
  title: 'CashClimb Articles',
  description:
    'Browse practical, plain-English articles on personal finance, investing, debt, retirement, credit, and real-world money decisions.',
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'CashClimb Articles',
    description:
      'Browse practical, plain-English articles on personal finance, investing, debt, retirement, credit, and real-world money decisions.',
    url: canonicalUrl,
    type: 'website',
    images: [{ url: socialImage, width: 1200, height: 630, alt: 'CashClimb Articles' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CashClimb Articles',
    description:
      'Browse practical, plain-English articles on personal finance, investing, debt, retirement, credit, and real-world money decisions.',
    images: [socialImage],
  },
}

export const revalidate = 300

interface Props {
  searchParams: { category?: string; search?: string }
}

export default async function BlogPage({ searchParams }: Props) {
  const supabase = createAdminClient()
  const category = searchParams.category
  const search = searchParams.search

  let query = supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (category && category !== 'All') query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data } = await query
  const posts: Post[] = data ?? []

  return (
    <>
      <Navbar />

      <div className="bg-bg-2 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-3">
            Article Library
          </p>
          <h1 className="font-serif text-4xl font-black mb-3">
            Practical financial guidance for real-world decisions.
          </h1>
          <p className="text-[#9A9490] max-w-2xl leading-relaxed">
            Explore clear, plain-English articles on investing, debt,
            retirement, credit, property, and personal finance.
          </p>

          <form method="GET" action="/blog" className="mt-8 flex flex-wrap gap-3 items-center">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search articles…"
              className="cc-input max-w-xs"
            />

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="submit"
                name="category"
                value={cat === 'All' ? '' : cat}
                className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide border transition-colors ${
                  (cat === 'All' && !category) || category === cat
                    ? 'bg-gold border-gold text-bg'
                    : 'border-border text-[#9A9490] hover:border-gold hover:text-gold'
                }`}
              >
                {cat}
              </button>
            ))}
          </form>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {posts.length > 0 ? (
          <>
            <p className="text-[#6A6460] text-sm mb-6">
              {posts.length} article{posts.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-[#F0EDE8] mb-2">
              No articles found
            </p>
            <p className="text-[#9A9490] text-sm">
              Try a different search term or category.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}