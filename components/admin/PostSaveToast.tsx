'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function PostSaveToast() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const notice = searchParams.get('notice')
    if (!notice || handledRef.current === notice) return

    handledRef.current = notice

    if (notice === 'published') {
      toast.success('Article has been successfully published!')
    } else if (notice === 'saved') {
      toast.success('Changes saved successfully.')
    }

    const next = new URLSearchParams(searchParams.toString())
    next.delete('notice')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [pathname, router, searchParams])

  return null
}
