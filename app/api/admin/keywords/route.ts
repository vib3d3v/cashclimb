import { NextRequest } from 'next/server'
import { POST as generateKeywords } from '@/app/api/admin/keywords/generate/route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  return generateKeywords(request)
}
