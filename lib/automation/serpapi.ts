import type { Category } from '@/types'
import {
  buildKeywordQueries,
  ensureCategory,
  fallbackHighValueCandidates,
  inferCategory,
  inferIntent,
  rankKeywordCandidates,
  type KeywordCandidate,
} from './keyword-intelligence'
import { canonicalPrimaryKeyword } from '@/lib/seo/keyword-quality'

export type SerpKeywordIdea = {
  keyword: string
  category: Category
  intent: string
  priority: number
  brief: Record<string, unknown>
}

function apiKey() {
  return process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY || process.env.SERPAPI_KEY || ''
}

async function fetchJson(params: URLSearchParams) {
  const key = apiKey()
  if (!key) return null
  params.set('api_key', key)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.warn('[serpapi] request failed', response.status, text.slice(0, 300))
      return null
    }
    return await response.json()
  } catch (error: any) {
    console.warn('[serpapi] request error', error?.message || error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAutocomplete(query: string): Promise<string[]> {
  const data = await fetchJson(new URLSearchParams({
    engine: 'google_autocomplete',
    q: query,
    gl: 'us',
    hl: 'en',
  }))

  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : []
  return suggestions
    .map((item: any) => item?.value || item?.suggestion || item?.term || '')
    .filter(Boolean)
}

async function fetchGoogleSerp(query: string) {
  const data = await fetchJson(new URLSearchParams({
    engine: 'google',
    q: query,
    google_domain: 'google.com',
    gl: 'us',
    hl: 'en',
    num: '10',
  }))

  if (!data) return { keywords: [], signals: {} as Record<string, any> }

  const related = Array.isArray(data?.related_searches)
    ? data.related_searches.map((item: any) => item?.query || item?.title || '').filter(Boolean)
    : []
  const paa = Array.isArray(data?.related_questions)
    ? data.related_questions.map((item: any) => item?.question || '').filter(Boolean)
    : []
  const organic = Array.isArray(data?.organic_results) ? data.organic_results : []
  const titles = organic.map((item: any) => `${item?.title || ''} ${item?.snippet || ''}`).join(' ')
  const topBrands = (titles.match(/nerdwallet|bankrate|investopedia|forbes|cnbc|experian|equifax|transunion|fidelity|vanguard/gi) || []).length
  const gov = (titles.match(/\.gov|irs|consumerfinance|sec\.gov/gi) || []).length
  const bigPublisher = (titles.match(/nerdwallet|bankrate|investopedia|forbes|cnbc|marketwatch/gi) || []).length

  return {
    keywords: [...related, ...paa],
    signals: {
      related: related.length ? 1 : 0,
      paa: paa.length ? 1 : 0,
      topBrands,
      gov,
      bigPublisher,
    },
  }
}

function mergeSignals(existing: Record<string, any> = {}, next: Record<string, any> = {}) {
  return {
    appearances: Number(existing.appearances || 0) + Number(next.appearances || 0),
    autocomplete: Number(existing.autocomplete || 0) + Number(next.autocomplete || 0),
    related: Math.max(Number(existing.related || 0), Number(next.related || 0)),
    paa: Math.max(Number(existing.paa || 0), Number(next.paa || 0)),
    topBrands: Math.max(Number(existing.topBrands || 0), Number(next.topBrands || 0)),
    gov: Math.max(Number(existing.gov || 0), Number(next.gov || 0)),
    bigPublisher: Math.max(Number(existing.bigPublisher || 0), Number(next.bigPublisher || 0)),
  }
}

export async function generateSerpApiKeywordIdeas(input?: {
  focus?: Category | 'Mixed' | string | null
  howMany?: number | string | null
  audience?: string | null
  intentMix?: string | null
  market?: string | null
  riskTolerance?: string | null
  existingKeywords?: string[]
  existingTitles?: string[]
}): Promise<SerpKeywordIdea[]> {
  const requested = Math.min(100, Math.max(1, Number(input?.howMany ?? 20) || 20))

  if (!apiKey()) {
    return rankKeywordCandidates({
      candidates: fallbackHighValueCandidates({ focus: input?.focus ?? 'Mixed' }),
      requested,
      existingKeywords: input?.existingKeywords,
      existingTitles: input?.existingTitles,
      options: input,
    }).slice(0, requested).map(toSerpKeywordIdea)
  }

  const candidateMap = new Map<string, { keyword: string; category: Category; source: string; signals: Record<string, any> }>()
  const queries = buildKeywordQueries({ focus: input?.focus ?? 'Mixed', howMany: requested * 5 })
  const queryLimit = Math.min(36, queries.length)

  for (const { query, category } of queries.slice(0, queryLimit)) {
    const autocomplete = await fetchAutocomplete(query)
    for (const suggestion of autocomplete) {
      const keyword = canonicalPrimaryKeyword(suggestion)
      const inferred = inferCategory(keyword, ensureCategory(category))
      const key = `${inferred}:${keyword}`
      const current = candidateMap.get(key)
      candidateMap.set(key, {
        keyword,
        category: inferred,
        source: 'serpapi-autocomplete',
        signals: mergeSignals(current?.signals, { appearances: 1, autocomplete: 1 }),
      })
    }

    const serp = await fetchGoogleSerp(query)
    for (const suggestion of serp.keywords) {
      const keyword = canonicalPrimaryKeyword(suggestion)
      const inferred = inferCategory(keyword, ensureCategory(category))
      const key = `${inferred}:${keyword}`
      const current = candidateMap.get(key)
      candidateMap.set(key, {
        keyword,
        category: inferred,
        source: 'serpapi-serp',
        signals: mergeSignals(current?.signals, { ...serp.signals, appearances: 1 }),
      })
    }

    if (candidateMap.size >= requested * 12) break
  }

  for (const fallback of fallbackHighValueCandidates({ focus: input?.focus ?? 'Mixed' })) {
    const keyword = canonicalPrimaryKeyword(fallback.keyword)
    const key = `${fallback.category}:${keyword}`
    if (!candidateMap.has(key)) candidateMap.set(key, fallback)
  }

  const ranked = rankKeywordCandidates({
    candidates: Array.from(candidateMap.values()).map((candidate) => ({
      ...candidate,
      intent: inferIntent(candidate.keyword, input?.intentMix),
    })),
    requested,
    existingKeywords: input?.existingKeywords,
    existingTitles: input?.existingTitles,
    options: input,
  })

  return ranked.slice(0, requested).map(toSerpKeywordIdea)
}

function toSerpKeywordIdea(candidate: KeywordCandidate): SerpKeywordIdea {
  return {
    keyword: candidate.keyword,
    category: candidate.category,
    intent: candidate.intent,
    priority: candidate.priority,
    brief: candidate.brief,
  }
}
