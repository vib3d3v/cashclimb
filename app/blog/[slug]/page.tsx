import { createAdminClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Comments from '@/components/Comments'
import PostCard from '@/components/PostCard'
import ViewTracker from '@/components/ViewTracker'
import type { Post, Comment } from '@/types'

export const revalidate = 60

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37', 'Personal Finance': '#4A9B8E',
  Credit: '#C4704A', Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A', Retirement: '#C46A8A',
}

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('posts').select('title, excerpt, cover_url').eq('slug', params.slug).single()
  if (!data) return {}
  return {
    title: data.title,
    description: data.excerpt,
    openGraph: {
      title: data.title,
      description: data.excerpt,
      images: data.cover_url ? [data.cover_url] : [],
    },
  }
}

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('posts').select('slug').eq('published', true)
  return data?.map(p => ({ slug: p.slug })) ?? []
}

export default async function PostPage({ params }: Props) {
  const supabase = createAdminClient()

  const [postRes, commentsRes] = await Promise.all([
    supabase.from('posts').select('*').eq('slug', params.slug).eq('published', true).single(),
    supabase.from('comments').select('*').eq('approved', true).order('created_at', { ascending: true }),
  ])

  if (!postRes.data) notFound()

  const post: Post = postRes.data
  const comments: Comment[] = commentsRes.data ?? []

  // Related posts
  const { data: related } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', post.category)
    .neq('id', post.id)
    .limit(3)

  const color = CAT_COLORS[post.category] ?? '#888'

  return (
    <>
      <Navbar />
      {/* Track view (client component, fires once) */}
      <ViewTracker postId={post.id} path={`/blog/${post.slug}`} />

      <main>
        {/* Article header */}
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-0">
          <Link href="/blog" className="text-[#9A9490] text-sm hover:text-gold transition-colors inline-flex items-center gap-2 mb-8">
            ← Back to Articles
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="cat-badge" style={{ background: `${color}22`, color }}>{post.category}</span>
          </div>

          <h1 className="font-serif text-4xl lg:text-5xl font-black leading-[1.1] mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-6 text-sm pb-8 border-b border-border">
            <span className="font-semibold text-[#F0EDE8]">By {post.author}</span>
            <span className="text-[#9A9490]">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="text-gold font-semibold">{post.read_time} read</span>
            <span className="text-[#6A6460]">{post.view_count.toLocaleString()} views</span>
          </div>
        </div>

        {/* Cover image */}
        {post.cover_url ? (
          <div className="max-w-3xl mx-auto px-6 mt-8">
            <div className="relative h-72 lg:h-96 rounded-2xl overflow-hidden">
              <Image src={post.cover_url} alt={post.title} fill className="object-cover" />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 mt-8">
            <div className="h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D1A14] to-[#1A1000] relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />
              <span className="font-serif text-[8rem] font-black text-gold opacity-[0.12] leading-none">{post.title[0]}</span>
            </div>
          </div>
        )}

        {/* Article body */}
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div
            className="prose-cashclimb"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* Disclaimer */}
          <div className="mt-12 p-5 bg-bg-2 border border-border rounded-xl">
            <p className="text-xs text-[#6A6460] leading-relaxed">
              <strong className="text-[#9A9490]">Disclaimer:</strong> The content on CashClimb is for informational and educational purposes only.
              It does not constitute financial, investment, or tax advice. Always consult a qualified financial professional before making investment decisions.
            </p>
          </div>

          {/* Comments */}
          <Comments postId={post.id} initial={comments} />
        </div>
      </main>

      {/* Related posts */}
      {related && related.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <h2 className="font-serif text-2xl font-bold section-title mb-6">More in {post.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(related as Post[]).map(p => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}
