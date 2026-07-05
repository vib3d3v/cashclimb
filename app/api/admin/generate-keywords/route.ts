import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { generateSerpApiKeywordIdeas } from '@/lib/automation/serpapi'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CATEGORIES = [
  'Personal Finance',
  'Credit',
  'Retirement',
  'Investing',
  'Taxes',
  'Real Estate',
]

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

function tryParseJson(text: string) {
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return valid JSON.')
  }
  return JSON.parse(trimmed.slice(start, end + 1))
}

async function openaiTextJson(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'system',
          content:
            'You are a senior SEO strategist for a personal finance website. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'text',
        },
      },
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${text}`)
  }

  const data = await response.json()

  const outputText =
    data.output_text ||
    data.output
      ?.flatMap((item: any) => item.content || [])
      ?.map((content: any) => content.text || '')
      ?.join('') ||
    ''

  if (!outputText) {
    throw new Error('OpenAI returned an empty response.')
  }

  return tryParseJson(outputText)
}

async function getExistingKeywordSignals() {
  const supabase = createAdminClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('title, slug, primary_keyword, category, created_at')
    .order('created_at', { ascending: false })
    .limit(80)

  const { data: queue } = await supabase
    .from('keyword_queue')
    .select('keyword, category, status, created_at')
    .order('created_at', { ascending: false })
    .limit(120)

  return {
    recentPosts: posts ?? [],
    existingQueue: queue ?? [],
  }
}

function buildKeywordPrompt(signals: any, count: number) {
  return `
Generate ${count} SEO keyword ideas for CashClimb, a personal finance website.

Primary markets:
- United States
- Canada
- United Kingdom
- Australia

Categories:
${CATEGORIES.join(', ')}

Avoid topics already covered or already queued.

Recent posts:
${signals.recentPosts
  .map(
    (p: any, i: number) =>
      `${i + 1}. ${p.title} | keyword: ${p.primary_keyword || 'none'} | category: ${p.category}`
  )
  .join('\n')}

Existing keyword queue:
${signals.existingQueue
  .map(
    (q: any, i: number) =>
      `${i + 1}. ${q.keyword} | category: ${q.category} | status: ${q.status}`
  )
  .join('\n')}

Return ONLY valid JSON:
{
  "keywords": [
    {
      "keyword": "",
      "category": "",
      "intent": "",
      "priority": 1,
      "brief": {
        "angle": "",
        "audience": "",
        "why_this_keyword": "",
        "pillar_topic": "",
        "cluster_type": "",
        "suggested_internal_links": []
      }
    }
  ]
}

Rules:
- Pick keywords with realistic SEO opportunity.
- Prefer long-tail, beginner, comparison, checklist, and how-to keywords.
- Avoid spammy phrases.
- Avoid high-risk hype like "get rich fast" or "guaranteed returns".
- Finance content must be responsible and educational.
- Categories must exactly match one of: ${CATEGORIES.join(', ')}
- intent should be one of: beginner guide, comparison, checklist, mistakes, how-to, explainer.
- priority should be 1, 2, or 3. Use 1 for strongest opportunities.
- Include pillar_topic to support topic clusters.
- Include cluster_type as one of: pillar, supporting, comparison, checklist, faq.
`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  const isCron = Boolean(expected) && authHeader === `Bearer ${expected}`

  const adminPassword = process.env.ADMIN_PASSWORD
  const cookieAdmin = req.cookies.get('cc-admin-token')?.value
  const headerAdmin = req.headers.get('x-admin-key')
  const isAdmin =
    Boolean(adminPassword) &&
    (cookieAdmin === adminPassword || headerAdmin === adminPassword)

  if (!isCron && !isAdmin) {
    return jsonError('Unauthorized', 401)
  }

  try {
    const { searchParams } = new URL(req.url)
    const count = Math.min(Math.max(Number(searchParams.get('count') ?? '10'), 1), 25)

    const supabase = createAdminClient()
    const signals = await getExistingKeywordSignals()
    const serpApiKeywords = await generateSerpApiKeywordIdeas({ howMany: Math.min(count * 3, 50), focus: 'Mixed' })
    const parsed = serpApiKeywords.length > 0
      ? { keywords: serpApiKeywords }
      : await openaiTextJson(buildKeywordPrompt(signals, count))

    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : []

    const inserted: any[] = []
    const skipped: any[] = []

    for (const item of keywords) {
      if (inserted.length >= count) break
      const keyword = String(item.keyword || '').trim()
      const category = String(item.category || '').trim()
      const intent = String(item.intent || 'beginner guide').trim()
      const priority = Number(item.priority || 3)

      if (!keyword || !CATEGORIES.includes(category)) {
        skipped.push({ keyword, reason: 'Invalid keyword or category' })
        continue
      }

      const { data: existing } = await supabase
        .from('keyword_queue')
        .select('id')
        .ilike('keyword', keyword)
        .maybeSingle()

      if (existing) {
        skipped.push({ keyword, reason: 'Already queued' })
        continue
      }

      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .or(`primary_keyword.ilike.${keyword},title.ilike.%${keyword}%`)
        .maybeSingle()

      if (existingPost) {
        skipped.push({ keyword, reason: 'Already covered' })
        continue
      }

      const { data, error } = await supabase
        .from('keyword_queue')
        .insert({
          keyword,
          category,
          intent,
          priority,
          status: 'queued',
          brief: item.brief ?? {},
          notes: item.brief?.source === 'serpapi' ? 'Auto-generated SEO keyword via SerpAPI' : 'Auto-generated SEO keyword',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        skipped.push({ keyword, reason: error.message })
      } else {
        inserted.push(data)
      }
    }

    return NextResponse.json({
      success: true,
      source: serpApiKeywords.length > 0 ? 'serpapi' : 'openai',
      generated: keywords.length,
      inserted: inserted.length,
      skipped: skipped.length,
      inserted_keywords: inserted.map((k) => ({
        keyword: k.keyword,
        category: k.category,
        priority: k.priority,
      })),
      skipped_keywords: skipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown keyword generation error'
    return jsonError(message, 500)
  }
}