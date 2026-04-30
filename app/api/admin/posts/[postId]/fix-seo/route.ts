import { NextRequest, NextResponse } from 'next/server'
import { fixPostSeoIssues } from '@/lib/automation/seo-fixer'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId?: string; id?: string }> }
) {
  try {
    const params = await context.params
    const postId = params.postId || params.id

    if (!postId) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
    }

    const result = await fixPostSeoIssues(postId)

    return NextResponse.json({
      success: true,
      post: result.post,
      before: result.before,
      evaluation: result.after,
      fixesApplied: result.fixesApplied,
      unresolved: result.unresolved,
    })
  } catch (err: any) {
    console.error('[fix-seo]', err)
    return NextResponse.json(
      { error: err?.message || 'Fix SEO failed' },
      { status: 500 }
    )
  }
}
