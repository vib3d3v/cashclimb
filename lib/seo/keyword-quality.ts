import slugify from 'slugify'

const GEO_NOISE_PATTERNS = [
  /\(?\s*us\s*\/\s*uk\s*\/\s*ca\s*\/\s*au\s*\)?/gi,
  /\b(?:us\s+uk\s+ca\s+au|u\s*s\s*u\s*k\s*c\s*a\s*a\s*u|usukcaau)\b/gi,
  /\b(?:us[-_]?uk[-_]?ca[-_]?au)\b/gi,
]

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','by','for','from','how','in','into','is','it','of','on','or','the','to','vs','what','when','why','with','without','your','you','guide','explained','beginner','beginners','checklist','step','steps','simple','best','top','cashclimb','learn','using','use','works','work'
])

const DANGEROUS_ENDINGS = /\b(?:a|an|and|as|at|by|for|from|in|into|of|on|or|the|to|vs|with|without|using|before|after|step[-\s]?by[-\s]?step|guide|checklist)$/i
const BRANDING_PATTERN = /\s*[|:][-\s]*(?:cash\s*climb|cashclimb)\s*$/i
const ACRONYMS = new Set(['ira', '401k', 'etf', 'etfs', 'heloc', 'apr', 'apy', 'irs', 'hsa', 'cd', 'ach', 'fdic', 'sec', 'cfpb'])
const LOWERCASE_TITLE_WORDS = new Set(['a','an','and','as','at','by','for','from','in','of','on','or','the','to','vs','with','without'])

function resetPatterns() {
  for (const pattern of GEO_NOISE_PATTERNS) pattern.lastIndex = 0
}

export function cleanSeoText(value: any) {
  let text = String(value || '')
  for (const pattern of GEO_NOISE_PATTERNS) text = text.replace(pattern, ' ')

  return text
    .replace(BRANDING_PATTERN, '')
    .replace(/\bCash\s*Climb\b/gi, '')
    .replace(/\bCashClimb\b/gi, '')
    .replace(/\b(?:US|UK|CA|AU)\s*only\b/gi, '')
    .replace(/\bstep[-\s]?by[-\s]?step\s+for\b/gi, 'for')
    .replace(/\bexplained\s+a\s+beginners?\s+guide\s+for\b/gi, 'guide for')
    .replace(/\bhow\s+to\s+set\s+up\s+bill\s+pay\s+to\s+avoid\s+overdrafts?\s+for\s+low[-\s]?balance\s+accounts\b/gi, 'how to set up bill pay without overdraft fees')
    .replace(/\bset\s+up\s+bill\s+pay\s+to\s+avoid\s+overdrafts?\s+for\s+low[-\s]?balance\s+accounts\b/gi, 'set up bill pay without overdraft fees')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/[-–—:|]\s*$/g, '')
    .replace(/^[-–—:|]\s*/g, '')
    .trim()
}

