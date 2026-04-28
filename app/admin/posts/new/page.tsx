export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function NewPostPage() {
  return (
    <div className="rounded-2xl border border-border bg-bg-2 p-8">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">New post</p>
      <h1 className="font-serif text-4xl font-black text-[#F0EDE8] mb-4">Create article</h1>
      <p className="text-[#9A9490] leading-relaxed max-w-2xl">
        The full editor is not included in this repair package. Use your existing publishing workflow or Supabase editor for new posts.
      </p>
      <Link href="/admin/posts" className="inline-flex mt-6 text-sm font-semibold text-gold hover:opacity-80">Back to posts →</Link>
    </div>
  )
}
