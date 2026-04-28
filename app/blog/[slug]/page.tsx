export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorByName } from '@/lib/authors'
import { getAutoAuthor } from '@/lib/seo-authors'
import type { Post } from '@/types'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')

function formatDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function getPost(slug: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  return data as Post | null
}

async function getRelatedPosts(post: Post) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', post.category)
    .neq('id', post.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (data ?? []) as Post[]
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPost(params.slug)

  if (!post) return {}

  const url = `${siteUrl}/blog/${post.slug}`
  const image = post.cover_url || `${siteUrl}/opengraph-image`

  return {
    title: `${post.title} | CashClimb`,
    description: post.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      images: [{ url: image }],
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)

  if (!post) notFound()

  const fallbackAuthor = getAutoAuthor('cashclimb', post.category)

  const authorName =
    !post.author || post.author.toLowerCase().includes('editorial')
      ? fallbackAuthor.name
      : post.author

  const author = getAuthorByName(authorName)
  const relatedPosts = await getRelatedPosts(post)
  const articleUrl = `${siteUrl}/blog/${post.slug}`
  const image = post.cover_url || `${siteUrl}/opengraph-image`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': author.schemaType,
      name: author.name,
      url: `${siteUrl}/authors/${author.slug}`,
      description: author.intro,
      knowsAbout: author.topics,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CashClimb',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/opengraph-image`,
      },
    },
    mainEntityOfPage: articleUrl,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${post.title} financial advice?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. CashClimb content is for informational and educational purposes only and should not be treated as personal financial advice.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who reviews CashClimb content?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CashClimb articles are created and reviewed by the editorial team for clarity, usefulness, and responsible personal finance guidance.',
        },
      },
    ],
  }

  return (
    <>
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <article className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            <div className="mb-8">
              <Link
                href="/blog"
                className="text-sm text-gold font-semibold hover:opacity-80"
              >
                ← Back to articles
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest font-bold text-[#9A9490]">
                <span className="text-gold">{post.category}</span>
                <span>{formatDate(post.updated_at || post.created_at)}</span>
                <span>{post.read_time}</span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl font-black leading-tight mt-4 text-[#F0EDE8]">
                {post.title}
              </h1>

              <p className="text-[#B7B0AA] text-lg leading-relaxed mt-5 max-w-3xl">
                {post.excerpt}
              </p>
            </div>

            <Link
              href={`/authors/${author.slug}`}
              className="mb-8 block rounded-2xl border border-border bg-bg-2 p-5 hover:border-gold transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-sm font-bold">
                  {author.initials}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-gold font-bold">
                    Written by
                  </p>
                  <h2 className="text-[#F0EDE8] font-bold mt-1">{author.name}</h2>
                  <p className="text-sm text-[#9A9490] mt-1">{author.role}</p>
                  <p className="text-sm text-[#B7B0AA] leading-relaxed mt-2">
                    {author.intro}
                  </p>
                </div>
              </div>
            </Link>

            {post.cover_url ? (
              <div className="relative aspect-[16/8] rounded-3xl overflow-hidden border border-border mb-10">
                <Image
                  src={post.cover_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-bg-2 p-5 mb-8">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                Key takeaways
              </p>
              <ul className="space-y-2 text-sm text-[#D7D0CA] leading-relaxed">
                <li>Use this guide as educational information, not personal financial advice.</li>
                <li>Compare options carefully before making money decisions.</li>
                <li>Focus on practical actions that match your income, goals, and risk level.</li>
              </ul>
            </div>

            <div
              className="prose-cashclimb"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            <div className="mt-10 rounded-2xl border border-border bg-bg-2 p-5">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                Financial disclaimer
              </p>
              <p className="text-sm text-[#B7B0AA] leading-relaxed">
                This content is for informational and educational purposes only.
                It does not constitute financial, investment, tax, or legal advice.
                Always consider your personal situation and consult a qualified professional
                before making financial decisions.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-bg-2 p-6">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                Reviewed by
              </p>
              <h2 className="text-[#F0EDE8] font-bold">{fallbackAuthor.reviewerName}</h2>
              <p className="text-sm text-[#9A9490]">{fallbackAuthor.reviewerRole}</p>
              <p className="text-sm text-[#B7B0AA] leading-relaxed mt-3">
                {fallbackAuthor.reviewerBio}
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-bg-2 p-6">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                About the author
              </p>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-sm font-bold">
                  {author.initials}
                </div>
                <div>
                  <h2 className="text-[#F0EDE8] font-bold">{author.name}</h2>
                  <p className="text-sm text-[#9A9490]">{author.role}</p>
                  <p className="text-sm text-[#B7B0AA] leading-relaxed mt-3">
                    {author.bio.join(' ')}
                  </p>
                  <Link
                    href={`/authors/${author.slug}`}
                    className="inline-flex mt-4 text-sm text-gold font-semibold hover:opacity-80"
                  >
                    View author profile →
                  </Link>
                </div>
              </div>
            </div>

            {relatedPosts.length > 0 ? (
              <section className="mt-12">
                <p className="text-xs uppercase tracking-widest text-gold font-bold mb-4">
                  Related guides
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.id}
                      href={`/blog/${item.slug}`}
                      className="rounded-2xl border border-border bg-bg-2 p-5 hover:border-gold transition-colors"
                    >
                      <p className="text-xs text-gold font-bold mb-2">
                        {item.category}
                      </p>
                      <h3 className="text-[#F0EDE8] font-bold leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#9A9490] mt-3 line-clamp-3">
                        {item.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-border bg-bg-2 p-5 sticky top-6">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                Article details
              </p>
              <div className="space-y-3 text-sm text-[#B7B0AA]">
                <p>
                  <strong className="text-[#F0EDE8]">Category:</strong> {post.category}
                </p>
                <p>
                  <strong className="text-[#F0EDE8]">Updated:</strong>{' '}
                  {formatDate(post.updated_at || post.created_at)}
                </p>
                <p>
                  <strong className="text-[#F0EDE8]">Read time:</strong> {post.read_time}
                </p>
                <p>
                  <strong className="text-[#F0EDE8]">Author:</strong> {author.name}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-bg-2 p-5">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                Reviewed by
              </p>
              <p className="text-sm text-[#B7B0AA] leading-relaxed">
                <strong className="text-[#F0EDE8]">{fallbackAuthor.reviewerName}</strong> — {fallbackAuthor.reviewerBio}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-bg-2 p-5">
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                Editorial standard
              </p>
              <p className="text-sm text-[#B7B0AA] leading-relaxed">
                CashClimb aims to publish clear, useful, beginner-friendly financial
                education with responsible disclaimers and practical examples.
              </p>
            </div>
          </aside>
        </article>
      </main>

      <Footer />
    </>
  )
}