import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-guard'
import type { Category } from '@/types'

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase.from('keyword_queue').select('*').order('priority').order('created_at')
  if (status) query = query.eq('status', status)

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const keyword = String(body.keyword ?? '').trim()
  const category = String(body.category ?? '').trim() as Category
  const intent = String(body.intent ?? 'informational').trim()
  const priority = Number(body.priority ?? 100)
  const notes = body.notes ? String(body.notes).trim() : null

  if (!keyword || !category) {
    return NextResponse.json({ error: 'keyword and category are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('keyword_queue')
    .insert({ keyword, category, intent, priority, notes, source: 'manual' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
