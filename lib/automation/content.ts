import slugify from 'slugify'
import readingTime from 'reading-time'
import type { Category } from '@/types'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'
import { resolvePostAuthorName } from '@/lib/authors'

function safeString(value: any = '') {
  return String(value || '')
}

export const CASHCLIMB_CATEGORIES: Category[] = [
  'Personal Finance',
  'Credit',
  'Investing',
  'Retirement',
  'Taxes',
  'Real Estate',
]

type KeywordIdea = {
  keyword: string
  category: Category
  intent: string
  priority: number
  brief: Record<string, unknown>
}

type DraftInput = {
  keyword: string
  category: Category
  intent?: string | null
  brief?: Record<string, any> | null
}

const SEEDS: Record<Category, string[]> = {
  'Personal Finance': [
    'how to save money fast without cutting everything',
    'monthly budget checklist for beginners',
    'emergency fund mistakes to avoid',
    'how to stop living paycheck to paycheck',
    'best sinking fund categories for families',
    'simple money habits that build savings',
  ],
  Credit: [
    'how to improve credit score safely',
    'credit utilization explained for beginners',
    'debt payoff mistakes that hurt credit',
    'how balance transfers work',
    'secured credit card guide for beginners',
    'credit report errors checklist',
  ],
  Investing: [
    'index funds for beginners',
    'etf investing mistakes beginners make',
    'dollar cost averaging explained',
    'how to start investing with little money',
    'investment risk tolerance guide',
    'brokerage account checklist for beginners',
  ],
  Retirement: [
    'retirement savings by age guide',
    'ira vs 401k for beginners',
    'how employer matching works',
    'retirement planning mistakes in your 30s',
    'compound interest retirement example',
    'catch up contributions explained',
  ],
  Taxes: [
    'tax documents checklist for freelancers',
    'common tax deductions beginners miss',
    'quarterly taxes explained simply',
    'how to organize receipts for taxes',
    'tax refund mistakes to avoid',
    'side hustle taxes checklist',
  ],
  'Real Estate': [
    'first time homebuyer budget checklist',
    'mortgage affordability mistakes',
    'rent vs buy checklist',
    'closing costs explained for beginners',
    'house down payment savings plan',
    'hidden costs of homeownership',
  ],
}

const MODIFIERS = [
  '2026 guide',
  'beginner checklist',
  'mistakes to avoid',
  'simple framework',
  'step by step',
]

const CITATION_SOURCES: Record<Category, string[]> = {
  'Personal Finance': ['Consumer Financial Protection Bureau', 'Federal Reserve', 'Bureau of Labor Statistics'],
  Credit: ['Consumer Financial Protection Bureau', 'Federal Trade Commission', 'FICO education resources'],
  Investing: ['SEC Investor.gov', 'FINRA', 'Federal Reserve'],
  Retirement: ['IRS retirement resources', 'Social Security Administration', 'SEC Investor.gov'],
  Taxes: ['IRS', 'Treasury Department', 'Small Business Administration'],
  'Real Estate': ['Consumer Financial Protection Bureau', 'Federal Housing Finance Agency', 'U.S. Census Bureau'],
}

function cleanKeyword(value: any) {
  return safeString(value).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ').trim()
}

export function generateKeywordIdeas(input?: {
  focus?: Category | 'Mixed' | string | null
  howMany?: number | string | null
  audience?: string | null
  intentMix?: string | null
  market?: string | null
  riskTolerance?: string | null
}): KeywordIdea[] {
  const requested = Math.min(50, Math.max(1, Number(input?.howMany ?? 20) || 20))
  const focus = input?.focus && input.focus !== 'Mixed' && CASHCLIMB_CATEGORIES.includes(input.focus as Category)
    ? [input.focus as Category]
    : CASHCLIMB_CATEGORIES

  const ideas: KeywordIdea[] = []
  for (const category of focus) {
    for (const seed of SEEDS[category]) {
      ideas.push(buildKeywordIdea(seed, category, input))
      for (const modifier of MODIFIERS) {
        ideas.push(buildKeywordIdea(`${seed} ${modifier}`, category, input))
      }
    }
  }

  return ideas
    .filter((idea, index, all) => all.findIndex((other) => other.keyword === idea.keyword && other.category === idea.category) === index)
    .sort((a, b) => a.priority - b.priority || a.keyword.localeCompare(b.keyword))
    .slice(0, requested)
}

function buildKeywordIdea(keyword: string, category: Category, input?: any): KeywordIdea {
  const clean = cleanKeyword(keyword)
  const intent = inferIntent(clean, input?.intentMix)
  const scoreBoost = /checklist|mistakes|beginner|step by step|explained|guide/.test(clean) ? 0 : 12
  return {
    keyword: clean,
    category,
    intent,
    priority: 20 + scoreBoost + Math.min(40, clean.length),
    brief: buildBrief(clean, category, intent, input),
  }
}

