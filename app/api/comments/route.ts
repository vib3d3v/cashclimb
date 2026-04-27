import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function getAdminKey(req: NextRequest) {
  return req.headers.get('x-admin-key')
}

function isAdmin(req: NextRequest) {
  const key = getAdminKey(req)
  return key && key === process.env.ADMIN_PASSWORD
}

// ✅ APPROVE / UNAPPROVE
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()

  const { id, approved } = await req.json()

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('comments')
    .update({ approved })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ✅ DELETE COMMENT
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()

  const { id } = await req.json()

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}