export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PostCard from '@/components/PostCard'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorBySlug, resolvePostAuthorName } from '@/lib/authors'
import type { Post } from '@/types'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const author = getAuthorBySlug(params.slug)

  if (!author) return {}

  const url = `${siteUrl}/authors/${author.slug}`

  return {
    title: `${author.name} | CashClimb Author`,
    description: author.intro,
    alternates: { canonical: url },
    openGraph: {
      title: `${author.name} | CashClimb Author`,
      description: author.intro,
      url,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${author.name} | CashClimb Author`,
      description: author.intro,
    },
  }
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author = getAuthorBySlug(params.slug)

  if (!author) notFound()

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  const posts = ((data ?? []) as Post[]).filter(
    (post) => resolvePostAuthorName(post) === author.name
  )

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': author.schemaType,
    '@id': `${siteUrl}/authors/${author.slug}#person`,
    name: author.name,
    url: `${siteUrl}/authors/${author.slug}`,
    jobTitle: author.role,
    description: author.intro,
    knowsAbout: author.topics,
    worksFor: {
      '@type': 'Organization',
      name: 'CashClimb',
      url: siteUrl,
    },
  }

  return (
    <>
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="rounded-3xl border border-border bg-bg-2 p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-20 h-20 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-xl font-bold tracking-wide flex-shrink-0">
              {author.initials}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">
                CashClimb Author
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-black leading-tight text-[#F0EDE8]">
                {author.name}
              </h1>
              <p className="text-[#9A9490] mt-2 font-semibold">{author.role}</p>
              <p className="text-[#B7B0AA] mt-4 max-w-3xl leading-relaxed">
                {author.intro}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {author.topics.map((topic) => (
              <div key={topic} className="rounded-2xl border border-border bg-bg p-4 text-sm text-[#D7D0CA]">
                {topic}
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-10">
          <div className="rounded-3xl border border-border bg-bg-2 p-8">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-5">Bio</p>
            <div className="space-y-5 text-[#B7B0AA] leading-relaxed">
              {author.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-bg-2 p-8 h-fit">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-5">
              Editorial note
            </p>
            <p className="text-sm text-[#B7B0AA] leading-relaxed">
              CashClimb content is created for educational purposes and reviewed for clarity, usefulness, and responsible financial framing.
            </p>
          </aside>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">
                Articles by {author.name}
              </p>
              <h2 className="font-serif text-3xl font-bold text-[#F0EDE8]">
                Published guides
              </h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-gold hover:opacity-80">
              All articles →
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-bg-2 p-10 text-center">
              <p className="font-serif text-2xl text-[#F0EDE8] mb-2">No articles yet</p>
              <p className="text-[#9A9490] text-sm">
                New guides from this contributor will appear here.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
