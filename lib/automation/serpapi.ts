import type { Category } from '@/types'

export type SerpKeywordIdea = {
  keyword: string
  category: Category
  intent: string
  priority: number
  brief: Record<string, unknown>
}

const CASHCLIMB_CATEGORIES: Category[] = [
  'Personal Finance',
  'Credit',
  'Investing',
  'Retirement',
  'Taxes',
  'Real Estate',
]

const CATEGORY_SEEDS: Record<Category, string[]> = {
  'Personal Finance': [
    'how to save money',
    'monthly budget',
    'emergency fund',
    'paycheck budget',
    'sinking funds',
  ],
  Credit: [
    'credit score',
    'credit utilization',
    'credit card debt',
    'secured credit card',
    'credit report errors',
  ],
  Investing: [
    'index funds',
    'etf investing',
    'dollar cost averaging',
    'investment risk tolerance',
    'brokerage account',
  ],
  Retirement: [
    'retirement savings',
    'ira vs 401k',
    'employer match',
    'compound interest retirement',
    'catch up contributions',
  ],
  Taxes: [
    'tax documents checklist',
    'quarterly taxes',
    'freelancer taxes',
    'organize receipts for taxes',
    'side hustle taxes',
  ],
  'Real Estate': [
    'first time homebuyer',
    'mortgage affordability',
    'rent vs buy',
    'closing costs',
    'down payment savings',
  ],
}

const QUESTION_PREFIXES = ['how to', 'what is', 'when to', 'best way to']
const LOW_QUALITY_PATTERNS = [
  /\bcasino\b/i,
  /\bcrypto\b/i,
  /\bforex\b/i,
  /\bloan shark\b/i,
  /\bpayday loan\b/i,
  /\bget rich\b/i,
  /\bguaranteed\b/i,
  /\brisk free\b/i,
  /\bfree money\b/i,
]

function apiKey() {
  return process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY || process.env.SERPAPI_KEY || ''
}

function cleanKeyword(value: any) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function ensureCategory(value: unknown): Category {
  return CASHCLIMB_CATEGORIES.includes(value as Category) ? (value as Category) : 'Personal Finance'
}

function inferIntent(keyword: string, requested?: string | null) {
  const request = String(requested || '').toLowerCase().trim()
  if (request && request !== 'mixed') return request
  if (/\b(vs|compare|comparison)\b/.test(keyword)) return 'comparison'
  if (/\b(mistake|avoid|wrong)\b/.test(keyword)) return 'mistakes'
  if (/\bchecklist\b/.test(keyword)) return 'checklist'
  if (/^how to\b|step by step/.test(keyword)) return 'how-to'
  if (/^what is\b|explained/.test(keyword)) return 'explainer'
  return 'informational'
}

function looksSafe(keyword: string) {
  if (keyword.length < 12 || keyword.length > 90) return false
  if (keyword.split(' ').length < 3) return false
  return !LOW_QUALITY_PATTERNS.some((pattern) => pattern.test(keyword))
}

function buildBrief(keyword: string, category: Category, intent: string, input?: any) {
  return {
    keyword,
    category,
    intent,
    angle: `Answer the search intent behind "${keyword}" with a practical, cautious personal-finance guide.`,
    audience: input?.audience || 'Beginners',
    market: input?.market || 'US / Canada / UK / Australia',
    source: 'serpapi',
    pillar_topic: titleCase(category),
    cluster_type: intent === 'comparison' ? 'comparison' : intent === 'checklist' ? 'checklist' : 'supporting',
    requiredSections: [
      'Quick Answer',
      'Key Takeaways',
      'Decision Checklist',
      'Risk and Tradeoffs',
      'Common Mistakes to Avoid',
      'What You Can Do Next',
      'FAQ',
      'Sources',
    ],
  }
}

function buildIdea(keyword: string, category: Category, input?: any): SerpKeywordIdea | null {
  const clean = cleanKeyword(keyword)
  if (!looksSafe(clean)) return null

  const intent = inferIntent(clean, input?.intentMix)
  const intentBoost = /how to|what is|checklist|mistake|vs|explained|beginner/.test(clean) ? 0 : 10
  const lengthPenalty = Math.max(0, clean.split(' ').length - 8) * 2

  return {
    keyword: clean,
    category,
    intent,
    priority: 10 + intentBoost + lengthPenalty,
    brief: buildBrief(clean, category, intent, input),
  }
}

function categoriesForFocus(focus?: string | null): Category[] {
  if (focus && focus !== 'Mixed' && CASHCLIMB_CATEGORIES.includes(focus as Category)) {
    return [focus as Category]
  }
  return CASHCLIMB_CATEGORIES
}

function buildQueries(category: Category, requested: number, categoryCount: number) {
  const seeds = CATEGORY_SEEDS[category]
  const perCategory = Math.max(1, Math.min(4, Math.ceil(requested / Math.max(1, categoryCount))))
  const pickedSeeds = seeds.slice(0, perCategory)
  const queries: string[] = []

  for (const seed of pickedSeeds) {
    queries.push(seed)
    for (const prefix of QUESTION_PREFIXES.slice(0, 2)) {
      if (!seed.startsWith(prefix)) queries.push(`${prefix} ${seed}`)
    }
  }

  return queries.slice(0, Math.max(2, perCategory * 2))
}

async function fetchAutocomplete(query: string): Promise<string[]> {
  const key = apiKey()
  if (!key) return []

  const params = new URLSearchParams({
    engine: 'google_autocomplete',
    q: query,
    gl: 'us',
    hl: 'en',
    api_key: key,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.warn('[serpapi] autocomplete failed', response.status, text.slice(0, 300))
      return []
    }

    const data = await response.json()
    const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : []

    return suggestions
      .map((item: any) => item?.value || item?.suggestion || item?.term || '')
      .filter(Boolean)
  } catch (error: any) {
    console.warn('[serpapi] autocomplete error', error?.message || error)
    return []
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateSerpApiKeywordIdeas(input?: {
  focus?: Category | 'Mixed' | string | null
  howMany?: number | string | null
  audience?: string | null
  intentMix?: string | null
  market?: string | null
  riskTolerance?: string | null
}): Promise<SerpKeywordIdea[]> {
  if (!apiKey()) return []

  const requested = Math.min(50, Math.max(1, Number(input?.howMany ?? 20) || 20))
  const categories = categoriesForFocus(input?.focus ?? null)
  const ideas: SerpKeywordIdea[] = []
  const seen = new Set<string>()

  for (const category of categories) {
    for (const query of buildQueries(category, requested, categories.length)) {
      const suggestions = await fetchAutocomplete(query)
      for (const suggestion of suggestions) {
        const idea = buildIdea(suggestion, ensureCategory(category), input)
        if (!idea) continue

        const key = `${idea.category}:${idea.keyword}`
        if (seen.has(key)) continue

        seen.add(key)
        ideas.push(idea)
      }

      if (ideas.length >= requested * 2) break
    }

    if (ideas.length >= requested * 2) break
  }

  return ideas
    .sort((a, b) => a.priority - b.priority || a.keyword.localeCompare(b.keyword))
    .slice(0, requested)
}
