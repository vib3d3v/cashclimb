import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org'))
  response.cookies.set('cc-admin-token', '', { path: '/', maxAge: 0 })
  return response
}
