import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import readingTime from 'reading-time'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import { requireAdmin } from '@/lib/admin-guard'
import type { Category } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type InternalLink = {
  title: string
  slug: string
  category: string | null
}

type TopicPlan = {
  primaryKeyword: string
  relatedKeywords: string[]
  searchIntent: string
  workingTitle: string
  angle: string
  audience: string
}

type ArticleOutline = {
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  primaryKeyword: string
  relatedKeywords: string[]
  searchIntent: string
  keyTakeaways: string[]
  h2s: string[]
  externalSources: { label: string; url: string }[]
}

type GeneratedArticle = {
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  contentHtml: string
  author: string
}

type RecentPostSignal = {
  title: string | null
  excerpt: string | null
  seo_title: string | null
  seo_description: string | null
  category: string | null
  created_at: string | null
}

type CandidateSelection = {
  category: Category
  seedTopic: string
  plan: TopicPlan
}

type QueueRow = {
  id: string
  keyword: string
  category: Category
  intent: string
  brief: Record<string, any> | null
}

const AUTHOR_NAME = 'Daniel Reeves'
const MAX_TOPIC_PLAN_ATTEMPTS = 18
const KEYWORD_LOOKBACK_DAYS = 45
const TITLE_LOOKBACK_DAYS = 30
const ANGLE_LOOKBACK_DAYS = 60

const CATEGORY_ROTATION: Category[] = [
  'Personal Finance',
  'Credit',
  'Retirement',
  'Investing',
  'Taxes',
  'Real Estate',
]

const TOPIC_BANK: Record<Category, string[]> = {
  'Personal Finance': [
    'budgeting with irregular income',
    'where to keep an emergency fund',
    'how to stop lifestyle inflation',
    'how to make a monthly budget',
    'how to split paycheck savings',
    'starter emergency fund for beginners',
    'emergency fund vs paying off debt',
  ],
  Credit: [
    'how to use a credit card responsibly',
    'what credit utilization means',
    'how minimum payments affect debt',
    'how to rebuild credit habits',
    'buy now pay later pros and cons',
    'how to lower credit card interest costs',
    'how to avoid common credit score mistakes',
  ],
  Retirement: [
    'how to start saving for retirement',
    'retirement planning in your 20s',
    'retirement planning in your 30s',
    'how compound growth helps retirement',
    'retirement mistakes beginners make',
    'how much to contribute to retirement early on',
    'should you increase retirement savings after a raise',
  ],
  Investing: [
    'beginner guide to long term investing',
    'what diversification means',
    'what risk tolerance means',
    'how to start investing carefully',
    'why chasing returns is risky',
    'index funds vs individual stocks for beginners',
    'how to build investing habits without timing the market',
  ],
  Taxes: [
    'basic tax concepts for freelancers',
    'how to organize records for taxes',
    'what self employed workers should track',
    'simple bookkeeping habits',
    'how to save for taxes monthly',
    'quarterly tax planning basics for beginners',
    'expense tracking mistakes freelancers should avoid',
  ],
  'Real Estate': [
    'renting vs buying a home',
    'how to save for a down payment',
    'hidden costs of buying a house',
    'how much house can you afford',
    'first time home buyer financial checklist',
    'when renting is the smarter financial move',
    'how to prepare your finances before house hunting',
  ],
}

const DEFAULT_STOCK_COVERS: Record<Category, string[]> = {
  'Personal Finance': [
    'https://images.pexels.com/photos/5942583/pexels-photo-5942583.jpeg?cs=srgb&dl=pexels-karola-g-5942583.jpg&fm=jpg',
    'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4968630/pexels-photo-4968630.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  Credit: [
    'https://images.pexels.com/photos/6609234/pexels-photo-6609234.jpeg?cs=srgb&dl=pexels-mikhail-nilov-6609234.jpg&fm=jpg',
    'https://images.pexels.com/photos/7821487/pexels-photo-7821487.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3943728/pexels-photo-3943728.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  Retirement: [
    'https://images.pexels.com/photos/5591267/pexels-photo-5591267.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-5591267.jpg&fm=jpg',
    'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4050291/pexels-photo-4050291.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  Investing: [
    'https://images.pexels.com/photos/5717758/pexels-photo-5717758.jpeg?cs=srgb&dl=pexels-karola-g-5717758.jpg&fm=jpg',
    'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/6770775/pexels-photo-6770775.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  Taxes: [
    'https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?cs=srgb&dl=pexels-n-voitkevich-6863332.jpg&fm=jpg',
    'https://images.pexels.com/photos/4386366/pexels-photo-4386366.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Real Estate': [
    'https://images.pexels.com/photos/34135038/pexels-photo-34135038.jpeg?cs=srgb&dl=pexels-jakubzerdzicki-34135038.jpg&fm=jpg',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
}


const PROCESSING_STALE_MINUTES = 15
const DRAFT_TIMEOUT_MS = 4 * 60 * 1000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function recoverStaleProcessingKeywords() {
  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - PROCESSING_STALE_MINUTES * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('keyword_queue')
    .select('id, keyword, updated_at, notes')
    .eq('status', 'processing')
    .lt('updated_at', cutoff)
    .limit(50)

  if (error) throw new Error(error.message)
  if (!data?.length) return 0

  for (const row of data as any[]) {
    const staleNote = [row.notes, `Auto-recovered stale processing job at ${new Date().toISOString()}`]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 1000)

    const { error: updateError } = await supabase
      .from('keyword_queue')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        notes: staleNote,
      })
      .eq('id', row.id)
      .eq('status', 'processing')

    if (updateError) throw new Error(updateError.message)
  }

  return data.length
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'what',
  'when',
  'why',
  'with',
  'your',
  'you',
  'into',
  'than',
  'vs',
  'vs.',
  'after',
  'before',
  'more',
  'less',
  'over',
  'under',
  'about',
  'best',
  'guide',
  'beginner',
  'beginners',
  'checklist',
  'steps',
])

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

