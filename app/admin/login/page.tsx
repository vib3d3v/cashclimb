import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  return <LoginForm error={searchParams?.error || null} />
}