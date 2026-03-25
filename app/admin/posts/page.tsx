import { createAdminClient } from '@/lib/supabase-server'
import Link from 'next/link'
import DeletePostButton from '@/components/DeletePostButton'

export default async function AdminPostsPage() {
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, category, author, published, view_count, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl font-bold">All Posts</h1>
        <Link href="/admin/posts/new" className="cc-btn-primary">+ New Post</Link>
      </div>

      <div className="bg-bg-2 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Title', 'Category', 'Author', 'Views', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold tracking-widest uppercase text-[#6A6460]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts?.map(p => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg-3 transition-colors">
                <td className="px-5 py-4 text-sm font-medium max-w-[200px] truncate">{p.title}</td>
                <td className="px-5 py-4 text-xs text-[#9A9490]">{p.category}</td>
                <td className="px-5 py-4 text-xs text-[#9A9490]">{p.author}</td>
                <td className="px-5 py-4 text-xs text-[#9A9490]">{p.view_count}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded
                    ${p.published ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {p.published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-[#6A6460]">{p.created_at?.slice(0, 10)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/blog/${p.slug}`} target="_blank"
                      className="text-xs text-[#9A9490] hover:text-gold transition-colors">View</Link>
                    <Link href={`/admin/posts/${p.id}/edit`}
                      className="text-xs text-gold hover:text-gold-light transition-colors font-semibold">Edit</Link>
                    <DeletePostButton postId={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts?.length && (
          <div className="text-center py-16 text-[#6A6460] text-sm">
            No posts yet. <Link href="/admin/posts/new" className="text-gold underline">Create your first post →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
