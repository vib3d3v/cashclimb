import type { Category } from '@/types'
import {
  canonicalPrimaryKeyword,
  cleanKeywordList,
  cleanSeoText,
  cleanSlugText,
  keywordLooksSeoWorthy,
  significantKeywordTerms,
} from '@/lib/seo/keyword-quality'

export type KeywordCandidate = {
  keyword: string
  category: Category
  intent: string
  priority: number
  source: string
  brief: Record<string, any>
  score: number
  score_breakdown: KeywordScoreBreakdown
  cluster: string
}

export type KeywordScoreBreakdown = {
  demand: number
  difficulty: number
  intent: number
  commercial: number
  topicalAuthority: number
  coverageGap: number
  freshness: number
}

export const CASHCLIMB_CATEGORIES: Category[] = [
  'Personal Finance',
  'Credit',
  'Investing',
  'Retirement',
  'Taxes',
  'Real Estate',
]

const CATEGORY_SEEDS: Record<Category, string[]> = {
  'Personal Finance': [
    'high yield savings account',
    'emergency fund',
    'budget planner',
    'monthly budget',
    'sinking funds',
    'debt payoff plan',
    'net worth tracker',
    'money market account',
  ],
  Credit: [
    'credit score',
    'credit report dispute',
    'hard inquiry',
    'credit utilization',
    'balance transfer credit card',
    'secured credit card',
    'credit freeze',
    'credit card debt',
  ],
  Investing: [
    'roth ira',
    'brokerage account',
    'index funds',
    'etf investing',
    'vanguard etf',
    'fidelity index funds',
    'treasury bills',
    'tax loss harvesting',
  ],
  Retirement: [
    '401k rollover',
    'ira vs 401k',
    'roth ira contribution limits',
    'retirement calculator',
    'target date fund',
    'retirement savings by age',
    'social security retirement age',
    'catch up contributions',
  ],
  Taxes: [
    'tax deductions',
    'quarterly taxes',
    'freelancer taxes',
    'tax documents checklist',
    'home office deduction',
    'estimated tax payments',
    'tax loss harvesting',
    'capital gains tax',
  ],
  'Real Estate': [
    'mortgage refinance',
    'heloc',
    'home equity loan',
    'closing costs',
    'mortgage preapproval',
    'rent vs buy',
    'first time home buyer',
    'property taxes',
  ],
}

const HIGH_VALUE_PHRASES = [
  'best',
  'compare',
  'vs',
  'calculator',
  'rates',
  'fees',
  'account',
  'card',
  'loan',
  'mortgage',
  'refinance',
  'ira',
  '401k',
  'etf',
  'tax',
  'deduction',
  'credit score',
]

const LOW_VALUE_PATTERNS = [
  /\bcasino\b/i,
  /\bforex\b/i,
  /\bcrypto\b/i,
  /\bpayday\b/i,
  /\bloan shark\b/i,
  /\bguaranteed\b/i,
  /\brisk free\b/i,
  /\bfree money\b/i,
  /\bmake money fast\b/i,
  /\bno credit check\b/i,
]

const STOP_TOPICS = new Set([
  'money',
  'finance',
  'personal',
  'guide',
  'beginner',
  'beginners',
  'explained',
  'checklist',
  'best',
  'how',
  'what',
  'when',
  'why',
  'with',
  'without',
])

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export function ensureCategory(value: unknown): Category {
  return CASHCLIMB_CATEGORIES.includes(value as Category) ? (value as Category) : 'Personal Finance'
}

export function inferCategory(keyword: string, fallback?: Category): Category {
  const clean = canonicalPrimaryKeyword(keyword)
  const matches: Array<[Category, number]> = CASHCLIMB_CATEGORIES.map((category) => {
    const seedScore = CATEGORY_SEEDS[category].reduce((score, seed) => {
      const terms = significantKeywordTerms(seed)
      return score + terms.filter((term) => clean.includes(term)).length
    }, 0)
    return [category, seedScore]
  })

  matches.sort((a, b) => b[1] - a[1])
  return matches[0]?.[1] > 0 ? matches[0][0] : ensureCategory(fallback)
}

export function inferIntent(keyword: string, requested?: string | null) {
  const request = String(requested || '').toLowerCase().trim()
  if (request && request !== 'mixed') return request
  if (/\b(best|top|recommended)\b/.test(keyword)) return 'commercial'
  if (/\b(vs|versus|compare|comparison|alternative)\b/.test(keyword)) return 'comparison'
  if (/\b(rate|rates|fee|fees|cost|calculator|account|card|loan|mortgage|refinance)\b/.test(keyword)) return 'commercial-investigation'
  if (/\b(mistake|avoid|warning|risk|red flag)\b/.test(keyword)) return 'mistakes'
  if (/\bchecklist\b/.test(keyword)) return 'checklist'
  if (/^how to\b|step by step/.test(keyword)) return 'how-to'
  if (/^what is\b|explained|meaning/.test(keyword)) return 'explainer'
  return 'informational'
}

