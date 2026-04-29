export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthorByName, resolvePostAuthorName } from '@/lib/authors'
import type { Post } from '@/types'

export default async function AdminPostsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as Post[]
  const publishedCount = posts.filter((post) => post.published).length
  const draftCount = posts.length - publishedCount

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Admin</p>
          <h1 className="font-serif text-4xl font-black text-[#F0EDE8]">Posts</h1>
        </div>
        <Link href="/admin/posts/new" className="cc-btn-primary">New post</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-bg-2 p-5">
          <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">Total</p>
          <p className="text-4xl font-serif font-black mt-2">{posts.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-bg-2 p-5">
          <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">Published</p>
          <p className="text-4xl font-serif font-black mt-2">{publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-bg-2 p-5">
          <p className="text-xs uppercase tracking-widest text-[#6A6460] font-bold">Drafts</p>
          <p className="text-4xl font-serif font-black mt-2">{draftCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest text-[#6A6460]">
              <tr>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Author</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const author = getAuthorByName(resolvePostAuthorName(post))
                return (
                  <tr key={post.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#F0EDE8]">{post.title}</p>
                      <p className="text-xs text-[#6A6460]">/blog/{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-[#9A9490]">{post.category}</td>
                    <td className="px-5 py-4 text-[#9A9490]">{author.name}</td>
                    <td className="px-5 py-4">
                      <span className={post.published ? 'text-emerald-400' : 'text-[#9A9490]'}>
                        {post.published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/posts/${post.id}/edit`} className="rounded-full border border-border px-3 py-1 text-xs text-[#F0EDE8] hover:border-gold">Edit</Link>
                        {post.published ? (
                          <Link href={`/blog/${post.slug}`} className="rounded-full border border-border px-3 py-1 text-xs text-[#F0EDE8] hover:border-gold">View</Link>
                        ) : (
                          <Link href={`/admin/posts/${post.id}/preview`} className="rounded-full border border-border px-3 py-1 text-xs text-[#F0EDE8] hover:border-gold">Preview</Link>
                        )}
                        <form action={`/api/admin/posts/${post.id}/delete`} method="POST">
                          <button className="rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-300 hover:border-red-300">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
