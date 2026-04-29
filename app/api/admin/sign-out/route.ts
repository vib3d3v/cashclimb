import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('cc-admin-token', '', { path: '/', maxAge: 0 })
  return response
}
