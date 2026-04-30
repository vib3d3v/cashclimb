'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()

  async function deletePost() {
    if (!confirm('Delete this post? This cannot be undone.')) return

    const res = await fetch(`/api/admin/posts/${postId}/delete`, {
      method: 'POST',
    })

    if (!res.ok) {
      toast.error('Delete failed')
      return
    }

    toast.success('Post deleted')
    router.refresh()
  }

  return (
    <button type="button" onClick={deletePost} className="cc-pill">
      Delete
    </button>
  )
}