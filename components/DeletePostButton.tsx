'use client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

function getAdminKey(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('cc-admin-key') ?? ''
}

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this post permanently?')) return

    const adminKey = getAdminKey()

    if (!adminKey) {
      toast.error('Session expired. Please log in again.')
      window.location.href = '/admin/login'
      return
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })

      if (!res.ok) throw new Error()

      toast.success('Post deleted.')
      router.refresh()
    } catch {
      toast.error('Failed to delete post.')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-400 hover:text-red-300 transition-colors"
    >
      Delete
    </button>
  )
}