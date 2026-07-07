import type { WorkflowCheck, WorkflowEvaluation, WorkflowStatus } from '@/types'

export const AUTOMATION_QUALITY_THRESHOLD = 95

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  'draft',
  'improving',
  'review_required',
  'ready_for_review',
  'approved',
  'scheduled',
  'published',
  'rejected',
]

const CONTENT_RULES: Array<{
  name: string
  pattern: RegExp
  details: string
  severity: 'info' | 'warn' | 'error'
  shouldMatch: boolean
}> = [
  {
    name: 'Disclaimer included when needed',
    pattern: /not financial advice|general information|educational purposes/i,
    details: 'Sensitive finance topics should include a general-information disclaimer.',
    severity: 'info',
    shouldMatch: true,
  },
  {
    name: 'Avoids guaranteed-return language',
    pattern: /guaranteed return|risk-free return|surefire investment|double your money/i,
    details: 'Contains prohibited guaranteed-return language.',
    severity: 'error',
    shouldMatch: false,
  },
  {
    name: 'Avoids prescriptive investment claims',
    pattern: /this is the best investment|everyone should invest in|you should buy this stock/i,
    details: 'Contains overly prescriptive investment language.',
    severity: 'error',
    shouldMatch: false,
  },
  {
    name: 'Avoids advisory phrasing',
    pattern: /tax advice|legal advice|personalized advice/i,
    details: 'Mentions advisory phrasing that should be reviewed carefully.',
    severity: 'warn',
    shouldMatch: false,
  },
]

function stripHtml(html: any = '') {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildCheck(
  name: string,
  passed: boolean,
  details: string,
  severity: 'info' | 'warn' | 'error' = 'info'
): WorkflowCheck {
  return { name, passed, details, severity }
}

function sentenceLengths(text: string) {
  return text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim().split(/\s+/).filter(Boolean).length)
    .filter((len) => len > 0)
}

function hasSentenceVariety(lengths: number[]) {
  if (lengths.length < 4) return false
  const min = Math.min(...lengths)
  const max = Math.max(...lengths)
  return min <= 10 && max >= 18
}