function getDayNumber(date = new Date()) {
  return Math.floor(date.getTime() / 86_400_000)
}

function getCategoryForToday(date = new Date()): Category {
  const dayNumber = getDayNumber(date)
  return CATEGORY_ROTATION[dayNumber % CATEGORY_ROTATION.length]
}

function getOrderedCategories(date = new Date()): Category[] {
  const dayNumber = getDayNumber(date)
  return CATEGORY_ROTATION.map(
    (_, index) => CATEGORY_ROTATION[(dayNumber + index) % CATEGORY_ROTATION.length]
  )
}

function getOrderedTopics(category: Category, date = new Date()): string[] {
  const topics = TOPIC_BANK[category]
  const dayNumber = getDayNumber(date)
  const categoryOffset = CATEGORY_ROTATION.indexOf(category)
  const rotationStart = (dayNumber + Math.max(categoryOffset, 0) * 2) % topics.length

  return topics.map((_, index) => topics[(rotationStart + index) % topics.length])
}

function buildSlug(title: string) {
  return slugify(title, { lower: true, strict: true, trim: true })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function tokenizeForRelevance(text: string) {
  return normalizeWhitespace(text.toLowerCase())
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3)
}

function scoreInternalLinkRelevance(
  link: InternalLink,
  category: Category,
  primaryKeyword?: string,
  relatedKeywords: string[] = []
) {
  let score = 0
  if (link.category === category) score += 4

  const haystack = tokenizeForRelevance(`${link.title} ${link.category ?? ''}`)
  const needles = new Set([
    ...tokenizeForRelevance(primaryKeyword ?? ''),
    ...relatedKeywords.flatMap((keyword) => tokenizeForRelevance(keyword)),
  ])

  for (const needle of needles) {
    if (haystack.includes(needle)) score += 2
  }

  return score
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

function categorySpecificGuidance(category: Category) {
  switch (category) {
    case 'Investing':
      return [
        'Focus on long-term principles, diversification, risk, and patience.',
        'Do not mention specific stock picks, price targets, or market-timing advice.',
        'Avoid hype and guaranteed-return language.',
      ].join(' ')
    case 'Credit':
      return [
        'Focus on responsible borrowing, utilization, payment habits, and debt avoidance.',
        'Do not glamorize debt.',
      ].join(' ')
    case 'Taxes':
      return [
        'Keep the content educational and general.',
        'Do not provide personalized tax advice.',
      ].join(' ')
    case 'Real Estate':
      return [
        'Focus on affordability, budgeting, tradeoffs, and planning.',
        'Do not frame home ownership as a guaranteed wealth strategy.',
      ].join(' ')
    case 'Retirement':
      return [
        'Emphasize time horizon, consistency, employer matching, and realistic planning.',
        'Do not overpromise outcomes.',
      ].join(' ')
    case 'Personal Finance':
    default:
      return [
        'Keep the content practical, clear, and beginner-friendly.',
        'Use concrete examples and realistic tradeoffs.',
      ].join(' ')
  }
}

function parseCoverUrls(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function pickStockCoverByCategory(
  category: Category,
  seed = `${category}-${new Date().toISOString().slice(0, 10)}`
): string | null {
  const envMap: Record<Category, string | undefined> = {
    'Personal Finance': process.env.STOCK_COVER_PERSONAL_FINANCE_URLS,
    Credit: process.env.STOCK_COVER_CREDIT_URLS,
    Retirement: process.env.STOCK_COVER_RETIREMENT_URLS,
    Investing: process.env.STOCK_COVER_INVESTING_URLS,
    Taxes: process.env.STOCK_COVER_TAXES_URLS,
    'Real Estate': process.env.STOCK_COVER_REAL_ESTATE_URLS,
  }

  const envUrls = parseCoverUrls(envMap[category])
  const pool = envUrls.length > 0 ? envUrls : DEFAULT_STOCK_COVERS[category]

  if (!pool.length) return null

  const index = hashString(seed) % pool.length
  return pool[index]
}

function tokenizeForSimilarity(text: string) {
  return normalizeWhitespace(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
}

function jaccardSimilarity(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0

  const aSet = new Set(a)
  const bSet = new Set(b)
  let intersection = 0

  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1
  }

  const union = new Set([...aSet, ...bSet]).size
  return union === 0 ? 0 : intersection / union
}

function buildAngleSignature(plan: TopicPlan) {
  return tokenizeForSimilarity(
    [
      plan.primaryKeyword,
      plan.workingTitle,
      plan.angle,
      plan.searchIntent,
      plan.audience,
      ...plan.relatedKeywords,
    ].join(' ')
  )
}

function buildRecentPostSignature(post: RecentPostSignal) {
  return tokenizeForSimilarity(
    [post.title ?? '', post.excerpt ?? '', post.seo_title ?? '', post.seo_description ?? ''].join(
      ' '
    )
  )
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
            'You are a precise JSON generator for an editorial publishing workflow. Return only valid JSON with no extra commentary.',
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

async function fetchInternalLinks(
  category: Category,
  primaryKeyword?: string,
  relatedKeywords: string[] = []
): Promise<InternalLink[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select('title, slug, category')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(24)

  if (error) {
    throw new Error(`Failed to fetch internal links: ${error.message}`)
  }

  const scored = ((data ?? []) as InternalLink[])
    .filter((post) => post.slug)
    .map((post) => ({
      ...post,
      relevance: scoreInternalLinkRelevance(post, category, primaryKeyword, relatedKeywords),
    }))
    .sort((a, b) => b.relevance - a.relevance)

  const unique = new Map<string, InternalLink>()
  for (const post of scored) {
    if (!unique.has(post.slug)) {
      unique.set(post.slug, { title: post.title, slug: post.slug, category: post.category })
    }
  }

  return Array.from(unique.values()).slice(0, 6)
}

async function slugExists(slug: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Boolean(data)
}

async function hasSimilarRecentTitle(title: string) {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - TITLE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const normalized = normalizeWhitespace(title.toLowerCase())

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) throw new Error(error.message)

  return (data ?? []).some((post) => {
    const existing = normalizeWhitespace(String(post.title).toLowerCase())
    return existing === normalized
  })
}

async function hasRecentKeyword(primaryKeyword: string) {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - KEYWORD_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const needle = normalizeWhitespace(primaryKeyword.toLowerCase())

  const { data, error } = await supabase
    .from('posts')
    .select('title, excerpt, seo_title, seo_description, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) throw new Error(error.message)

  return (data ?? []).some((post: any) => {
    const haystack = normalizeWhitespace(
      [post.title, post.excerpt, post.seo_title, post.seo_description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    )
    return haystack.includes(needle)
  })
}

async function fetchRecentPostSignals(days: number) {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('posts')
    .select('title, excerpt, seo_title, seo_description, category, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(120)

  if (error) throw new Error(error.message)
  return (data ?? []) as RecentPostSignal[]
}

function hasRecentlyUsedAngle(plan: TopicPlan, recentPosts: RecentPostSignal[]) {
  const candidateSignature = buildAngleSignature(plan)
  if (!candidateSignature.length) {
    return false
  }

  return recentPosts.some((post) => {
    const existingSignature = buildRecentPostSignature(post)
    const similarity = jaccardSimilarity(candidateSignature, existingSignature)
    return similarity >= 0.42
  })
}

function buildTopicPlanPrompt(category: Category, seedTopic: string) {
  return `
You are planning an SEO article for CashClimb, a Western-market personal finance website.

Primary markets:
- United States
- Canada
- United Kingdom
- Australia

Return ONLY valid JSON in this exact shape:
{
  "primaryKeyword": "string",
  "relatedKeywords": ["string", "string", "string"],
  "searchIntent": "string",
  "workingTitle": "string",
  "angle": "string",
  "audience": "string"
}

Requirements:
- Category: ${category}
- Seed topic: ${seedTopic}
- Target informational or beginner-intent searches.
- Focus on keywords a real person would search.
- Western audience only.
- Use natural English for US/Canada/UK/Australia readers.
- Avoid Philippine references.
- Search intent should be concise, like "informational", "beginner guide", "comparison", "mistakes", or "checklist".
- Working title should sound editorial, not spammy.
- Angle should explain what unique value this article gives.
- Audience should be specific, like "beginners with variable income" or "new credit card users".
- Prefer angles that are distinct from generic beginner explainers.
- If the seed topic is close to a common topic, choose a narrower or more actionable angle.

Category guidance:
${categorySpecificGuidance(category)}
`
}

async function generateTopicPlan(category: Category, seedTopic: string): Promise<TopicPlan> {
  const parsed = (await openaiTextJson(buildTopicPlanPrompt(category, seedTopic))) as Partial<TopicPlan>

  if (
    !parsed.primaryKeyword ||
    !parsed.relatedKeywords ||
    !parsed.searchIntent ||
    !parsed.workingTitle ||
    !parsed.angle ||
    !parsed.audience
  ) {
    throw new Error('Topic plan generation returned incomplete fields.')
  }

  return {
    primaryKeyword: parsed.primaryKeyword.trim(),
    relatedKeywords: parsed.relatedKeywords.slice(0, 5).map((k) => String(k).trim()),
    searchIntent: parsed.searchIntent.trim(),
    workingTitle: parsed.workingTitle.trim(),
    angle: parsed.angle.trim(),
    audience: parsed.audience.trim(),
  }
}

function buildOutlinePrompt(category: Category, plan: TopicPlan, internalLinks: InternalLink[]) {
  const linksText =
    internalLinks.length > 0
      ? internalLinks
          .map(
            (link, index) =>
              `${index + 1}. Title: "${link.title}" | URL: /blog/${link.slug} | Category: ${link.category ?? 'General'}`
          )
          .join('\n')
      : 'No internal links available.'

  return `
You are a senior SEO editor planning a finance article for CashClimb.

Primary markets:
- United States
- Canada
- United Kingdom
- Australia

Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "primaryKeyword": "string",
  "relatedKeywords": ["string", "string"],
  "searchIntent": "string",
  "keyTakeaways": ["string", "string", "string"],
  "h2s": ["string", "string", "string", "string"],
  "externalSources": [
    { "label": "string", "url": "string" }
  ]
}

Article plan input:
- Category: ${category}
- Primary keyword: ${plan.primaryKeyword}
- Related keywords: ${plan.relatedKeywords.join(', ')}
- Search intent: ${plan.searchIntent}
- Working title: ${plan.workingTitle}
- Angle: ${plan.angle}
- Audience: ${plan.audience}

Requirements:
- Western-market tone only.
- Title under 70 characters.
- SEO title under 60 characters.
- Excerpt 140 to 180 characters.
- SEO description 140 to 160 characters.
- Key takeaways should be concrete and useful.
- H2s should reflect real user questions or subtopics.
- Include exactly 4 to 6 H2s.
- At least one H2 should be "Common Mistakes to Avoid" or very close.
- At least one H2 should be "What You Can Do Next" or very close.
- Choose 1 to 2 strong external sources from authoritative Western sources when relevant.
- Prefer sources like IRS, SEC, CFPB, FTC, Federal Reserve, Consumer.gov, FCA, Bank of England, or similar.
- Do not use affiliate-style or spammy sources.
- Keep the outline practical and thought-through.

Internal links available for later use:
${linksText}
`
}

async function generateOutline(
  category: Category,
  plan: TopicPlan,
  internalLinks: InternalLink[]
): Promise<ArticleOutline> {
  const parsed = (await openaiTextJson(
    buildOutlinePrompt(category, plan, internalLinks)
  )) as Partial<ArticleOutline>

  if (
    !parsed.title ||
    !parsed.excerpt ||
    !parsed.seoTitle ||
    !parsed.seoDescription ||
    !parsed.primaryKeyword ||
    !parsed.relatedKeywords ||
    !parsed.searchIntent ||
    !parsed.keyTakeaways ||
    !parsed.h2s
  ) {
    throw new Error('Outline generation returned incomplete fields.')
  }

  return {
    title: parsed.title.trim(),
    excerpt: parsed.excerpt.trim(),
    seoTitle: parsed.seoTitle.trim(),
    seoDescription: parsed.seoDescription.trim(),
    primaryKeyword: parsed.primaryKeyword.trim(),
    relatedKeywords: parsed.relatedKeywords.slice(0, 6).map((k) => String(k).trim()),
    searchIntent: parsed.searchIntent.trim(),
    keyTakeaways: parsed.keyTakeaways.slice(0, 5).map((k) => String(k).trim()),
    h2s: parsed.h2s.slice(0, 6).map((h) => String(h).trim()),
    externalSources: (parsed.externalSources ?? []).slice(0, 2).map((s: any) => ({
      label: String(s.label).trim(),
      url: String(s.url).trim(),
    })),
  }
}

function buildArticlePrompt(
  category: Category,
  plan: TopicPlan,
  outline: ArticleOutline,
  internalLinks: InternalLink[]
) {
  const linksText =
    internalLinks.length > 0
      ? internalLinks
          .map(
            (link, index) =>
              `${index + 1}. Title: "${link.title}" | URL: /blog/${link.slug} | Category: ${link.category ?? 'General'}`
          )
          .join('\n')
      : 'No internal links available.'

  const sourcesText =
    outline.externalSources.length > 0
      ? outline.externalSources.map((s, index) => `${index + 1}. ${s.label} - ${s.url}`).join('\n')
      : 'No external sources selected.'

  return `
You are a senior finance editor writing for CashClimb.

Primary markets:
- United States
- Canada
- United Kingdom
- Australia

Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "contentHtml": "string",
  "author": "Daniel Reeves"
}

Article strategy:
- Category: ${category}
- Primary keyword: ${outline.primaryKeyword}
- Related keywords: ${outline.relatedKeywords.join(', ')}
- Search intent: ${outline.searchIntent}
- Audience: ${plan.audience}
- Angle: ${plan.angle}

Approved editorial inputs:
- Title: ${outline.title}
- Excerpt: ${outline.excerpt}
- SEO title: ${outline.seoTitle}
- SEO description: ${outline.seoDescription}
- Suggested H2 sections:
${outline.h2s.map((h, i) => `${i + 1}. ${h}`).join('\n')}
- Suggested key takeaways:
${outline.keyTakeaways.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Available internal links:
${linksText}

Approved external sources:
${sourcesText}

MANDATORY CONTENT STRUCTURE:
The contentHtml field MUST follow this exact order:

1. <p><em>This content is for informational and educational purposes only and does not constitute financial advice.</em></p>
2. Intro: 2 short answer-first paragraphs that directly answer the search intent.
3. <h2>Quick Answer</h2>
   - One concise paragraph that directly answers the main query.
4. <h2>Key Takeaways</h2>
   - A <ul> with 3 to 5 specific, useful bullets.
5. 4 to 7 practical body sections using <h2> and optional <h3> headings.
6. <h2>Real Examples</h2>
   - Include at least 2 realistic examples with numbers where useful.
7. <h2>Common Mistakes to Avoid</h2>
   - Use a <ul> with practical mistakes.
8. <h2>What You Can Do Next</h2>
   - Use an <ol> with clear next steps.
9. <h2>FAQ</h2>
   - Include 4 to 6 questions using <h3>Question</h3><p>Answer</p>.
10. <h2>Sources</h2>
   - Include at least 2 authoritative external links.
11. Short conclusion paragraph.

STRICT SECTION REQUIREMENTS:
- You MUST include an exact <h2>Quick Answer</h2> section.
- You MUST include an exact <h2>FAQ</h2> section.
- You MUST include an exact <h2>Sources</h2> section.
- Do not hide sources inside another section.
- Do not skip FAQ.
- Do not skip Quick Answer.
- Do not create duplicate Key Takeaways sections.

HTML RULES:
- contentHtml must be clean HTML only.
- Use only <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, and <a> unless a table is truly necessary.
- Do not use markdown.
- Do not include code fences.
- Do not include escaped JSON inside contentHtml.

SEO AND AI-CITATION RULES:
- Write in a way that answers the query quickly and clearly.
- Use the primary keyword naturally in the intro, Quick Answer, and at least one H2.
- Make definitions and decision rules easy for AI systems to extract.
- Use specific examples, tradeoffs, and conditions instead of vague advice.
- Include 2 to 4 natural internal links using <a href="/blog/...">...</a>.
- Include 2 authoritative external links using <a href="URL" target="_blank" rel="noopener noreferrer">Label</a>.

FINANCE SAFETY RULES:
- Do not provide personalized financial, tax, investment, mortgage, legal, or retirement advice.
- Do not promise outcomes.
- Do not suggest guaranteed savings, returns, approval, or wealth-building results.
- Do not use hype like "secret," "guaranteed," "risk-free," or "get rich."
- Use careful language like "may," "can," "often," "consider," and "depends on."

QUALITY RULES:
- Write for Western readers only.
- Prefer examples relevant to the US, Canada, UK, and Australia.
- Do not use Philippine references, agencies, institutions, or slang.
- Keep the article around 1400 to 2200 words.
- Avoid fluff, repetition, generic filler, and robotic transitions.
- Do not mention AI.

Return the same title, excerpt, seoTitle, and seoDescription from the approved outline unless a small improvement is necessary.
Set author to "${AUTHOR_NAME}".
`
}

async function generateArticle(
  category: Category,
  plan: TopicPlan,
  outline: ArticleOutline,
  internalLinks: InternalLink[]
): Promise<GeneratedArticle> {
  const parsed = (await openaiTextJson(
    buildArticlePrompt(category, plan, outline, internalLinks)
  )) as Partial<GeneratedArticle>

  if (
    !parsed.title ||
    !parsed.excerpt ||
    !parsed.seoTitle ||
    !parsed.seoDescription ||
    !parsed.contentHtml
  ) {
    throw new Error('Article generation returned incomplete fields.')
  }

  return {
    title: parsed.title.trim(),
    excerpt: parsed.excerpt.trim(),
    seoTitle: parsed.seoTitle.trim(),
    seoDescription: parsed.seoDescription.trim(),
    contentHtml: parsed.contentHtml.trim(),
    author: parsed.author?.trim() || AUTHOR_NAME,
  }
}

function buildHumanizePrompt(
  article: GeneratedArticle,
  category: Category,
  plan: TopicPlan,
  outline: ArticleOutline,
  internalLinks: InternalLink[]
) {
  const linksText =
    internalLinks.length > 0
      ? internalLinks
          .map(
            (link, index) =>
              `${index + 1}. Title: "${link.title}" | URL: /blog/${link.slug} | Category: ${link.category ?? 'General'}`
          )
          .join('\n')
      : 'No internal links available.'

  return `
You are a senior editor doing the final human polish for a finance article on CashClimb.

Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "contentHtml": "string",
  "author": "Daniel Reeves"
}

Article context:
- Category: ${category}
- Audience: ${plan.audience}
- Primary keyword: ${outline.primaryKeyword}
- Search intent: ${outline.searchIntent}
- Related keywords: ${outline.relatedKeywords.join(', ')}

Available internal links to preserve or add naturally:
${linksText}

Humanization goals:
- Keep the article factually consistent and SEO-aligned.
- Improve flow, transitions, clarity, and examples.
- Remove robotic phrasing, filler transitions, and generic AI-style wording.
- Vary sentence length and paragraph rhythm.
- Make the tone feel like a thoughtful finance editor, not a template.
- Preserve practical examples and decision-making guidance.
- Preserve or improve 2 to 4 natural internal links using <a href="/blog/...">...</a>.
- Keep authority links and disclaimers.
- Do not introduce new unverifiable facts or statistics.
- Do not make personalized financial, tax, or legal recommendations.

MANDATORY PRESERVATION RULES:
You MUST keep these sections in contentHtml exactly as <h2> headings:
- <h2>Quick Answer</h2>
- <h2>Key Takeaways</h2>
- <h2>Real Examples</h2>
- <h2>Common Mistakes to Avoid</h2>
- <h2>What You Can Do Next</h2>
- <h2>FAQ</h2>
- <h2>Sources</h2>

Do not remove, rename, merge, or skip those sections.
Do not create duplicate Key Takeaways sections.
Do not move Sources into another section.
Do not use markdown. Return valid HTML only in contentHtml.

Current draft to refine:
TITLE: ${article.title}
EXCERPT: ${article.excerpt}
SEO TITLE: ${article.seoTitle}
SEO DESCRIPTION: ${article.seoDescription}
CONTENT HTML:
${article.contentHtml}

Prefer to keep title, excerpt, seoTitle, and seoDescription very close to the current version unless a tiny wording improvement helps clarity or click-through rate.
Set author to "${AUTHOR_NAME}".
`
}

async function humanizeArticle(
  article: GeneratedArticle,
  category: Category,
  plan: TopicPlan,
  outline: ArticleOutline,
  internalLinks: InternalLink[]
): Promise<GeneratedArticle> {
  const parsed = (await openaiTextJson(
    buildHumanizePrompt(article, category, plan, outline, internalLinks)
  )) as Partial<GeneratedArticle>

  if (!parsed.contentHtml) {
    throw new Error('Humanize pass returned incomplete fields.')
  }

  return {
    title: parsed.title?.trim() || article.title,
    excerpt: parsed.excerpt?.trim() || article.excerpt,
    seoTitle: parsed.seoTitle?.trim() || article.seoTitle,
    seoDescription: parsed.seoDescription?.trim() || article.seoDescription,
    contentHtml: parsed.contentHtml.trim(),
    author: parsed.author?.trim() || article.author || AUTHOR_NAME,
  }
}

function internalLinksSummary(contentHtml: string) {
  const matches = Array.from(contentHtml.matchAll(/href=\"(\/blog\/[^\"]+)\"/gi)).map((m) => m[1])
  return Array.from(new Set(matches)).slice(0, 6)
}

function hasH2Section(contentHtml: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`<h2[^>]*>\\s*${escaped}\\s*</h2>`, 'i').test(contentHtml)
}

function ensureArticleRequiredSections(article: GeneratedArticle, outline: ArticleOutline) {
  let contentHtml = article.contentHtml.trim()

  if (!/^\s*<p><em>This content is for informational and educational purposes only and does not constitute financial advice\.<\/em><\/p>/i.test(contentHtml)) {
    contentHtml = `<p><em>This content is for informational and educational purposes only and does not constitute financial advice.</em></p>\n${contentHtml}`
  }

  if (!hasH2Section(contentHtml, 'Quick Answer')) {
    contentHtml = contentHtml.replace(
      /<h2[^>]*>\s*Key Takeaways\s*<\/h2>/i,
      `<h2>Quick Answer</h2>\n<p>${outline.primaryKeyword} depends on your goals, timeline, income, and risk level. The best choice is usually the one that solves the immediate financial problem without creating unnecessary cost, risk, or complexity.</p>\n<h2>Key Takeaways</h2>`
    )
  }

  if (!hasH2Section(contentHtml, 'Real Examples')) {
    contentHtml += `\n<h2>Real Examples</h2>\n<p>Example 1: A reader with steady income may choose a simple automated plan because predictable transfers make progress easier to maintain.</p>\n<p>Example 2: A reader with variable income may need a larger cash buffer first, then use percentage-based transfers so savings adjust naturally when income changes.</p>`
  }

  if (!hasH2Section(contentHtml, 'FAQ')) {
    contentHtml += `\n<h2>FAQ</h2>\n<h3>What is the best first step?</h3>\n<p>Start by identifying your goal, timeline, current cash flow, and the biggest risk that could interrupt your plan.</p>\n<h3>How do I know if this strategy fits me?</h3>\n<p>A strategy fits when it is realistic for your income, protects essential expenses, and does not rely on guaranteed outcomes.</p>\n<h3>Should I speak with a professional?</h3>\n<p>Consider speaking with a qualified professional when decisions involve taxes, investing, debt, mortgages, or major long-term financial commitments.</p>\n<h3>How often should I review the plan?</h3>\n<p>Review it whenever your income, expenses, goals, or financial obligations change.</p>`
  }

  if (!hasH2Section(contentHtml, 'Sources')) {
    const sourceItems = outline.externalSources.length > 0
      ? outline.externalSources
          .map((source) => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label}</a></li>`)
          .join('')
      : '<li><a href="https://www.consumerfinance.gov/" target="_blank" rel="noopener noreferrer">Consumer Financial Protection Bureau</a></li>'

    contentHtml += `\n<h2>Sources</h2>\n<ul>${sourceItems}</ul>`
  }

  return {
    ...article,
    contentHtml,
  }
}

async function autoFeatureBestArticle(postId: string) {
  const supabase = createAdminClient()

  await supabase
    .from('posts')
    .update({ is_featured: false })
    .neq('id', postId)

  const { error } = await supabase
    .from('posts')
    .update({
      is_featured: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) {
    throw new Error(`Failed to auto-feature article: ${error.message}`)
  }
}

async function createDraftPost(
  article: GeneratedArticle,
  category: Category,
  coverUrl: string | null,
  plan: TopicPlan,
  outline: ArticleOutline
) {
  const supabase = createAdminClient()

  // 🔑 Build slug safely
  const slug = buildSlug(article.title)

  // ⏱️ Read time
  const readTime = readingTime(stripHtml(article.contentHtml)).text

  // 🧠 Evaluate article quality + risk
  const evaluation = evaluateFinanceArticle({
    title: article.title,
    excerpt: article.excerpt,
    body: article.contentHtml,
    primaryKeyword: outline.primaryKeyword,
    category,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    coverUrl,
  })

  // 🚨 STRICT auto-publish logic
  const isSafeToAutoPublish =
    evaluation.passed === true &&
    evaluation.score >= 85 &&
    evaluation.risk_level === 'low'

  // 📌 Status logic
  const status = isSafeToAutoPublish
    ? 'published'
    : nextStatusFromEvaluation(evaluation)

  // 🧱 Build payload
  const payload: Record<string, any> = {
    title: article.title,
    slug,
    excerpt: article.excerpt,
    body: article.contentHtml,
    category,
    author: article.author,
    cover_url: coverUrl,

    seo_title: article.seoTitle,
    seo_description: article.seoDescription,

    primary_keyword: outline.primaryKeyword,
    related_keywords: outline.relatedKeywords,

    quality_score: evaluation.score,
    risk_level: evaluation.risk_level,
    status,

    workflow_meta: {
      angle: plan.angle,
      audience: plan.audience,
      searchIntent: outline.searchIntent,
      seedKeyword: plan.primaryKeyword,
      externalSources: outline.externalSources,
      humanized: true,
      autoPublished: isSafeToAutoPublish,
      autoPublishReason: isSafeToAutoPublish
        ? 'Passed quality checks (score ≥ 85, low risk)'
        : 'Held for review (did not meet auto-publish threshold)',
    },

    // 🚀 THIS is what controls visibility on site
    published: isSafeToAutoPublish,
    published_at: isSafeToAutoPublish
      ? new Date().toISOString()
      : null,

    read_time: readTime,
    updated_at: new Date().toISOString(),
  }

  // 💾 Insert post
  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 📊 Save quality check
  const { error: qualityError } = await supabase
    .from('quality_checks')
    .insert({
      post_id: data.id,
      score: evaluation.score,
      passed: evaluation.passed,
      risk_level: evaluation.risk_level,
      checks: evaluation.checks,
    })

  if (qualityError) {
    throw new Error(qualityError.message)
  }
  if (isSafeToAutoPublish) {
    await autoFeatureBestArticle(data.id)
  }
  
  return data

  // 🧹 OPTIONAL: mark keyword as completed
  if (plan?.primaryKeyword) {
    await supabase
      .from('keyword_queue')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .ilike('keyword', plan.primaryKeyword)
  }

  return data
}

async function claimSpecificQueuedKeyword(keywordId: string): Promise<QueueRow | null> {
  await recoverStaleProcessingKeywords()
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { data: existing, error: lookupError } = await supabase
    .from('keyword_queue')
    .select('id, keyword, category, intent, brief, status')
    .eq('id', keywordId)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)
  if (!existing) return null
  if (!['queued', 'failed'].includes(String((existing as any).status ?? '').toLowerCase())) return null

  const { data: updated, error } = await supabase
    .from('keyword_queue')
    .update({ status: 'processing', updated_at: now, notes: null })
    .eq('id', keywordId)
    .eq('status', (existing as any).status)
    .select('id, keyword, category, intent, brief')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (updated as QueueRow | null) ?? null
}

async function claimQueuedKeywords(limit: number): Promise<QueueRow[]> {
  await recoverStaleProcessingKeywords()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('keyword_queue')
    .select('id, keyword, category, intent, brief')
    .eq('status', 'queued')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  const claimed: QueueRow[] = []
  for (const row of (data ?? []) as QueueRow[]) {
    const { data: updated, error: updateError } = await supabase
      .from('keyword_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('status', 'queued')
      .select('id, keyword, category, intent, brief')
      .maybeSingle()

    if (updateError) throw new Error(updateError.message)
    if (updated) claimed.push(updated as QueueRow)
  }

  return claimed
}

async function updateQueueStatus(
  queueId: string,
  status: 'completed' | 'failed' | 'skipped',
  brief: Record<string, any> = {},
  notes?: string
) {
  const supabase = createAdminClient()
  const payload: Record<string, any> = {
    status,
    brief,
    updated_at: new Date().toISOString(),
  }
  if (status === 'completed' || status === 'failed' || status === 'skipped') {
    payload.processed_at = new Date().toISOString()
  }
  if (notes) payload.notes = notes

  const { error } = await supabase.from('keyword_queue').update(payload).eq('id', queueId)
  if (error) throw new Error(error.message)
}

async function runDraftGeneration(now: Date, queueItem?: QueueRow) {
  const preferredCategory = getCategoryForToday(now)
  const candidate = queueItem
    ? { category: queueItem.category, seedTopic: queueItem.keyword, plan: await generateTopicPlan(queueItem.category, queueItem.keyword) }
    : await pickCandidateForToday(now)

  if (!candidate) {
    return {
      success: true,
      skipped: true,
      reason: 'No eligible topic available after duplicate and angle checks',
      preferredCategory,
    }
  }

  const { category, seedTopic, plan } = candidate
  const internalLinks = await fetchInternalLinks(category, plan.primaryKeyword, plan.relatedKeywords)
  const outline = await generateOutline(category, plan, internalLinks)
  const articleDraft = await generateArticle(category, plan, outline, internalLinks)
  const humanizedArticle = await humanizeArticle(articleDraft, category, plan, outline, internalLinks)
  const article = ensureArticleRequiredSections(humanizedArticle, outline)
  const slug = buildSlug(article.title)

  if (await slugExists(slug)) {
    if (queueItem) {
      await updateQueueStatus(queueItem.id, 'skipped', { duplicate_slug: slug }, 'Duplicate slug after article generation')
    }
    return {
      success: true,
      skipped: true,
      reason: 'Duplicate slug after article generation',
      preferredCategory,
      selectedCategory: category,
      seedTopic,
      slug,
      title: article.title,
    }
  }

  if (await hasSimilarRecentTitle(article.title)) {
    if (queueItem) {
      await updateQueueStatus(queueItem.id, 'skipped', { title: article.title }, 'Similar title already exists in recent posts')
    }
    return {
      success: true,
      skipped: true,
      reason: 'Similar title already exists in recent posts',
      preferredCategory,
      selectedCategory: category,
      seedTopic,
      slug,
      title: article.title,
    }
  }

  const coverUrl = pickStockCoverByCategory(category, `${category}-${seedTopic}-${plan.primaryKeyword}`)
  const created = await createDraftPost(article, category, coverUrl, plan, outline)

  if (queueItem) {
    await updateQueueStatus(queueItem.id, 'completed', {
      post_id: created.id,
      post_slug: created.slug,
      post_title: created.title,
      primary_keyword: outline.primaryKeyword,
      related_keywords: outline.relatedKeywords,
    })
  }

  return {
    success: true,
    created: true,
    post: {
      id: created.id,
      title: created.title,
      slug: created.slug,
      category: created.category,
      published: created.published,
      cover_url: created.cover_url,
      status: created.status,
      quality_score: created.quality_score,
    },
    strategy: {
      preferredCategory,
      selectedCategory: category,
      seedTopic,
      primaryKeyword: outline.primaryKeyword,
      relatedKeywords: outline.relatedKeywords,
      searchIntent: outline.searchIntent,
      angle: plan.angle,
      source: queueItem ? 'keyword_queue' : 'topic_bank',
    },
  }
}

async function pickCandidateForToday(now: Date): Promise<CandidateSelection | null> {
  const recentPosts = await fetchRecentPostSignals(ANGLE_LOOKBACK_DAYS)
  const orderedCategories = getOrderedCategories(now)
  let attempts = 0

  for (const category of orderedCategories) {
    const topics = getOrderedTopics(category, now)

    for (const seedTopic of topics) {
      if (attempts >= MAX_TOPIC_PLAN_ATTEMPTS) {
        return null
      }

      attempts += 1
      const plan = await generateTopicPlan(category, seedTopic)

      if (await hasRecentKeyword(plan.primaryKeyword)) {
        console.log('daily-draft skipped candidate due to recent keyword', {
          category,
          seedTopic,
          primaryKeyword: plan.primaryKeyword,
        })
        continue
      }

      if (hasRecentlyUsedAngle(plan, recentPosts)) {
        console.log('daily-draft skipped candidate due to similar recent angle', {
          category,
          seedTopic,
          primaryKeyword: plan.primaryKeyword,
          angle: plan.angle,
        })
        continue
      }

      return { category, seedTopic, plan }
    }
  }

  return null
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
    const count = Math.min(Math.max(Number(searchParams.get('count') ?? '1'), 1), 5)
    const keywordId = searchParams.get('keywordId')
    const now = new Date()
    const claimedKeyword = keywordId ? await claimSpecificQueuedKeyword(keywordId) : null
    const queuedItems = keywordId
      ? (claimedKeyword ? [claimedKeyword] : [])
      : await claimQueuedKeywords(count)
    const results: any[] = []

    for (const queueItem of queuedItems) {
      try {
        results.push(await withTimeout(runDraftGeneration(now, queueItem), DRAFT_TIMEOUT_MS, `Draft generation for ${queueItem.keyword}`))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown queue processing error'
        await updateQueueStatus(queueItem.id, 'failed', {}, message)
        results.push({ success: false, created: false, queueId: queueItem.id, error: message })
      }
    }

    while (!keywordId && results.length < count) {
      results.push(await withTimeout(runDraftGeneration(now), DRAFT_TIMEOUT_MS, 'Draft generation'))
      if (count === 1) break
      if (results[results.length - 1]?.skipped) break
    }

    if (keywordId && queuedItems.length === 0) {
      return jsonError('Keyword is no longer queued or was already processed', 409)
    }

    if (results.length === 1) {
      return NextResponse.json(results[0])
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      createdCount: results.filter((item) => item.created).length,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error creating SEO draft'
    return jsonError(message, 500)
  }
}