function inferIntent(keyword: string, requested?: string | null) {
  const request = (requested || '').toLowerCase()
  if (request && request !== 'mixed') return request
  if (/vs|compare|comparison/.test(keyword)) return 'comparison'
  if (/mistake|avoid/.test(keyword)) return 'mistakes'
  if (/checklist/.test(keyword)) return 'checklist'
  if (/how to|step by step/.test(keyword)) return 'how-to'
  return 'informational'
}

export function buildBrief(keyword: string, category: Category, intent = 'informational', input?: any) {
  return {
    keyword,
    category,
    intent,
    audience: input?.audience || 'Beginners',
    market: input?.market || 'US-focused with general Western audience framing',
    riskTolerance: input?.riskTolerance || 'Low',
    requiredSections: [
      'Key Takeaways',
      `What ${keyword} means`,
      'Step-by-step framework',
      'Common mistakes',
      'Example',
      'Tools and accounts that can help',
      'FAQ',
      'What you can do next',
    ],
    citationTargets: CITATION_SOURCES[category],
    internalLinkPlan: ['Add 1 to 3 related CashClimb guides once matching posts exist.'],
    safetyRules: [
      'Use educational language only.',
      'Do not promise outcomes or guaranteed returns.',
      'Avoid personalized financial, tax, investment, or legal advice.',
    ],
  }
}