export function evaluateFinanceArticle(input: {
  title: string
  excerpt: string
  body: string
  primaryKeyword?: string | null
  category?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  coverUrl?: string | null
}): WorkflowEvaluation {
  const plainText = stripHtml(input.body)
  const lower = plainText.toLowerCase()
  const checks: WorkflowCheck[] = []
  const disclaimerNeeded = ['Taxes', 'Investing', 'Retirement', 'Real Estate'].includes(
    input.category ?? ''
  )
  const words = plainText.split(/\s+/).filter(Boolean)
  const h2Count = (input.body.match(/<h2\b/gi) || []).length
  const faqMatch = /<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(input.body)
  const internalLinks = (input.body.match(/href="\/blog(?:\/|\?|"|#)/gi) || []).length
  const hasConclusion = /what you can do next|next steps|in summary|the bottom line|final thoughts/i.test(
    plainText
  )
  const hasExamples = /for example|for instance|let'?s say|imagine that|suppose you/i.test(plainText)
  const hasTakeaways = /<h2[^>]*>\s*key takeaways\s*<\/h2>/i.test(input.body) && /<ul>[\s\S]*?<\/ul>/i.test(input.body)
  const lengths = sentenceLengths(plainText)
  const variedSentenceRhythm = hasSentenceVariety(lengths)
  const readerAwareLanguage = /\byou\b|\byour\b/i.test(plainText)
  const roboticPhrasing = /when it comes to|in today's world|navigating the|delve into|it is important to note that|in conclusion,? this article/i.test(plainText)

  checks.push(
    buildCheck(
      'Title exists',
      input.title.trim().length > 0,
      'Every article needs a clear title.',
      'error'
    )
  )

  checks.push(
    buildCheck(
      'Title length looks healthy',
      input.title.trim().length >= 35 && input.title.trim().length <= 70,
      'Aim for 35 to 70 characters.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Excerpt exists',
      input.excerpt.trim().length > 0,
      'A concise excerpt helps with previews and trust.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Meta title length looks healthy',
      (input.seoTitle ?? input.title).trim().length >= 40 && (input.seoTitle ?? input.title).trim().length <= 65,
      'Aim for 40 to 65 characters.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Meta description length looks healthy',
      (input.seoDescription ?? input.excerpt).trim().length >= 120 &&
        (input.seoDescription ?? input.excerpt).trim().length <= 160,
      'Aim for 120 to 160 characters.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Content is substantial',
      words.length >= 900,
      'Aim for at least 900 words.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Has clear H2 structure',
      h2Count >= 4,
      'Use at least 4 H2 sections to create depth.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Has Key Takeaways section',
      hasTakeaways,
      'Include a Key Takeaways section near the top.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Has FAQ section',
      faqMatch,
      'Add a short FAQ section.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Has internal links',
      internalLinks >= 1,
      'Add 1 to 3 internal links.',
      'warn'
    )
  )


  checks.push(
    buildCheck(
      'Includes examples or scenarios',
      hasExamples,
      'Use one concrete example or scenario so the piece feels editorial, not generic.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Uses reader-aware language',
      readerAwareLanguage,
      'Speak to the reader directly at least once so the article feels guided, not generic.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Uses varied sentence rhythm',
      variedSentenceRhythm,
      'Mix shorter and longer sentences so the article reads more naturally.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Avoids robotic filler phrasing',
      !roboticPhrasing,
      'Trim template-like transitions and generic filler language.',
      'warn'
    )
  )

  checks.push(
    buildCheck(
      'Ends with conclusion or next steps',
      hasConclusion,
      'Close with a practical conclusion or next steps section.',
      'warn'
    )
  )

  if (input.primaryKeyword) {
    const keyword = input.primaryKeyword.toLowerCase()
    checks.push(
      buildCheck(
        'Keyword appears naturally',
        input.title.toLowerCase().includes(keyword) || lower.slice(0, 600).includes(keyword),
        'Primary keyword should appear in the title or opening section.',
        'warn'
      )
    )
  }

  for (const rule of CONTENT_RULES) {
    if (rule.name === 'Disclaimer included when needed' && !disclaimerNeeded) continue
    const textForRule = rule.name === 'Avoids advisory phrasing'
      ? plainText
          .replace(/not personal financial, investment, tax, or legal advice/gi, ' ')
          .replace(/not (financial|investment|tax|legal) advice/gi, ' ')
          .replace(/general (financial|investment|tax|legal) education/gi, ' ')
      : plainText
    const matched = rule.pattern.test(textForRule)
    checks.push(buildCheck(rule.name, rule.shouldMatch ? matched : !matched, rule.details, rule.severity))
  }

  const errorCount = checks.filter((check) => check.severity === 'error' && !check.passed).length
  const warnCount = checks.filter((check) => check.severity === 'warn' && !check.passed).length
  const score = Math.max(0, 100 - errorCount * 25 - warnCount * 5)
  const risk_level: 'low' | 'medium' | 'high' = errorCount > 0 ? 'high' : warnCount >= 5 ? 'medium' : 'low'

  return {
    score,
    passed: errorCount === 0 && warnCount < 6,
    risk_level,
    checks,
  }
}

export function nextStatusFromEvaluation(
  evaluation: WorkflowEvaluation,
  threshold = AUTOMATION_QUALITY_THRESHOLD
): WorkflowStatus {
  if (!evaluation.passed || evaluation.risk_level !== 'low' || evaluation.score < threshold) {
    return 'review_required'
  }

  return 'ready_for_review'
}

export function isReadyForHumanReview(
  evaluation: WorkflowEvaluation,
  threshold = AUTOMATION_QUALITY_THRESHOLD
) {
  return evaluation.passed && evaluation.risk_level === 'low' && evaluation.score >= threshold
}