export function hasGeoMarketNoise(value: any) {
  resetPatterns()
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
    .replace(/(?:^|-)cashclimb(?:-|$)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function canonicalPrimaryKeyword(value: any) {
  return cleanSeoText(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\bstep[-\s]?by[-\s]?step\s+for\b/gi, 'for')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeTargetKeyword(value: any) {
  const clean = canonicalPrimaryKeyword(value)
  if (/bill pay|automatic payment|automatic bill/.test(clean) && /overdraft/.test(clean)) return 'set up bill pay without overdraft fees'
  if (/tax[-\s]?loss harvesting/.test(clean) && /(taxable account|brokerage account|investment account)/.test(clean)) return 'tax-loss harvesting for taxable accounts'
  if (/co[-\s]?ownership agreement/.test(clean) && /home/.test(clean) && /friend/.test(clean)) return 'co-ownership agreement checklist for buying a home with friends'
  if (/currency conversion fee/.test(clean) && /(international etf|international stock|international investment|foreign investment)/.test(clean)) return 'avoid currency conversion fees on international investments'
  if (/unauthorized hard inquiry/.test(clean) && /credit report/.test(clean)) return 'dispute unauthorized hard inquiry on credit report'
  if (/international stock/.test(clean) && /currency risk/.test(clean)) return 'buying international stocks with currency risk'
  if (/freeze/.test(clean) && /credit/.test(clean)) return 'freeze credit report'
  if (/credit utilization/.test(clean)) return 'credit utilization'
  if (/high[-\s]?yield savings/.test(clean)) return 'high-yield savings account'
  return clean
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
  if (coverage >= 0.55) return true
  const cleanText = canonicalPrimaryKeyword(text)
  const cleanKeyword = canonicalPrimaryKeyword(keyword)
  return Boolean(cleanKeyword && cleanText.includes(cleanKeyword))
}

export function keywordLooksSeoWorthy(value: any) {
  const clean = normalizeTargetKeyword(value)
  const terms = significantKeywordTerms(clean)
  if (hasGeoMarketNoise(value)) return false
  if (clean.length < 10 || clean.length > 95) return false
  if (terms.length < 2) return false
  if (/\b(casino|forex|crypto|payday|loan shark|guaranteed|risk free|free money|reddit)\b/i.test(clean)) return false
  if (/^(guide|article|post|tips)\b/.test(clean)) return false
  return true
}

export function cleanKeywordList(value: any) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '').split(/[,|;]/).map((item) => item.trim())

  return Array.from(new Set(raw
    .map(normalizeTargetKeyword)
    .filter((item) => item && keywordLooksSeoWorthy(item))))
    .slice(0, 10)
}

export function titleCaseKeyword(value: any) {
  return canonicalPrimaryKeyword(value)
    .split(' ')
    .filter(Boolean)
    .map((word, index, words) => {
      const lower = word.toLowerCase()
      if (ACRONYMS.has(lower)) return lower.toUpperCase()
      if (index > 0 && index < words.length - 1 && LOWERCASE_TITLE_WORDS.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
    .replace(/\bVs\b/g, 'vs')
    .replace(/\bEtfs\b/g, 'ETFs')
    .replace(/\bIra\b/g, 'IRA')
}

function removeDanglingEnding(value: string) {
  let out = cleanSeoText(value)
  while (DANGEROUS_ENDINGS.test(out)) out = out.replace(/\s+\S+$/g, '').trim()
  return out
}

function firstValid(candidates: string[], min = 35, max = 72) {
  for (const candidate of candidates) {
    const clean = removeDanglingEnding(candidate)
    if (!clean || hasGeoMarketNoise(clean) || BRANDING_PATTERN.test(clean)) continue
    if (clean.length >= min && clean.length <= max && !DANGEROUS_ENDINGS.test(clean)) return clean
  }
  for (const candidate of candidates) {
    const clean = removeDanglingEnding(candidate)
    if (clean && !hasGeoMarketNoise(clean) && !BRANDING_PATTERN.test(clean) && !DANGEROUS_ENDINGS.test(clean)) return clean
  }
  return removeDanglingEnding(candidates[0] || 'Personal Finance Guide')
}

function specialTitle(keyword: string) {
  const clean = normalizeTargetKeyword(keyword)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) return 'How to Set Up Bill Pay Without Overdraft Fees'
  if (/tax[-\s]?loss harvesting/.test(clean) && /taxable account/.test(clean)) return 'Tax-Loss Harvesting Guide for Taxable Accounts'
  if (/co[-\s]?ownership agreement/.test(clean) && /home/.test(clean) && /friend/.test(clean)) return 'Co-Ownership Agreement Checklist for Buying a Home With Friends'
  if (/currency conversion fee/.test(clean) && /(international investment|international etf|international stock)/.test(clean)) return 'How to Avoid Currency Conversion Fees on International Investments'
  if (/unauthorized hard inquiry/.test(clean) && /credit report/.test(clean)) return 'How to Dispute an Unauthorized Hard Inquiry on Your Credit Report'
  if (/international stock/.test(clean) && /currency risk/.test(clean)) return 'Beginner Checklist for Buying International Stocks With Currency Risk'
  if (/freeze/.test(clean) && /credit/.test(clean)) return 'How to Freeze Your Credit Report Safely'
  if (/credit utilization/.test(clean)) return 'Credit Utilization Explained for Beginners'
  if (/high[-\s]?yield savings/.test(clean)) return 'High-Yield Savings Account Checklist for Beginners'
  return null
}

function compactKeyword(keyword: string) {
  return normalizeTargetKeyword(keyword)
    .replace(/\b2026 guide\b/gi, '')
    .replace(/\bbeginner'?s? guide\b/gi, '')
    .replace(/\bbeginner checklist\b/gi, 'checklist')
    .replace(/\bstep[-\s]?by[-\s]?step\b/gi, '')
    .replace(/\bexplained\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSeoArticleTitle(keyword: any, intent?: string | null) {
  const clean = compactKeyword(keyword)
  const special = specialTitle(clean)
  if (special) return special

  const base = titleCaseKeyword(clean)
  const lowerIntent = String(intent || '').toLowerCase()
  const candidates: string[] = []

  if (/^how to\b/.test(clean) || lowerIntent === 'how-to') candidates.push(base)
  if (/\b(vs|versus|compare|comparison)\b/.test(clean) || lowerIntent === 'comparison') candidates.push(`${base}: What to Compare`)
  if (/\bmistake|avoid|red flag|warning\b/.test(clean) || lowerIntent === 'mistakes') candidates.push(base.includes('Mistakes') ? base : `${base}: Mistakes to Avoid`)
  if (/\bchecklist\b/.test(clean) || lowerIntent === 'checklist') candidates.push(base.includes('Checklist') ? base : `${base} Checklist`)

  candidates.push(base, `${base}: Practical Guide`, `${base}: What to Know`, `${base}: Beginner Guide`)
  return firstValid(candidates, 35, 72)
}

export function buildSeoMetaTitle(keyword: any, intent?: string | null) {
  const candidates = [
    specialTitle(keyword) || '',
    buildSeoArticleTitle(keyword, intent),
    `${titleCaseKeyword(compactKeyword(keyword))} Guide`,
    `${titleCaseKeyword(compactKeyword(keyword))} Checklist`,
  ].filter(Boolean)
  return firstValid(candidates, 35, 65)
}

function sentence(value: string) {
  const clean = removeDanglingEnding(value).replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return /[.!?]$/.test(clean) ? clean : `${clean}.`
}

function phraseForCopy(value: any) {
  const clean = normalizeTargetKeyword(value)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) return 'automatic bill pay without overdraft fees'
  if (/tax[-\s]?loss harvesting/.test(clean)) return 'tax-loss harvesting in taxable accounts'
  if (/co[-\s]?ownership agreement/.test(clean)) return 'a co-ownership agreement before buying a home with friends'
  if (/currency conversion fee/.test(clean)) return 'currency conversion fees on international investments'
  if (/hard inquiry/.test(clean)) return 'unauthorized hard inquiries on credit reports'
  return clean || 'this finance topic'
}

export function buildSeoDescription(keyword: any, category?: string | null) {
  const readable = phraseForCopy(keyword)
  const candidates = [
    `Learn how ${readable} works, what to check first, which mistakes to avoid, and when to pause before making a money decision.`,
    `Use this ${category || 'finance'} guide to compare ${readable}, understand the risks, and make a clearer decision before you act.`,
    `A practical guide to ${readable}, with key checks, common mistakes, real examples, and safer next steps.`,
  ]

  for (const candidate of candidates) {
    const clean = sentence(cleanSeoText(candidate))
    if (clean.length >= 120 && clean.length <= 160) return clean
  }
  return 'Learn the key checks, risks, common mistakes, and safer next steps before making this financial decision.'
}

export function buildExcerpt(keyword: any, category?: string | null) {
  const readable = phraseForCopy(keyword)
  const candidates = [
    `A practical guide to ${readable}, including what to check, common mistakes, examples, and safer next steps.`,
    `Learn how ${readable} works, what to compare, and which mistakes to avoid before making a money decision.`,
    `A clear ${category || 'finance'} guide to ${readable}, with examples, risks, and next steps.`,
  ]

  for (const candidate of candidates) {
    const clean = sentence(cleanSeoText(candidate))
    if (clean.length >= 90 && clean.length <= 155) return clean
  }
  return sentence(cleanSeoText(candidates[candidates.length - 1]))
}

export function normalizeGeneratedPostFields(input: {
  title?: any
  slug?: any
  excerpt?: any
  primaryKeyword?: any
  relatedKeywords?: any
  seoTitle?: any
  seoDescription?: any
  body?: any
  category?: string | null
  intent?: string | null
}) {
  const primaryKeyword = normalizeTargetKeyword(input.primaryKeyword || input.title || '')
  const title = buildSeoArticleTitle(input.title || primaryKeyword, input.intent)
  const seoTitle = buildSeoMetaTitle(input.seoTitle || title || primaryKeyword, input.intent)
  const excerpt = buildExcerpt(primaryKeyword, input.category)
  const seoDescription = buildSeoDescription(primaryKeyword, input.category)
  const slug = cleanSlugText(title)
  const relatedKeywords = cleanKeywordList(input.relatedKeywords || primaryKeyword)
  const body = cleanSeoText(input.body || '')

  return { title, slug, excerpt, primaryKeyword, relatedKeywords, seoTitle, seoDescription, body }
}
