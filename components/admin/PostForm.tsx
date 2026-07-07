import type { Category } from '@/types'

const categories: Category[] = ['Personal Finance', 'Credit', 'Investing', 'Retirement', 'Taxes', 'Real Estate']
const statuses = ['draft', 'improving', 'review_required', 'ready_for_review', 'approved', 'scheduled', 'published', 'rejected']

type Props = {
  post?: any
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function PostForm({ post, action, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-6">
      <section className="grid gap-5 rounded-2xl border border-border bg-bg-2 p-6 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Title</span>
          <input name="title" required defaultValue={post?.title ?? ''} className="cc-input" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Slug</span>
          <input name="slug" defaultValue={post?.slug ?? ''} className="cc-input" placeholder="auto-created if blank" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Category</span>
          <select name="category" defaultValue={post?.category ?? 'Personal Finance'} className="cc-input">
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Author</span>
          <input name="author" defaultValue={post?.author ?? 'CashClimb Editorial'} className="cc-input" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Status</span>
          <select name="status" defaultValue={post?.status ?? (post?.published ? 'published' : 'draft')} className="cc-input">
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Excerpt</span>
          <textarea name="excerpt" required defaultValue={post?.excerpt ?? ''} rows={3} className="cc-input" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Primary keyword</span>
          <input name="primary_keyword" defaultValue={post?.primary_keyword ?? ''} className="cc-input" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Related keywords</span>
          <input name="related_keywords" defaultValue={Array.isArray(post?.related_keywords) ? post.related_keywords.join(', ') : ''} className="cc-input" placeholder="comma separated" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">SEO title</span>
          <input name="seo_title" defaultValue={post?.seo_title ?? ''} className="cc-input" />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">SEO description</span>
          <input name="seo_description" defaultValue={post?.seo_description ?? ''} className="cc-input" />
        </label>
      </section>

      <section className="rounded-2xl border border-border bg-bg-2 p-6">
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#6A6460]">Body HTML</span>
          <textarea name="body" required defaultValue={post?.body ?? ''} rows={24} className="cc-input font-mono text-sm" />
        </label>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="cc-btn-primary">{submitLabel}</button>
        <a href="/admin/posts" className="cc-btn-ghost">Cancel</a>
      </div>
    </form>
  )
}