export function clusterName(keyword: string, category: Category) {
  const terms = significantKeywordTerms(keyword)
    .filter((term) => !STOP_TOPICS.has(term))
    .slice(0, 3)
  return terms.length ? terms.join(' ') : category.toLowerCase()
}

export function buildKeywordQueries(input?: { focus?: string | null; howMany?: number | string | null }) {
  const requested = Math.max(20, Math.min(500, Number(input?.howMany ?? 100) || 100))
  const categories = input?.focus && input.focus !== 'Mixed' && CASHCLIMB_CATEGORIES.includes(input.focus as Category)
    ? [input.focus as Category]
    : CASHCLIMB_CATEGORIES

  const modifiers = [
    '',
    'best',
    'how to',
    'what is',
    'calculator',
    'checklist',
    'vs',
    'mistakes',
    'fees',
    'rates',
  ]

  const queries: Array<{ query: string; category: Category }> = []
  for (const category of categories) {
    const seeds = CATEGORY_SEEDS[category]
    for (const seed of seeds) {
      for (const modifier of modifiers) {
        const query = modifier ? `${modifier} ${seed}` : seed
        queries.push({ query, category })
      }
    }
  }

  return queries.slice(0, Math.min(120, Math.max(24, requested)))
}

function demandScore(keyword: string, signals?: Record<string, any>) {
  const appearances = Number(signals?.appearances || 1)
  const hasPaa = Number(signals?.paa || 0)
  const hasRelated = Number(signals?.related || 0)
  const hasAutocomplete = Number(signals?.autocomplete || 0)
  const headTermBonus = keyword.split(' ').length <= 5 ? 12 : 4
  const knownDemandBonus = /\b(roth ira|401k|credit score|high yield savings|mortgage|heloc|tax deduction|etf|index fund|hard inquiry|balance transfer|treasury bills)\b/.test(keyword) ? 18 : 0
  return clamp(30 + appearances * 6 + hasPaa * 10 + hasRelated * 8 + hasAutocomplete * 7 + headTermBonus + knownDemandBonus)
}

function difficultyScore(keyword: string, signals?: Record<string, any>) {
  const words = keyword.split(' ').length
  const topBrands = Number(signals?.topBrands || 0)
  const hasGov = Number(signals?.gov || 0)
  const bigPublisher = Number(signals?.bigPublisher || 0)
  const longTailBonus = words >= 5 ? 28 : words >= 4 ? 18 : 8
  const penalty = topBrands * 10 + hasGov * 8 + bigPublisher * 7
  return clamp(70 + longTailBonus - penalty)
}

function intentScore(keyword: string, intent: string) {
  let score = 48
  if (/\b(best|compare|vs|fees|rates|calculator|checklist|mistake|avoid|how to|what is|explained)\b/.test(keyword)) score += 22
  if (['commercial', 'commercial-investigation', 'comparison', 'checklist', 'how-to'].includes(intent)) score += 18
  if (keyword.split(' ').length >= 9) score -= 10
  return clamp(score)
}

function commercialScore(keyword: string, category: Category) {
  let score = 35
  for (const phrase of HIGH_VALUE_PHRASES) {
    if (keyword.includes(phrase)) score += 7
  }
  if (['Investing', 'Credit', 'Real Estate', 'Retirement', 'Taxes'].includes(category)) score += 10
  if (/\b(account|card|loan|mortgage|refinance|ira|401k|etf|tax|deduction|insurance|brokerage)\b/.test(keyword)) score += 18
  return clamp(score)
}

function freshnessScore(keyword: string) {
  if (/\b(2026|rates|limits|tax|contribution|mortgage|refinance|credit card|ira|401k)\b/.test(keyword)) return 90
  return 60
}

