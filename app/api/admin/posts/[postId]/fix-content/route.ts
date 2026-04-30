import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { fixPostContentDepthAndTone } from '@/lib/automation/advanced-content-fixer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = { params: { postId: string } }

export async function POST(request: NextRequest, { params }: Params) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized
  try {
    const result = await fixPostContentDepthAndTone(params.postId)
    return NextResponse.json({
      success: true,
      post: result.post,
      before: result.before,
      evaluation: result.after,
      wordCount: result.wordCount,
      fixesApplied: result.fixesApplied,
      unresolved: result.unresolved,
    })
  } catch (error: any) {
    console.error('[posts/fix-content] failed', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fix content depth and tone.' }, { status: 500 })
  }
}
