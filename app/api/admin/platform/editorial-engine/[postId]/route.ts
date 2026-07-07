import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { runAIEditorialEngine } from '@/lib/platform/ai-editorial-engine'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => ({}))
  const postId = String(params.postId || '').trim()

  if (!postId) {
    return NextResponse.json({ success: false, error: 'Missing post ID.' }, { status: 400 })
  }

  try {
    const result = await runAIEditorialEngine(postId, {
      threshold: body.threshold ?? 95,
      maxPasses: body.maxPasses ?? 3,
      reason: 'manual_admin_run',
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('[platform/editorial-engine] failed', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'AI editorial engine failed.' },
      { status: 500 }
    )
  }
}
