import { NextRequest, NextResponse } from 'next/server'
import { POST as generateKeywords } from '@/app/api/admin/keywords/generate/route'
import { GET as createDailyDraft } from '@/app/api/cron/daily-draft/route'
import { requireAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => ({}))
  const keywordCount = clampNumber(body.keywordCount ?? body.howMany, 10, 1, 30)
  const draftCount = clampNumber(body.draftCount ?? body.count, 1, 1, 5)

  const keywordRequest = new NextRequest(new URL('/api/admin/keywords/generate', request.nextUrl.origin), {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      howMany: keywordCount,
      focus: body.focus ?? 'Personal Finance',
      audience: body.audience ?? 'Beginners',
      intentMix: body.intentMix ?? 'Mixed',
      riskTolerance: body.riskTolerance ?? 'Low',
      market: body.market ?? 'US / Canada / UK / Australia',
      seasonal: body.seasonal ?? true,
    }),
  })

  const keywordResponse = await generateKeywords(keywordRequest)
  const keywordResult = await keywordResponse.json().catch(() => ({}))

  if (!keywordResponse.ok) {
    return NextResponse.json(keywordResult, { status: keywordResponse.status })
  }

  const draftUrl = new URL('/api/cron/daily-draft', request.nextUrl.origin)
  draftUrl.searchParams.set('count', String(draftCount))

  const draftRequest = new NextRequest(draftUrl, {
    method: 'GET',
    headers: request.headers,
  })

  const draftResponse = await createDailyDraft(draftRequest)
  const draftResult = await draftResponse.json().catch(() => ({}))

  if (!draftResponse.ok) {
    return NextResponse.json(
      { keywords: keywordResult, draft: draftResult, error: draftResult.error || 'Draft generation failed.' },
      { status: draftResponse.status }
    )
  }

  return NextResponse.json({ success: true, keywords: keywordResult, draft: draftResult })
}
