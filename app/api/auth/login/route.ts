import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'cc-admin-token'

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''

  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD is not set.' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, adminPassword, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
