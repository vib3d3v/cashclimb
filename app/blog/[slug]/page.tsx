import { createAdminClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Comments from '@/components/Comments'
import PostCard from '@/components/PostCard'
import ViewTracker from '@/components/ViewTracker'
import { getAuthorByName } from '@/lib/authors'
import type { Post, Comment } from '@/types'

export const revalidate = 60

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37',
  'Personal Finance': '#4A9B8E',
  Credit: '#C4704A',
  Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A',
  Retirement: '#C46A8A',
}

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createAdminClient()
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')

  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, cover_url, seo_title, seo_description, created_at, updated_at, published')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle()

  if (!data) return {}

  const metaTitle = data.seo_title || data.title
  const metaDescription = data.seo_description || data.excerpt
  const canonicalUrl = `${siteUrl}/blog/${data.slug}`
  const socialImage = data.cover_url || `${siteUrl}/opengraph-image`

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      images: [{ url: socialImage }],
      type: 'article',
      publishedTime: data.created_at || undefined,
      modifiedTime: data.updated_at || data.created_at || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [socialImage],
    },
  }
}

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true)

  return data?.map((p) => ({ slug: p.slug })) ?? []
}

function cleanPostBody(html: string): string {
  return html
    .replace(/rel="noopener noreferrer nofollow"/g, 'target="_blank" rel="noopener noreferrer"')
    .replace(/rel="noreferrer nofollow"/g, 'target="_blank" rel="noopener noreferrer"')
    .replace(/rel="nofollow"/g, '')
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function PostPage({ params }: Props) {
  const supabase = createAdminClient()

  const [postRes, commentsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('slug', params.slug)
      .eq('published', true)
      .single(),
    supabase
      .from('comments')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: true }),
  ])

  if (!postRes.data) notFound()

  const post: Post = postRes.data
  const color = CAT_COLORS[post.category] ?? '#888'

  const comments: Comment[] = (commentsRes.data ?? []).filter(
    (comment: any) => comment.post_id === post.id
  )

  const author = getAuthorByName(post.author)

  const { data: related } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', post.category)
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <>
      <Navbar />
      <ViewTracker postId={post.id} path={`/blog/${post.slug}`} />

      <main>
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-0">
          <Link
            href="/blog"
            className="text-[#9A9490] text-sm hover:text-gold transition-colors inline-flex items-center gap-2 mb-8"
          >
            ← Back to Articles
          </Link>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className="cat-badge"
              style={{ background: `${color}22`, color }}
            >
              {post.category}
            </span>
            <span className="cat-badge bg-[#1A1A1A] text-[#F0EDE8]">
              Reviewed
            </span>
          </div>

          <h1 className="font-serif text-4xl lg:text-5xl font-black leading-[1.1] mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-[#B8B1AC] leading-relaxed mb-8">
              {post.excerpt}
            </p>
          )}

          <div className="bg-bg-2 border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-sm font-bold tracking-wide flex-shrink-0">
                {author.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                  <Link
                    href={`/authors/${author.slug}`}
                    className="text-[#F0EDE8] font-semibold hover:text-gold transition-colors"
                  >
                    {author.name}
                  </Link>

                  <div className="text-sm text-gold">
                    {author.role}
                  </div>
                </div>

                <p className="text-sm text-[#9A9490] leading-relaxed mb-4">
                  {author.intro}
                </p>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Last updated</div>
                    <div className="text-[#F0EDE8] font-semibold">
                      {formatDate(post.updated_at || post.created_at)}
                    </div>
                  </div>

                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Reading time</div>
                    <div className="text-gold font-semibold">
                      {post.read_time}
                    </div>
                  </div>

                  <div className="bg-bg border border-border rounded-xl p-4">
                    <div className="text-[#6A6460] mb-1">Reviewed by</div>
                    <div className="text-[#F0EDE8] font-semibold">
                      CashClimb Editorial
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6">
          {post.cover_url ? (
            <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-bg-2">
              <img
                src={post.cover_url}
                alt={post.title}
                className="block w-full h-auto max-h-[520px] object-cover"
              />
            </div>
          ) : (
            <div className="mb-10 h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D1A14] to-[#1A1000] relative flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)',
                  backgroundSize: '14px 14px',
                }}
              />
              <span className="font-serif text-[8rem] font-black text-gold opacity-[0.12] leading-none">
                {post.title[0]}
              </span>
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-8 bg-bg-2 border border-border rounded-2xl p-6">
            <h2 className="font-serif text-xl font-bold mb-3 text-[#F0EDE8]">
              What this article is for
            </h2>
            <p className="text-sm text-[#9A9490] leading-relaxed">
              This guide is educational. It is designed to help readers
              understand the topic, key tradeoffs, and practical next steps
              before making important financial decisions.
            </p>
          </div>

          <article
            className="prose-cashclimb"
            dangerouslySetInnerHTML={{ __html: cleanPostBody(post.body) }}
          />

          <div className="mt-10 bg-bg-2 border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-sm font-bold tracking-wide flex-shrink-0">
                {author.initials}
              </div>

              <div>
                <p className="text-sm text-[#6A6460] mb-1">
                  About the author
                </p>

                <h2 className="text-[#F0EDE8] font-semibold mb-1">
                  <Link
                    href={`/authors/${author.slug}`}
                    className="hover:text-gold transition-colors"
                  >
                    {author.name}
                  </Link>
                </h2>

                <p className="text-sm text-gold mb-3">
                  {author.role}
                </p>

                <p className="text-sm text-[#9A9490] leading-relaxed mb-4">
                  {author.intro}
                </p>

                <Link
                  href={`/authors/${author.slug}`}
                  className="text-sm font-semibold text-gold hover:opacity-80 transition-opacity"
                >
                  View author page
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4">
            <div className="p-5 bg-bg-2 border border-border rounded-xl">
              <p className="text-sm text-[#9A9490] leading-relaxed">
                <strong className="text-[#F0EDE8]">Editorial note:</strong> CashClimb
                aims to provide clear, plain-English financial education.
              </p>
            </div>

            <div className="p-5 bg-bg-2 border border-border rounded-xl">
              <p className="text-sm text-[#9A9490] leading-relaxed">
                <strong className="text-[#F0EDE8]">Disclaimer:</strong> Informational only.
              </p>
            </div>
          </div>

          <Comments postId={post.id} initial={comments} />
        </div>
      </main>

      {related && related.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <h2 className="font-serif text-2xl font-bold section-title mb-6">
            More in {post.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(related as Post[]).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}