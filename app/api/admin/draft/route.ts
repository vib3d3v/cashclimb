import { NextRequest } from 'next/server'
import { GET as createDailyDraft } from '@/app/api/cron/daily-draft/route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const url = new URL('/api/cron/daily-draft', request.nextUrl.origin)

  if (body.keywordId) {
    url.searchParams.set('keywordId', String(body.keywordId))
  }

  if (body.count) {
    url.searchParams.set('count', String(body.count))
  }

  const forwardedRequest = new NextRequest(url, {
    method: 'GET',
    headers: request.headers,
  })

  return createDailyDraft(forwardedRequest)
}
