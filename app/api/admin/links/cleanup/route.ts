import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { cleanupExternalLinks } from '@/lib/normalize-links'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    const supabase = createAdminClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, body')

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    let scanned = 0
    let updated = 0

    for (const post of posts || []) {
      scanned += 1

      const currentBody = String(post.body || '')
      const cleanedBody = await cleanupExternalLinks(currentBody, {
        validateExternal: true,
        removeInvalid: true,
        replaceKnownBad: true,
      })

      if (cleanedBody !== currentBody) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({ body: cleanedBody })
          .eq('id', post.id)

        if (updateError) throw updateError
        updated += 1
      }
    }

    return NextResponse.json({
      success: true,
      scanned,
      updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Link cleanup failed' },
      { status: 500 }
    )
  }
}
