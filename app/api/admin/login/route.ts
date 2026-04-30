import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ADMIN_COOKIE = 'cc-admin-token'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const login = String(body.username || body.email || body.login || '').trim()
    const password = String(body.password || '')

    const allowedLogins = [
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_USERNAME,
      'admin',
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())

    const adminPassword = String(process.env.ADMIN_PASSWORD || '')

    if (!adminPassword) {
      return NextResponse.json(
        { success: false, error: 'ADMIN_PASSWORD is not configured.' },
        { status: 500 }
      )
    }

    const loginMatches = allowedLogins.includes(login.toLowerCase())
    const passwordMatches = password === adminPassword

    if (!loginMatches || !passwordMatches) {
      return NextResponse.json(
        { success: false, error: 'Invalid login.' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true, ok: true })

    // This is the cookie your middleware checks before allowing /admin routes.
    response.cookies.set(ADMIN_COOKIE, adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    // Legacy cookies kept so older admin API buttons still work if they check them.
    response.cookies.set('cashclimb_admin', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Login failed.' },
      { status: 500 }
    )
  }
}
