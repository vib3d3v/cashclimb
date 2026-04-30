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
    const result = await insertKeywordIdeas(body)
    return NextResponse.json({ success: true, inserted: result.inserted, keywords: result.keywords })
  } catch (error: any) {
    console.error('[keywords/generate] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Keyword generation failed.' },
      { status: 500 }
    )
  }
}
