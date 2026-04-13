import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import readingTime from 'reading-time'
import { createAdminClient } from '@/lib/supabase-server'
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

const AUTHOR_NAME = 'CashClimb Editorial'
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

const DEFAULT_STOCK_COVERS: Record<Category, string> = {
  'Personal Finance':
    'https://images.pexels.com/photos/5942583/pexels-photo-5942583.jpeg?cs=srgb&dl=pexels-karola-g-5942583.jpg&fm=jpg',
  Credit:
    'https://images.pexels.com/photos/6609234/pexels-photo-6609234.jpeg?cs=srgb&dl=pexels-mikhail-nilov-6609234.jpg&fm=jpg',
  Retirement:
    'https://images.pexels.com/photos/5591267/pexels-photo-5591267.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-5591267.jpg&fm=jpg',
  Investing:
    'https://images.pexels.com/photos/5717758/pexels-photo-5717758.jpeg?cs=srgb&dl=pexels-karola-g-5717758.jpg&fm=jpg',
  Taxes:
    'https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?cs=srgb&dl=pexels-n-voitkevich-6863332.jpg&fm=jpg',
  'Real Estate':
    'https://images.pexels.com/photos/34135038/pexels-photo-34135038.jpeg?cs=srgb&dl=pexels-jakubzerdzicki-34135038.jpg&fm=jpg',
}

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

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in', 'is',
  'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'what', 'when', 'why', 'with',
  'your', 'you', 'into', 'than', 'vs', 'vs.', 'after', 'before', 'more', 'less', 'over',
  'under', 'about', 'best', 'guide', 'beginner', 'beginners', 'checklist', 'steps',
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
  return CATEGORY_ROTATION.map((_, index) => CATEGORY_ROTATION[(dayNumber + index) % CATEGORY_ROTATION.length])
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

