import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PostCard from '@/components/PostCard'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorBySlug } from '@/lib/authors'
import type { Post } from '@/types'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const author = getAuthorBySlug(params.slug)

  if (!author) return {}

  return {
    title: `${author.name} | CashClimb Author`,
    description: author.intro,
    alternates: {
      canonical: `${siteUrl}/authors/${author.slug}`,
    },
    openGraph: {
      title: `${author.name} | CashClimb`,
      description: author.intro,
      url: `${siteUrl}/authors/${author.slug}`,
      type: 'profile',
      images: [{ url: `${siteUrl}/opengraph-image` }],
    },
  }
}

export default async function AuthorPage({
  params,
}: {
  params: { slug: string }
}) {
  const author = getAuthorBySlug(params.slug)

  if (!author) notFound()

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('author', author.name)
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as Post[]

  const schema = {
    '@context': 'https://schema.org',
    '@type': author.schemaType,
    name: author.name,
    url: `${siteUrl}/authors/${author.slug}`,
    description: author.intro,
    jobTitle: author.role,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="max-w-7xl mx-auto px-6 py-14">
        <Link href="/blog" className="text-sm text-gold font-semibold hover:opacity-80">
          ← Back to articles
        </Link>

        <section className="mt-8 rounded-3xl border border-border bg-bg-2 p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-24 h-24 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-2xl font-black">
              {author.initials}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">
                CashClimb contributor
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-black text-[#F0EDE8]">
                {author.name}
              </h1>
              <p className="text-[#9A9490] mt-2">{author.role}</p>
              <p className="text-[#B7B0AA] leading-relaxed mt-4 max-w-3xl">
                {author.intro}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {author.topics.map((topic) => (
              <div
                key={topic}
                className="rounded-2xl border border-border bg-bg p-4 text-sm text-[#D7D0CA]"
              >
                {topic}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="rounded-3xl border border-border bg-bg-2 p-8">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-4">
              Bio
            </p>

            <div className="space-y-5 text-[#B7B0AA] leading-relaxed">
              {author.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-bg-2 p-8">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-4">
              Editorial note
            </p>
            <p className="text-sm text-[#B7B0AA] leading-relaxed">
              CashClimb content is created for educational purposes and reviewed
              for clarity, usefulness, and responsible financial framing.
            </p>
          </aside>
        </section>

        <section className="mt-12">
          <p className="text-xs uppercase tracking-widest text-gold font-bold mb-4">
            Articles by {author.name}
          </p>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-bg-2 p-10 text-center">
              <p className="text-[#F0EDE8] font-serif text-2xl mb-2">
                No articles yet
              </p>
              <p className="text-[#9A9490]">
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