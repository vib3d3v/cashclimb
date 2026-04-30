import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createDraftFromKeyword } from '@/lib/automation/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json().catch(() => ({}))
    const result = await createDraftFromKeyword(body.keywordId ?? null)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[automation/draft] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Draft generation failed.' },
      { status: 500 }
    )
  }
}
