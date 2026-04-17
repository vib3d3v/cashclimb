'use client'

export default function AdminSignOutLink() {
  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cc-admin-key')
      window.location.href = '/api/auth/logout'
    }
  }

  return (
    <a
      href="/api/auth/logout"
      onClick={handleClick}
      className="block text-xs text-[#6A6460] hover:text-red-400 transition-colors text-center"
    >
      Sign out
    </a>
  )
}
