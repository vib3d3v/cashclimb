import Link from 'next/link'
import Image from 'next/image'
import { getAuthorByName } from '@/lib/authors'
import { getAutoAuthor } from '@/lib/seo-authors'
import type { Post } from '@/types'

export default function PostCard({ post }: { post: Post }) {
  // ✅ FIXED AUTHOR LOGIC
  const fallbackAuthor = getAutoAuthor('cashclimb', post.category)

  const authorName =
    !post.author || post.author.toLowerCase().includes('editorial')
      ? fallbackAuthor.name
      : post.author

  const author = getAuthorByName(authorName)

  return (
    <article>
      <Link href={`/blog/${post.slug}`}>
        <h3>{post.title}</h3>
      </Link>

      <p>{post.excerpt}</p>

      <div>
        <span>{author.name}</span>
      </div>
    </article>
  )
}