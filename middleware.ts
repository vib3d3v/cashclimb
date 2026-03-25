import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // These paths are always accessible — never redirect them
  const publicPaths = [
    '/admin/login',
    '/api/auth/login',
    '/api/auth/logout',
  ]

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Protect all other /admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('cc-admin-token')?.value
    if (token !== process.env.ADMIN_PASSWORD) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}