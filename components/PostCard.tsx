import Link from 'next/link'
import Image from 'next/image'
import { getAuthorByName } from '@/lib/authors'
import { getAutoAuthor } from '@/lib/seo-authors'
import type { Post } from '@/types'

const CAT_COLORS: Record<string, string> = {
  Investing: '#D4AF37',
  'Personal Finance': '#4A9B8E',
  Credit: '#C4704A',
  Taxes: '#7B68D4',
  'Real Estate': '#5A8C5A',
  Retirement: '#C46A8A',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getUseCase(category: string) {
  switch (category) {
    case 'Investing':
      return 'Best for: Beginner investors'
    case 'Personal Finance':
      return 'Best for: Money management basics'
    case 'Credit':
      return 'Best for: Borrowing and credit decisions'
    case 'Taxes':
      return 'Best for: Tax-aware planning'
    case 'Real Estate':
      return 'Best for: Property-related decisions'
    case 'Retirement':
      return 'Best for: Long-term planning'
    default:
      return 'Best for: Practical financial decisions'
  }
}

function resolveAuthorName(post: Post) {
  const fallbackAuthor = getAutoAuthor('cashclimb', post.category)

  if (!post.author || post.author.toLowerCase().includes('editorial')) {
    return fallbackAuthor.name
  }

  return post.author
}

export default function PostCard({ post }: { post: Post }) {
  const color = CAT_COLORS[post.category] ?? '#888'
  const author = getAuthorByName(resolveAuthorName(post))

  return (
    <article className="post-card flex flex-col group overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="block h-44 relative bg-gradient-to-br from-[#0D1A14] to-[#1A1000] flex-shrink-0 overflow-hidden">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)',
                backgroundSize: '10px 10px',
              }}
            />
            <span className="font-serif text-5xl font-black text-gold opacity-20">
              {post.title[0]}
            </span>
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
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

        <div className="text-xs text-[#6A6460] mb-3">
          Updated {formatDate(post.updated_at || post.created_at)} • {post.read_time}
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug mb-2 text-[#F0EDE8]">
          <Link href={`/blog/${post.slug}`} className="hover:text-gold transition-colors">
            {post.title}
          </Link>
        </h3>

        <p className="text-[#9A9490] text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="text-xs text-gold font-semibold mb-4">
          {getUseCase(post.category)}
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full border border-border bg-[#111214] text-[#F0EDE8] flex items-center justify-center text-[11px] font-bold tracking-wide flex-shrink-0">
              {author.initials}
            </div>

            <div className="min-w-0">
              <Link
                href={`/authors/${author.slug}`}
                className="text-xs text-[#F0EDE8] font-medium truncate hover:text-gold transition-colors"
              >
                {author.name}
              </Link>

              <div className="text-[11px] text-[#6A6460] truncate">
                {author.role}
              </div>
            </div>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="text-gold font-semibold text-xs whitespace-nowrap hover:opacity-80 transition-opacity"
          >
            Read Guide →
          </Link>
        </div>
      </div>
    </article>
  )
}
