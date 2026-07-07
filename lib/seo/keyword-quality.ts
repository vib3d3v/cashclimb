const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'best', 'by', 'can', 'check', 'for', 'from',
  'guide', 'how', 'i', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'should', 'simple',
  'step', 'steps', 'the', 'this', 'to', 'what', 'when', 'where', 'why', 'with', 'without',
  'you', 'your', 'us', 'uk', 'ca', 'au', 'usa', 'canada', 'australia', '2024', '2025', '2026',
])

const LOW_VALUE_PATTERNS = [
  /\bcasino\b/i,
  /\bcrypto\b/i,
  /\bforex\b/i,
  /\bpayday\b/i,
  /\bloan shark\b/i,
  /\bfree money\b/i,
  /\bguaranteed\b/i,
  /\brisk[-\s]?free\b/i,
  /\bget rich\b/i,
]

const INTENT_WORDS = /\b(how to|checklist|mistakes?|avoid|vs|compare|comparison|explained|calculator|template|examples?|guide|what is|when to|costs?|fees?|rules?)\b/i

const GEO_MARKET_NOISE = /(?:\((?:\s*(?:us|u\.s\.|usa|uk|u\.k\.|ca|canada|au|australia)\s*[\/|,\-]?\s*){2,}\)|\b(?:us\s*\/\s*uk\s*\/\s*ca\s*\/\s*au|u\.s\.\s*\/\s*u\.k\.\s*\/\s*ca\s*\/\s*au|us\s+uk\s+ca\s+au|us-uk-ca-au|usukcaau|us\s*uk\s*ca\s*au|usa\s*\/\s*uk\s*\/\s*canada\s*\/\s*australia|usa\s+uk\s+canada\s+australia)\b)/gi

export function hasGeoMarketNoise(value: any = '') {
  GEO_MARKET_NOISE.lastIndex = 0
  return GEO_MARKET_NOISE.test(String(value || ''))
}