export function scoreKeywordCandidate(input: {
  keyword: string
  category: Category
  intent?: string
  signals?: Record<string, any>
  existingKeywords?: string[]
  existingTitles?: string[]
}) {
  const keyword = canonicalPrimaryKeyword(input.keyword)
  const category = ensureCategory(input.category)
  const intent = input.intent || inferIntent(keyword)
  const signals = input.signals || {}
  const existingText = [...(input.existingKeywords || []), ...(input.existingTitles || [])]
    .map(canonicalPrimaryKeyword)
    .join(' | ')
  const terms = significantKeywordTerms(keyword).slice(0, 5)
  const overlap = terms.length ? terms.filter((term) => existingText.includes(term)).length / terms.length : 0
  const coverageGap = clamp(100 - overlap * 100)
  const topicalAuthority = clamp(50 + Math.min(35, terms.length * 7) + (coverageGap > 50 ? 10 : 0))
  const breakdown: KeywordScoreBreakdown = {
    demand: demandScore(keyword, signals),
    difficulty: difficultyScore(keyword, signals),
    intent: intentScore(keyword, intent),
    commercial: commercialScore(keyword, category),
    topicalAuthority,
    coverageGap,
    freshness: freshnessScore(keyword),
  }

  const score = Math.round(
    breakdown.demand * 0.30 +
      breakdown.difficulty * 0.20 +
      breakdown.intent * 0.18 +
      breakdown.commercial * 0.14 +
      breakdown.topicalAuthority * 0.08 +
      breakdown.coverageGap * 0.07 +
      breakdown.freshness * 0.03
  )

  return { score: clamp(score), breakdown }
}

export function isUsableKeyword(keyword: string) {
  const clean = canonicalPrimaryKeyword(keyword)
  if (!keywordLooksSeoWorthy(clean)) return false
  if (LOW_VALUE_PATTERNS.some((pattern) => pattern.test(clean))) return false
  const words = clean.split(' ').filter(Boolean)
  if (words.length < 3 || words.length > 10) return false
  if (/\bnear me\b|\breddit\b|\btemplate pdf\b|\bfree download\b/.test(clean)) return false
  return true
}

export function buildKeywordBrief(candidate: KeywordCandidate, input?: any) {
  const keyword = canonicalPrimaryKeyword(candidate.keyword)
  const category = ensureCategory(candidate.category)
  const intent = candidate.intent || inferIntent(keyword)
  const terms = significantKeywordTerms(keyword)
  const isPillar = candidate.score >= 88 && ['commercial', 'commercial-investigation', 'comparison'].includes(intent)

  return {
    keyword,
    category,
    intent,
    source: candidate.source,
    score: candidate.score,
    score_breakdown: candidate.score_breakdown,
    cluster: candidate.cluster,
    cluster_type: isPillar ? 'pillar' : intent === 'comparison' ? 'comparison' : 'supporting',
    audience: input?.audience || 'Beginners and cautious decision-makers',
    market: 'Primary US focus. Avoid adding country suffixes to titles, slugs, or keywords.',
    angle: `Satisfy the search intent for "${keyword}" with a practical CashClimb finance guide that is clear, safe, and useful enough to earn links and long-tail traffic.`,
    searchIntent: {
      primary: intent,
      userNeeds: buildUserNeeds(keyword, intent),
      likelySERPFeatures: buildSerpFeatures(intent),
    },
    topicalPlan: {
      pillarTopic: candidate.cluster,
      supportingTerms: terms,
      internalLinkTargets: buildInternalLinkTargets(category, candidate.cluster),
    },
    requiredSections: [
      'Quick Answer',
      'Key Takeaways',
      'Step-by-Step Guidance',
      'Decision Checklist',
      'Risk and Tradeoffs',
      'Common Mistakes to Avoid',
      'FAQ',
      'Sources',
      'What You Can Do Next',
    ],
    seoRequirements: [
      'Title must be readable and must not include geo suffixes.',
      'Slug must be clean and must not include usukcaau or country suffix noise.',
      'Primary keyword should be natural, not stuffed.',
      'Meta description must explain the benefit and match intent.',
      'Include at least one official or authoritative source when rules may change.',
    ],
  }
}

function buildUserNeeds(keyword: string, intent: string) {
  if (intent === 'comparison') return ['Know the difference', 'Choose the safer fit', 'Compare costs, risks, and tradeoffs']
  if (intent === 'commercial' || intent === 'commercial-investigation') return ['Compare options', 'Understand fees and risks', 'Know what to check before acting']
  if (intent === 'checklist') return ['Follow a clear checklist', 'Avoid missing steps', 'Know what documents or numbers matter']
  if (intent === 'how-to') return ['Follow practical steps', 'Avoid common mistakes', 'Know when to verify rules']
  return ['Understand the topic quickly', 'Know why it matters', 'Know what to do next']
}

function buildSerpFeatures(intent: string) {
  if (['how-to', 'checklist'].includes(intent)) return ['People Also Ask', 'Featured snippet', 'Step list']
  if (intent === 'comparison') return ['Comparison table', 'People Also Ask', 'Related searches']
  if (intent === 'commercial' || intent === 'commercial-investigation') return ['List results', 'Review pages', 'Calculator or table']
  return ['People Also Ask', 'Featured snippet', 'Related searches']
}

