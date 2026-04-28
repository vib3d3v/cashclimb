import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-guard'
import type { Category } from '@/types'

const CATEGORY_BY_FOCUS: Record<string, Category> = {
  'Personal Finance': 'Personal Finance',
  Credit: 'Credit',
  Investing: 'Investing',
  Retirement: 'Retirement',
  Taxes: 'Taxes',
  'Real Estate': 'Real Estate',
}

function fallbackIdeas(category: Category) {
  const map: Record<Category, Array<{ keyword: string; intent: string }>> = {
    'Personal Finance': [
      { keyword: 'how to build an emergency fund', intent: 'beginner guide' },
      { keyword: 'common budgeting mistakes to avoid', intent: 'mistakes' },
      { keyword: 'how to create a monthly budget that works', intent: 'checklist' },
    ],
    Credit: [
      { keyword: 'understanding credit score ranges', intent: 'glossary' },
      { keyword: 'how to improve your credit score', intent: 'beginner guide' },
      { keyword: 'credit utilization explained simply', intent: 'glossary' },
    ],
    Investing: [
      { keyword: 'simple investing for beginners index funds explained', intent: 'beginner guide' },
      { keyword: 'index funds vs etfs for beginners', intent: 'comparison' },
      { keyword: 'common investing mistakes beginners make', intent: 'mistakes' },
    ],
    Retirement: [
      { keyword: 'how to plan for retirement in your 20s and 30s', intent: 'beginner guide' },
      { keyword: 'roth ira vs traditional ira explained', intent: 'comparison' },
      { keyword: 'retirement savings checklist for beginners', intent: 'checklist' },
    ],
    Taxes: [
      { keyword: 'quarterly taxes for freelancers explained', intent: 'beginner guide' },
      { keyword: 'small business expense tracking checklist', intent: 'checklist' },
      { keyword: 'common tax mistakes freelancers make', intent: 'mistakes' },
    ],
    'Real Estate': [
      { keyword: 'first time homebuyer checklist', intent: 'checklist' },
      { keyword: 'understanding mortgage basics for first-time buyers', intent: 'informational' },
      { keyword: 'rent vs buy what to consider first', intent: 'comparison' },
    ],
  }
  return map[category]
}

async function generateIdeasWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        { role: 'system', content: 'Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      text: { format: { type: 'text' } },
    }),
    cache: 'no-store',
  })

  if (!response.ok) return null
  const data = await response.json()
  const outputText = data.output_text || data.output?.flatMap((item: any) => item.content || []).map((content: any) => content.text || '').join('') || ''
  if (!outputText) return null
  return JSON.parse(outputText)
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  const body = await request.json().catch(() => ({}))
  const count = Math.min(Math.max(Number(body.howMany ?? 20), 1), 30)
  const focus = String(body.focus ?? 'Personal Finance')
  const audience = String(body.audience ?? 'Beginners')
  const intentMix = String(body.intentMix ?? 'Mixed')
  const riskTolerance = String(body.riskTolerance ?? 'Low')
  const market = String(body.market ?? 'US / Canada / UK / Australia')
  const seasonal = Boolean(body.seasonal)
  const category = CATEGORY_BY_FOCUS[focus] ?? 'Personal Finance'

  const prompt = `Return only valid JSON in the shape {"ideas":[{"keyword":"string","category":"${category}","intent":"string"}]}. Generate ${count} SEO keyword ideas for CashClimb, a finance education website. Category focus: ${category}. Audience: ${audience}. Intent mix: ${intentMix}. Risk tolerance: ${riskTolerance}. Market: ${market}. Seasonal topics: ${seasonal ? 'yes' : 'no'}. Rules: educational only, no stock-picking hype, no guaranteed-return language, no personalized finance advice, avoid duplicate phrasings, prefer beginner-friendly and trustworthy topics.`

  let ideas: Array<{ keyword: string; category: Category; intent: string }> = []
  try {
    const parsed = await generateIdeasWithOpenAI(prompt)
    ideas = Array.isArray(parsed?.ideas) ? parsed.ideas.slice(0, count).map((idea: any) => ({ keyword: String(idea.keyword || '').trim(), category, intent: String(idea.intent || 'informational').trim() })) : []
  } catch {
    ideas = []
  }

  if (!ideas.length) {
    const fallback = fallbackIdeas(category)
    ideas = Array.from({ length: count }).map((_, index) => {
      const item = fallback[index % fallback.length]
      return { keyword: item.keyword, category, intent: item.intent }
    })
  }

  const supabase = createAdminClient()
  let inserted = 0
  for (const idea of ideas) {
    if (!idea.keyword) continue
    const { error } = await supabase.from('keyword_queue').insert({
      keyword: idea.keyword,
      category: idea.category,
      intent: idea.intent,
      source: 'ai',
    })
    if (!error) inserted += 1
  }

  return NextResponse.json({ inserted, requested: count })
}
