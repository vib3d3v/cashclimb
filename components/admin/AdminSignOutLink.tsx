'use client'

import { useRouter } from 'next/navigation'

export default function AdminSignOutLink() {
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/admin/sign-out', { method: 'POST' }).catch(() => null)
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-[#9A9490] transition-colors hover:border-gold hover:text-gold"
    >
      Sign out
    </button>
  )
}
