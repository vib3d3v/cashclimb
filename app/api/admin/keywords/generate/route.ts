import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'

const intentTemplates = [
  'Beginner guide to {focus} for {audience}',
  '{focus} checklist for {audience}',
  '{focus} mistakes {audience} should avoid',
  'How to compare {focus} options in {market}',
  '{focus} tips for {audience}',
  'Simple {focus} plan for {audience}',
  '{focus} questions to ask before deciding',
  'What {audience} should know about {focus}',
]

export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const body = await req.json().catch(() => ({}))
  const howMany = Math.max(1, Math.min(Number(body?.howMany || 10), 50))
  const focus = String(body?.focus || 'Personal Finance')
  const audience = String(body?.audience || 'Beginners').toLowerCase()
  const market = String(body?.market || 'US / Canada / UK / Australia')

  const rows = Array.from({ length: howMany }).map((_, index) => {
    const template = intentTemplates[index % intentTemplates.length]
    return {
      keyword: template
        .replace('{focus}', focus)
        .replace('{audience}', audience)
        .replace('{market}', market),
      category: focus,
      status: 'queued',
      priority: index + 1,
    }
  })

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('keyword_queue').insert(rows).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: data?.length ?? rows.length })
}
