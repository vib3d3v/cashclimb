import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = createAdminClient()

  const { data: keywords } = await supabase
    .from('keyword_queue')
    .select('*')
    .order('created_at', { ascending: true })

  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const k of keywords || []) {
    const normalized = k.keyword?.toLowerCase().trim()

    if (seen.has(normalized)) {
      toDelete.push(k.id)
    } else {
      seen.add(normalized)
    }
  }

  if (toDelete.length) {
    await supabase.from('keyword_queue').delete().in('id', toDelete)
  }

  return NextResponse.json({
    success: true,
    removed: toDelete.length,
  })
}