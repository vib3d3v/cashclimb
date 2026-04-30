import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createDraftFromKeyword } from '@/lib/automation/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const result = await createDraftFromKeyword(context.params.id)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[keywords/:id/draft] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Draft generation failed.' },
      { status: 500 }
    )
  }
}
