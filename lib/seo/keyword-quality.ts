import slugify from 'slugify'

const GEO_NOISE_PATTERNS = [
  /\(?\s*us\s*\/\s*uk\s*\/\s*ca\s*\/\s*au\s*\)?/gi,
  /\b(?:us\s+uk\s+ca\s+au|u\s*s\s*u\s*k\s*c\s*a\s*a\s*u|usukcaau)\b/gi,
  /\b(?:us[-_]?uk[-_]?ca[-_]?au)\b/gi,
]

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','by','for','from','how','in','into','is','it','of','on','or','the','to','vs','what','when','why','with','without','your','you','guide','explained','beginner','beginners','checklist','step','steps','simple','best','top'
])

export function cleanSeoText(value: any) {
  let text = String(value || '')
  for (const pattern of GEO_NOISE_PATTERNS) text = text.replace(pattern, ' ')
  return text
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/[-–—]\s*$/g, '')
    .replace(/^[-–—]\s*/g, '')
    .trim()
}

export function hasGeoMarketNoise(value: any) {
  const text = String(value || '')
  return GEO_NOISE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(text)
  })
}

export function cleanSlugText(value: any) {
  return slugify(cleanSeoText(value), { lower: true, strict: true })
    .replace(/(?:^|-)usukcaau(?:-|$)/g, '-')
    .replace(/(?:^|-)us-uk-ca-au(?:-|$)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function canonicalPrimaryKeyword(value: any) {
  return cleanSeoText(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function significantKeywordTerms(value: any) {
  return canonicalPrimaryKeyword(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term))
}

export function keywordCoverage(text: any, keyword: any) {
  const haystack = canonicalPrimaryKeyword(text)
  const terms = significantKeywordTerms(keyword)
  if (!terms.length) return 0
  const covered = terms.filter((term) => haystack.includes(term)).length
  return covered / terms.length
}

export function keywordAppearsNaturally(keywordOrText: any, maybeKeyword?: any, maybeText?: any) {
  const legacyMode = arguments.length >= 3
  const keyword = legacyMode ? keywordOrText : maybeKeyword
  const text = legacyMode ? `${maybeKeyword || ''} ${maybeText || ''}` : keywordOrText
  const coverage = keywordCoverage(text, keyword)
  if (coverage >= 0.6) return true
  const cleanText = canonicalPrimaryKeyword(text)
  const cleanKeyword = canonicalPrimaryKeyword(keyword)
  return Boolean(cleanKeyword && cleanText.includes(cleanKeyword))
}

export function keywordLooksSeoWorthy(value: any) {
  const clean = canonicalPrimaryKeyword(value)
  const terms = significantKeywordTerms(clean)
  if (hasGeoMarketNoise(value)) return false
  if (clean.length < 12 || clean.length > 95) return false
  if (terms.length < 2) return false
  if (/\b(casino|forex|crypto|payday|loan shark|guaranteed|risk free|free money|reddit)\b/i.test(clean)) return false
  if (/^(guide|article|post|tips)\b/.test(clean)) return false
  return true
}

export function cleanKeywordList(value: any) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '')
      .split(/[,|;]/)
      .map((item) => item.trim())

  return Array.from(new Set(raw
    .map(canonicalPrimaryKeyword)
    .filter((item) => item && keywordLooksSeoWorthy(item))))
    .slice(0, 12)
}

export function titleCaseKeyword(value: any) {
  return canonicalPrimaryKeyword(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (['ira', '401k', 'etf', 'heloc', 'apr', 'apy', 'irs'].includes(lower)) return lower.toUpperCase()
      if (['a','an','and','as','at','by','for','from','in','of','on','or','the','to','vs','with'].includes(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
    .replace(/\bvs\b/i, 'vs')
}

function trimToWord(value: string, max: number) {
  const clean = cleanSeoText(value)
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '').trim()
}

export function buildSeoArticleTitle(keyword: any, intent?: string | null) {
  const clean = canonicalPrimaryKeyword(keyword)
  const base = titleCaseKeyword(clean)
  const lowerIntent = String(intent || '').toLowerCase()

  let title = base
  if (/\b(vs|versus|compare|comparison)\b/.test(clean) || lowerIntent === 'comparison') title = `${base}: What to Compare`
  else if (/\bmistake|avoid|red flag|warning\b/.test(clean) || lowerIntent === 'mistakes') title = `${base}: Mistakes to Avoid`
  else if (/\bchecklist\b/.test(clean) || lowerIntent === 'checklist') title = base.includes('Checklist') ? base : `${base} Checklist`
  else if (/^how to\b/.test(clean) || lowerIntent === 'how-to') title = base
  else if (/\bcalculator\b/.test(clean)) title = `${base}: What to Check`
  else if (/\b(best|account|card|loan|mortgage|ira|401k|etf|tax|fees|rates)\b/.test(clean)) title = `${base}: Practical Guide`
  else title = `${base}: Beginner Guide`

  title = title
    .replace(/^How To\b/, 'How to')
    .replace(/\bFor\b/g, 'for')
    .replace(/\bWith\b/g, 'with')
    .replace(/\bAnd\b/g, 'and')

  return trimToWord(title, 70)
}

export function buildSeoMetaTitle(keyword: any, intent?: string | null) {
  return trimToWord(buildSeoArticleTitle(keyword, intent), 65)
}

export function buildSeoDescription(keyword: any, category?: string | null) {
  const topic = canonicalPrimaryKeyword(keyword)
  const readable = topic || 'this finance topic'
  return trimToWord(
    `Learn ${readable}: what to check, common mistakes, key risks, and practical next steps before making a money decision.`,
    155
  )
}
