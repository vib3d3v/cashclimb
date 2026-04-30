import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { insertKeywordIdeas } from '@/lib/automation/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json().catch(() => ({}))
    const result = await insertKeywordIdeas({
      focus: body.focus ?? 'Mixed',
      howMany: body.howMany ?? body.keywordCount ?? 10,
      audience: body.audience ?? 'Beginners',
      intentMix: body.intentMix ?? 'Mixed',
      market: body.market ?? 'US / Canada / UK / Australia',
      riskTolerance: body.riskTolerance ?? 'Low',
    })

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      keywords: result.keywords,
    })
  } catch (error: any) {
    console.error('[automation/keywords] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Keyword generation failed.' },
      { status: 500 }
    )
  }
}
