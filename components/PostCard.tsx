import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/types'

const CAT_COLORS: Record<string, string> = {
  Investing:        '#D4AF37',
  'Personal Finance': '#4A9B8E',
  Credit:           '#C4704A',
  Taxes:            '#7B68D4',
  'Real Estate':    '#5A8C5A',
  Retirement:       '#C46A8A',
}

export default function PostCard({ post }: { post: Post }) {
  const color = CAT_COLORS[post.category] ?? '#888'

  return (
    <Link href={`/blog/${post.slug}`} className="post-card flex flex-col group">
      {/* Cover image or pattern */}
      <div className="h-44 relative overflow-hidden bg-gradient-to-br from-[#0D1A14] to-[#1A1000] flex-shrink-0">
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
                backgroundImage: 'repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)',
                backgroundSize: '10px 10px',
              }}
            />
            <span className="font-serif text-5xl font-black text-gold opacity-20">
              {post.title[0]}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="cat-badge"
            style={{ background: `${color}22`, color }}
          >
            {post.category}
          </span>
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug mb-2 text-[#F0EDE8] flex-1">
          {post.title}
        </h3>

        <p className="text-[#9A9490] text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex justify-between items-center pt-4 border-t border-border text-xs">
          <span className="text-[#6A6460] font-medium">{post.author}</span>
          <span className="text-gold font-semibold">{post.read_time} read</span>
        </div>
      </div>
    </Link>
  )
}