export function removeGeoMarketNoise(value: any = '') {
  return String(value || '')
    .replace(GEO_MARKET_NOISE, ' ')
    .replace(/[-_\s]*(?:usukcaau|us-uk-ca-au|us_uk_ca_au)(?=$|[-_\s,.;:!?)])/gi, ' ')
    .replace(/\b(?:for|in|across)\s*$/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function cleanSeoText(value: any = '') {
  return removeGeoMarketNoise(value)
    .replace(/\s+([:;,.!?])/g, '$1')
    .replace(/([:;,.!?]){2,}/g, '$1')
    .replace(/[\s-]+$/g, '')
    .replace(/^[-\s:;,.]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function cleanSlugText(value: any = '') {
  return cleanSeoText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(?:^|-)(?:usukcaau|us-uk-ca-au|us-uk-ca|us-uk)(?=-|$)/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function cleanKeywordList(value: any = '') {
  return cleanSeoText(value)
    .split(',')
    .map((item) => canonicalPrimaryKeyword(item))
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .join(', ')
}

export function normalizeKeywordText(value: any = '') {
  return cleanSeoText(value)
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function canonicalPrimaryKeyword(value: any = '') {
  return normalizeKeywordText(value)
    .replace(/\b(?:beginner|beginners|complete|practical|simple) guide\b/gi, 'guide')
    .replace(/\b2026 guide\b/gi, 'guide')
    .replace(/\s+/g, ' ')
    .trim()
}

export function significantKeywordTerms(keyword: any = '') {
  const terms = canonicalPrimaryKeyword(keyword)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term))

  return Array.from(new Set(terms))
}

function variants(term: string) {
  const set = new Set([term])
  if (term.endsWith('ies') && term.length > 4) set.add(`${term.slice(0, -3)}y`)
  if (term.endsWith('s') && term.length > 4) set.add(term.slice(0, -1))
  if (!term.endsWith('s')) set.add(`${term}s`)
  return Array.from(set)
}

export function keywordCoverage(keyword: any = '', target: any = '') {
  const terms = significantKeywordTerms(keyword)
  if (terms.length === 0) return 0

  const normalizedTarget = ` ${normalizeKeywordText(target)} `
  const matched = terms.filter((term) => variants(term).some((variant) => normalizedTarget.includes(` ${variant} `)))
  return matched.length / terms.length
}

export function keywordAppearsNaturally(keyword: any = '', title: any = '', body: any = '') {
  const canonical = canonicalPrimaryKeyword(keyword)
  if (!canonical) return true

  const target = `${title} ${String(body || '').slice(0, 1200)}`
  const normalizedTarget = normalizeKeywordText(target)

  if (normalizedTarget.includes(canonical)) return true

  const terms = significantKeywordTerms(keyword)
  if (terms.length <= 2) return keywordCoverage(keyword, target) >= 1

  return keywordCoverage(keyword, target) >= 0.65
}

export function keywordLooksSeoWorthy(keyword: any = '') {
  const clean = canonicalPrimaryKeyword(keyword)
  const wordCount = clean.split(/\s+/).filter(Boolean).length

  if (!clean) return false
  if (clean.length < 12 || clean.length > 85) return false
  if (wordCount < 3 || wordCount > 12) return false
  if (LOW_VALUE_PATTERNS.some((pattern) => pattern.test(clean))) return false

  return INTENT_WORDS.test(clean) || wordCount >= 5
}

function titleCaseWord(word: string) {
  const upper = word.toUpperCase()
  if (['ETF', 'ETFS', 'IRA', '401K', 'APR', 'HELOC', 'W2', '1099', 'IRS', 'CFPB', 'SEC', 'VTI', 'VOO'].includes(upper)) {
    return upper === 'ETFS' ? 'ETFs' : upper
  }
  if (word.toLowerCase() === 'vs') return 'vs'
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function titleCaseKeyword(value: any = '') {
  return canonicalPrimaryKeyword(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ')
    .replace(/^How To\b/, 'How to')
    .replace(/^What Is\b/, 'What Is')
    .replace(/^When To\b/, 'When to')
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOr\b/g, 'or')
    .replace(/\bFor\b/g, 'for')
    .replace(/\bWith\b/g, 'with')
    .replace(/\bWithout\b/g, 'Without')
}

function compactTitle(value: string, max = 70) {
  let title = cleanSeoText(value).replace(/\s+/g, ' ').trim()
  title = title.replace(/\bfor Beginners\b/i, '')
  title = title.replace(/\bStep by Step\b/i, 'Step-by-Step')
  title = title.replace(/\s+/g, ' ').trim()
  if (title.length <= max) return title
  return title
    .replace(/:\s*Practical Checklist$/i, '')
    .replace(/:\s*Step-by-Step Guide$/i, '')
    .replace(/:\s*Clear Guide for Beginners$/i, '')
    .replace(/:\s*Common Mistakes to Avoid$/i, ': Mistakes to Avoid')
    .slice(0, max)
    .replace(/\s+\S*$/, '')
    .trim()
}

export function buildSeoArticleTitle(keyword: any = '', intent?: any) {
  const clean = canonicalPrimaryKeyword(keyword)
  const base = titleCaseKeyword(clean)
  const normalizedIntent = String(intent || '').toLowerCase()

  const candidates = [
    base,
    /^how to\b/i.test(clean) ? base : `How to ${base.charAt(0).toLowerCase()}${base.slice(1)}`,
    /checklist/i.test(clean) || normalizedIntent === 'checklist' ? `${base}: Practical Checklist` : '',
    /mistakes?|avoid/i.test(clean) || normalizedIntent === 'mistakes' ? `${base}: Mistakes to Avoid` : '',
    /\bvs\b|compare|comparison/i.test(clean) || normalizedIntent === 'comparison' ? `${base}: Comparison Guide` : '',
    `${base}: What to Check First`,
    `${base}: Simple Checklist`,
  ].filter(Boolean)

  const healthy = candidates.find((candidate) => candidate.length >= 35 && candidate.length <= 70)
  if (healthy) return healthy

  const short = candidates.find((candidate) => candidate.length < 35)
  if (short) return compactTitle(`${short}: What to Check First`, 70)

  return compactTitle(base, 70)
}

export function buildSeoMetaTitle(keyword: any = '', intent?: any) {
  const articleTitle = buildSeoArticleTitle(keyword, intent)
  if (articleTitle.length >= 40 && articleTitle.length <= 65) return articleTitle

  const base = titleCaseKeyword(keyword)
  const candidates = [
    `${base}: Practical Guide`,
    `${base}: Checklist and Mistakes`,
    `${base}: What to Check First`,
  ]

  return candidates.find((candidate) => candidate.length >= 40 && candidate.length <= 65)
    || compactTitle(articleTitle, 65)
}

export function buildSeoDescription(keyword: any = '') {
  const clean = canonicalPrimaryKeyword(keyword)
  const base = cleanSeoText(`Learn ${clean} with a practical checklist, common mistakes, examples, safer next steps, and current rules to verify before acting.`)
  if (base.length >= 120 && base.length <= 160) return base
  if (base.length > 160) return `${base.slice(0, 157).replace(/\s+\S*$/, '')}...`
  return cleanSeoText(`A practical guide to ${clean}, including what to compare, common mistakes, examples, FAQs, and safer next steps before acting.`).slice(0, 160)
}