function pickStockCoverByCategory(category: Category): string {
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

function parseCoverUrls(raw?: string) {
  return (raw ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
}

function hashString(input: string) {
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
  return tokenizeForSimilarity([
    plan.primaryKeyword,
    plan.workingTitle,
    plan.angle,
    plan.searchIntent,
    plan.audience,
    ...plan.relatedKeywords,
  ].join(' '))
}

function buildRecentPostSignature(post: RecentPostSignal) {
  return tokenizeForSimilarity([
    post.title ?? '',
    post.excerpt ?? '',
    post.seo_title ?? '',
    post.seo_description ?? '',
  ].join(' '))
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

async function fetchInternalLinks(category: Category): Promise<InternalLink[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select('title, slug, category')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(16)

  if (error) {
    throw new Error(`Failed to fetch internal links: ${error.message}`)
  }

  const allPosts = (data ?? []) as InternalLink[]
  const sameCategory = allPosts.filter((post) => post.category === category).slice(0, 4)
  const others = allPosts.filter((post) => post.category !== category).slice(0, 4)

  return [...sameCategory, ...others].slice(0, 6)
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

function buildOutlinePrompt(
  category: Category,
  plan: TopicPlan,
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
      ? outline.externalSources
          .map((s, index) => `${index + 1}. ${s.label} - ${s.url}`)
          .join('\n')
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
  "author": "CashClimb Editorial"
}

Article strategy:
- Category: ${category}
- Primary keyword: ${outline.primaryKeyword}
- Related keywords: ${outline.relatedKeywords.join(', ')}
- Search intent: ${outline.searchIntent}
- Audience: ${plan.audience}
- Angle: ${plan.angle}

Approved structure:
- Title: ${outline.title}
- Excerpt: ${outline.excerpt}
- SEO title: ${outline.seoTitle}
- SEO description: ${outline.seoDescription}
- H2 sections:
${outline.h2s.map((h, i) => `${i + 1}. ${h}`).join('\n')}
- Key takeaways:
${outline.keyTakeaways.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Available internal links:
${linksText}

Approved external sources:
${sourcesText}

Writing requirements:
- Write for Western readers only.
- Use plain, confident, editorial English.
- Do not use markdown.
- contentHtml must be valid HTML only.
- Start with one short intro paragraph.
- Immediately after the intro, include:
  <h2>Key Takeaways</h2>
  followed by a <ul> with 3 to 5 bullet points.
- Use the approved H2 structure above.
- Each section should move the reader forward and answer a real question.
- Include at least one concrete numerical example using USD.
- Include 2 to 4 natural internal links using <a href="/blog/...">...</a>.
- Include 1 to 2 external authority links using:
  <a href="URL" target="_blank" rel="noopener noreferrer">Label</a>
- Include a "Common Mistakes to Avoid" section if not already present in the H2 list.
- Include a "What You Can Do Next" section if not already present in the H2 list.
- End with a short conclusion.
- Keep the article around 1000 to 1500 words.
- Avoid fluff, repetition, generic filler, and robotic transitions.
- Do not mention AI.
- Do not make guarantees, predictions, or personalized financial advice.
- Do not use Philippine references, agencies, institutions, or slang.
- Prefer examples and framing relevant to the US, Canada, UK, and Australia.

Thinking quality requirements:
- Before writing, internally plan the reader’s decision problem.
- Explain tradeoffs, not just tips.
- Use specific, practical explanations.
- Write like a strong editor, not a generic content generator.

Return the same title, excerpt, seoTitle, and seoDescription from the approved outline unless a tiny improvement is necessary.
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

async function createDraftPost(
  article: GeneratedArticle,
  category: Category,
  coverUrl: string | null
) {
  const supabase = createAdminClient()
  const slug = buildSlug(article.title)
  const readTime = readingTime(stripHtml(article.contentHtml)).text

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
    published: false,
    read_time: readTime,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
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

  if (!expected) {
    return jsonError('Missing CRON_SECRET environment variable.')
  }

  if (authHeader !== `Bearer ${expected}`) {
    return jsonError('Unauthorized', 401)
  }

  try {
    const now = new Date()
    const preferredCategory = getCategoryForToday(now)
    const candidate = await pickCandidateForToday(now)

    if (!candidate) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No eligible topic available after duplicate and angle checks',
        preferredCategory,
      })
    }

    const { category, seedTopic, plan } = candidate
    const internalLinks = await fetchInternalLinks(category)
    const outline = await generateOutline(category, plan, internalLinks)
    const article = await generateArticle(category, plan, outline, internalLinks)
    const slug = buildSlug(article.title)

    if (await slugExists(slug)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Duplicate slug after article generation',
        preferredCategory,
        selectedCategory: category,
        seedTopic,
        slug,
        title: article.title,
      })
    }

    if (await hasSimilarRecentTitle(article.title)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Similar title already exists in recent posts',
        preferredCategory,
        selectedCategory: category,
        seedTopic,
        slug,
        title: article.title,
      })
    }

    const coverUrl = pickStockCoverByCategory(category, `${category}-${seedTopic}-${plan.primaryKeyword}`)

    console.log('daily-draft selected candidate', {
      preferredCategory,
      selectedCategory: category,
      seedTopic,
      primaryKeyword: plan.primaryKeyword,
      angle: plan.angle,
      coverUrl,
    })

    const created = await createDraftPost(article, category, coverUrl)

    return NextResponse.json({
      success: true,
      created: true,
      post: {
        id: created.id,
        title: created.title,
        slug: created.slug,
        category: created.category,
        published: created.published,
        cover_url: created.cover_url,
      },
      strategy: {
        preferredCategory,
        selectedCategory: category,
        seedTopic,
        primaryKeyword: outline.primaryKeyword,
        relatedKeywords: outline.relatedKeywords,
        searchIntent: outline.searchIntent,
        angle: plan.angle,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error creating SEO draft'

    return jsonError(message, 500)
  }
}