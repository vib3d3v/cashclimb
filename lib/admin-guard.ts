import { NextRequest, NextResponse } from 'next/server'

export function hasAdminAccess(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false

  const headerKey = request.headers.get('x-admin-key')
  const cookieKey = request.cookies.get('cc-admin-token')?.value

  return headerKey === adminPassword || cookieKey === adminPassword
}

export function requireAdmin(request: NextRequest) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}