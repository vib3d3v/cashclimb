import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { runAutomationBatch } from '@/lib/automation/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json().catch(() => ({}))
    const result = await runAutomationBatch({
      focus: body.focus ?? 'Mixed',
      keywordCount: Number(body.keywordCount ?? body.howMany ?? 10),
      draftCount: Number(body.draftCount ?? 1),
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[automation/run] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Automation batch failed.' },
      { status: 500 }
    )
  }
}