function sentenceCase(keyword: any) {
  const clean = safeString(keyword)
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function titleCase(keyword: any) {
  return safeString(keyword).split(' ').filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}


function buildTitle(keyword: string, intent?: string | null) {
  const topic = titleCase(keyword).replace(/:\s*$/, '').trim()
  const normalizedIntent = (intent || '').toLowerCase()

  if (/checklist/.test(keyword) || normalizedIntent === 'checklist') return `${topic}: Step-by-Step Checklist`
  if (/mistake|avoid/.test(keyword) || normalizedIntent === 'mistakes') return `${topic}: Mistakes to Avoid`
  if (/vs|compare|comparison/.test(keyword) || normalizedIntent === 'comparison') return `${topic}: Which Option Makes More Sense?`
  if (/how to/.test(keyword) || normalizedIntent === 'how-to') return `${topic}: Step-by-Step Guide`
  return `${topic}: Clear Guide for Beginners`
}

function buildSeoTitle(keyword: string, intent?: string | null) {
  const title = buildTitle(keyword, intent)
  return title.replace(/:\s*Which Option Makes More Sense\?$/, ': Comparison Guide')
}

function trim(text: any, max: number) {
  const clean = safeString(text).replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd() + '…'
}

function paragraph(text: any) {
  return `<p>${safeString(text)}</p>`
}

function list(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

export function buildArticleDraft(input: DraftInput) {
  const keyword = cleanKeyword(input.keyword)
  const category = input.category
  const title = trim(buildTitle(keyword, input.intent), 70)
  const seoTitle = trim(buildSeoTitle(keyword, input.intent), 65)
  const excerpt = trim(`Learn ${keyword} with a clear checklist, practical examples, common mistakes, and safe next steps for everyday money decisions.`, 155)
  const seoDescription = trim(`A practical guide to ${keyword}, including key takeaways, examples, common mistakes, tools, FAQs, and responsible next steps.`, 155)
  const author = resolvePostAuthorName({ title, category })
  const citations = CITATION_SOURCES[category]
  const needsDisclaimer = ['Taxes', 'Investing', 'Retirement', 'Real Estate'].includes(category)
  const disclaimer = needsDisclaimer
    ? paragraph('<em>This article is for general educational purposes and is not personal financial, investment, tax, or legal advice.</em>')
    : ''

  const html = [
    disclaimer,
    paragraph(`This guide explains ${keyword} in plain language so you can make a more informed decision without getting lost in jargon. The goal is not to push one perfect answer. The goal is to help you understand the tradeoffs, compare your options, and choose a practical next step.`),
    '<h2>Key Takeaways</h2>',
    list([
      `${sentenceCase(keyword)} works best when you compare costs, timing, risk, and your current cash flow together.`,
      'The safest approach is usually a simple checklist, not a rushed decision based on one headline number.',
      `Before acting on ${keyword}, review reliable sources and consider speaking with a qualified professional for personal situations.`,
    ]),
    `<h2>What ${keyword} means</h2>`,
    paragraph(`${sentenceCase(keyword)} is a decision area where small details can change the outcome. Fees, interest rates, account rules, tax treatment, deadlines, and timing can all matter. A strong article or plan should explain these details clearly instead of making broad promises.`),
    paragraph(`For CashClimb readers, the useful question is simple: what action can improve your position without creating unnecessary risk? That framing keeps the advice practical, especially for beginners.`),
    '<h2>A simple framework to use</h2>',
    list([
      'Define the goal: saving money, reducing risk, improving cash flow, building credit, or planning ahead.',
      'Gather your numbers: income, expenses, debt balances, rates, deadlines, account limits, and fees.',
      'Compare the tradeoffs: speed, safety, flexibility, taxes, and long-term impact.',
      'Choose one next step that can be completed this week.',
      'Review the outcome and adjust before making bigger moves.',
    ]),
    paragraph(`For example, if two choices look similar, the better option may depend on a fee, a deadline, or how easily you can reverse the decision later. That is why a checklist often beats a quick guess.`),
    '<h2>Common mistakes to avoid</h2>',
    list([
      'Making a decision before knowing the full cost.',
      'Focusing only on monthly payments while ignoring total cost.',
      'Following generic advice that does not match your timeline or risk tolerance.',
      'Ignoring taxes, fees, or account rules.',
      'Assuming an outcome is guaranteed.',
    ]),
    '<h2>Data and sources to verify</h2>',
    paragraph(`Before publishing or updating this guide, verify current rules and statistics using sources such as ${citations.join(', ')}. This gives the article stronger trust signals and helps avoid stale or unsupported claims.`),
    '<h2>Tools and accounts that can help</h2>',
    paragraph('The right tool will not solve the whole problem for you, but it can make the next step easier. Compare costs, safety, features, and account rules before you commit.'),
    list(toolIdeas(category)),
    paragraph('<em>Editorial note: this section is educational and is meant to help you compare categories of tools or accounts, not to push a specific provider.</em>'),
    '<h2>FAQ</h2>',
    `<h3>Is ${keyword} the same for everyone?</h3>`,
    paragraph('No. The right choice depends on your income, timeline, location, risk tolerance, account rules, and current obligations.'),
    `<h3>What should I check first with ${keyword}?</h3>`,
    paragraph('Start with the cost, timing, risk, and whether the decision affects taxes, credit, or long-term flexibility.'),
    '<h3>When should I get professional help?</h3>',
    paragraph('Consider professional help when a decision involves taxes, investments, legal documents, large debt balances, home purchases, retirement accounts, or business income.'),
    '<h2>What you can do next</h2>',
    paragraph(`Write down one decision related to ${keyword}, gather the numbers, and compare the tradeoffs before taking action. A small, well-informed step is better than a rushed move that creates new problems.`),
  ].filter(Boolean).join('\n')

  const readTime = readingTime(html.replace(/<[^>]*>/g, ' ')).text
  const evaluation = evaluateFinanceArticle({
    title,
    excerpt,
    body: html,
    primaryKeyword: keyword,
    category,
    seoTitle,
    seoDescription,
    coverUrl: null,
  })

  return {
    title,
    slug: slugify(keyword, { lower: true, strict: true }),
    excerpt,
    body: html,
    category,
    author,
    read_time: readTime,
    primary_keyword: keyword,
    related_keywords: relatedKeywords(keyword, category),
    seo_title: seoTitle,
    seo_description: seoDescription,
    status: evaluation.passed ? 'approved' : 'review_required',
    published: false,
    quality_score: evaluation.score,
    risk_level: evaluation.risk_level,
    review_notes: evaluation.checks.filter((check) => !check.passed).map((check) => `${check.name}: ${check.details}`).join('\n'),
    workflow_meta: {
      automation: true,
      brief: input.brief || buildBrief(keyword, category, input.intent || 'informational'),
      generatedAt: new Date().toISOString(),
    },
    evaluation,
  }
}

function toolIdeas(category: Category) {
  const common = ['A simple spreadsheet or tracker for the numbers.', 'A reminder system for dates, bills, or review points.']
  const byCategory: Record<Category, string[]> = {
    'Personal Finance': ['A budget worksheet.', 'A high-yield savings comparison checklist.'],
    Credit: ['A credit report review checklist.', 'A debt payoff calculator.'],
    Investing: ['A fee comparison checklist.', 'An allocation review worksheet.'],
    Retirement: ['A contribution tracker.', 'A retirement projection calculator.'],
    Taxes: ['A receipt folder system.', 'A quarterly tax calendar.'],
    'Real Estate': ['A mortgage affordability calculator.', 'A closing-cost worksheet.'],
  }
  return [...byCategory[category], ...common]
}

function relatedKeywords(keyword: any, category: Category) {
  const words = safeString(keyword).split(' ').filter((word) => word.length > 3).slice(0, 4)
  return Array.from(new Set([
    ...words,
    category.toLowerCase(),
    'checklist',
    'beginner guide',
    'common mistakes',
  ]))
}