function buildInternalLinkTargets(category: Category, cluster: string) {
  return [
    `/blog?category=${encodeURIComponent(category)}`,
    `/blog/${cleanSlugText(cluster)}`,
  ]
}

export function rankKeywordCandidates(input: {
  candidates: Array<{ keyword: string; category?: Category; intent?: string; source?: string; signals?: Record<string, any> }>
  requested: number
  existingKeywords?: string[]
  existingTitles?: string[]
  options?: any
}): KeywordCandidate[] {
  const seen = new Set<string>()
  const ranked: KeywordCandidate[] = []

  for (const raw of input.candidates) {
    const keyword = canonicalPrimaryKeyword(raw.keyword)
    if (!isUsableKeyword(keyword)) continue
    const category = inferCategory(keyword, raw.category)
    const intent = raw.intent || inferIntent(keyword, input.options?.intentMix)
    const key = `${category}:${keyword}`
    if (seen.has(key)) continue
    seen.add(key)

    const { score, breakdown } = scoreKeywordCandidate({
      keyword,
      category,
      intent,
      signals: raw.signals,
      existingKeywords: input.existingKeywords,
      existingTitles: input.existingTitles,
    })

    if (score < 58) continue

    const cluster = clusterName(keyword, category)
    const candidate: KeywordCandidate = {
      keyword,
      category,
      intent,
      priority: Math.max(1, 101 - score),
      source: raw.source || 'keyword-intelligence',
      score,
      score_breakdown: breakdown,
      cluster,
      brief: {},
    }
    candidate.brief = buildKeywordBrief(candidate, input.options)
    ranked.push(candidate)
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.priority - b.priority || a.keyword.localeCompare(b.keyword))
    .slice(0, Math.max(input.requested, Math.min(100, input.requested * 3)))
}

export function fallbackHighValueCandidates(input?: { focus?: string | null }): Array<{ keyword: string; category: Category; source: string; signals: Record<string, any> }> {
  const categories = input?.focus && input.focus !== 'Mixed' && CASHCLIMB_CATEGORIES.includes(input.focus as Category)
    ? [input.focus as Category]
    : CASHCLIMB_CATEGORIES

  const templates: Record<Category, string[]> = {
    'Personal Finance': [
      'best high yield savings account for emergency fund',
      'money market account vs high yield savings account',
      'emergency fund calculator monthly expenses',
      'debt snowball vs debt avalanche calculator',
      'monthly budget template for irregular income',
    ],
    Credit: [
      'what is a hard inquiry on credit report',
      'how to dispute an unauthorized hard inquiry',
      'credit utilization calculator for credit score',
      'secured credit card vs credit builder loan',
      'balance transfer credit card fees explained',
    ],
    Investing: [
      'roth ira vs brokerage account for beginners',
      'best index funds for beginners explained',
      'treasury bills vs high yield savings account',
      'tax loss harvesting explained for taxable accounts',
      'etf expense ratio calculator for beginners',
    ],
    Retirement: [
      'roth ira vs traditional ira for beginners',
      '401k rollover mistakes to avoid',
      'retirement savings by age calculator',
      'target date fund vs index fund retirement',
      'roth ira contribution limits explained',
    ],
    Taxes: [
      'quarterly tax payment calculator for freelancers',
      'home office deduction checklist for beginners',
      'tax documents checklist before filing',
      'capital gains tax on stocks explained',
      'estimated tax penalty safe harbor explained',
    ],
    'Real Estate': [
      'heloc vs home equity loan calculator',
      'mortgage refinance break even calculator',
      'first time home buyer closing cost checklist',
      'rent vs buy calculator assumptions explained',
      'mortgage preapproval checklist before house hunting',
    ],
  }

  return categories.flatMap((category) => templates[category].map((keyword) => ({
    keyword,
    category,
    source: 'high-value-fallback',
    signals: { appearances: 3, related: 1, paa: 1, autocomplete: 1 },
  })))
}

export function normalizeKeywordQueueRows(candidates: KeywordCandidate[]) {
  return candidates.map((candidate) => ({
    keyword: candidate.keyword,
    category: candidate.category,
    intent: candidate.intent,
    priority: candidate.priority,
    source: candidate.source,
    status: 'queued',
    brief: candidate.brief,
    keyword_score: candidate.score,
    score_breakdown: candidate.score_breakdown,
    topic_cluster: candidate.cluster,
    topic_role: candidate.brief?.cluster_type || 'supporting',
    demand_signal: candidate.score_breakdown.demand,
    difficulty_signal: candidate.score_breakdown.difficulty,
    notes: `Keyword intelligence score ${candidate.score}/100. Cluster: ${candidate.cluster}.`,
  }))
}
