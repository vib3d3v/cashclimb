import slugify from 'slugify'
import readingTime from 'reading-time'
import type { Category } from '@/types'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import {
  buildSeoArticleTitle,
  buildSeoDescription,
  buildSeoMetaTitle,
  canonicalPrimaryKeyword,
  significantKeywordTerms,
  titleCaseKeyword,
} from '@/lib/seo/keyword-quality'
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

const MODIFIERS = ['2026 guide', 'beginner checklist', 'mistakes to avoid', 'step by step']

const OFFICIAL_LINKS: Record<Category, { title: string; href: string }[]> = {
  'Personal Finance': [{ title: 'CFPB consumer tools', href: 'https://www.consumerfinance.gov/consumer-tools/' }],
  Credit: [{ title: 'CFPB credit card resources', href: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/' }],
  Investing: [{ title: 'SEC Investor.gov', href: 'https://www.investor.gov/' }],
  Retirement: [{ title: 'IRS retirement plans', href: 'https://www.irs.gov/retirement-plans' }],
  Taxes: [{ title: 'IRS individuals', href: 'https://www.irs.gov/individuals' }],
  'Real Estate': [{ title: 'CFPB home buying guide', href: 'https://www.consumerfinance.gov/owning-a-home/' }],
}

function cleanKeyword(value: any) {
  return canonicalPrimaryKeyword(value)
}

function sentenceCase(value: any) {
  const clean = safeString(value)
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function titleCase(value: any) {
  return titleCaseKeyword(value)
}

function naturalTopic(keyword: string) {
  return keyword
    .replace(/^how to\s+/i, '')
    .replace(/\b2026 guide\b/gi, '')
    .replace(/\bbeginner checklist\b/gi, '')
    .replace(/\bstep by step\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
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
      for (const modifier of MODIFIERS) ideas.push(buildKeywordIdea(`${seed} ${modifier}`, category, input))
    }
  }

  return ideas
    .filter((idea, index, all) => all.findIndex((other) => other.keyword === idea.keyword && other.category === idea.category) === index)
    .sort((a, b) => a.priority - b.priority || a.keyword.localeCompare(b.keyword))
    .slice(0, requested)
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

export function buildBrief(keyword: string, category: Category, intent = 'informational', input?: any) {
  return {
    keyword,
    category,
    intent,
    audience: input?.audience || 'Beginners',
    market: input?.market || 'US-focused with general Western audience framing',
    riskTolerance: input?.riskTolerance || 'Low',
    requiredSections: ['Quick Answer', 'Key Takeaways', 'Decision Checklist', 'Risk and Tradeoffs', 'Real Examples', 'Common Mistakes to Avoid', 'What You Can Do Next', 'FAQ', 'Sources'],
    citationTargets: OFFICIAL_LINKS[category].map((source) => source.title),
    internalLinkPlan: ['Add only contextual CashClimb links that directly help the reader.'],
    safetyRules: [
      'Stay on the exact finance topic.',
      'Do not add generic decision-making filler.',
      'Do not repeat the full title phrase in every section.',
      'Do not promise outcomes or guaranteed returns.',
      'Avoid personalized financial, tax, investment, or legal advice.',
    ],
  }
}

function buildTitle(keyword: string, intent?: string | null) {
  return buildSeoArticleTitle(keyword, intent)
}

function buildSeoTitle(keyword: string, intent?: string | null) {
  return buildSeoMetaTitle(keyword, intent)
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

function officialSource(category: Category) {
  const source = OFFICIAL_LINKS[category][0]
  return `<p>For current rules or consumer guidance, verify details with <a href="${source.href}" target="_blank" rel="noopener noreferrer">${source.title}</a>.</p>`
}

type CategoryFrame = { focus: string; check: string; risk: string }

function categoryFrame(category: Category): CategoryFrame {
  const map: Record<Category, CategoryFrame> = {
    'Personal Finance': { focus: 'cash flow, bills, savings, and habits', check: 'monthly income, fixed costs, due dates, and emergency savings', risk: 'creating a plan that is too strict to keep' },
    Credit: { focus: 'fees, interest, utilization, payment timing, and credit report accuracy', check: 'APR, balances, due dates, limits, fees, and credit report details', risk: 'paying more interest or damaging your score by moving too quickly' },
    Investing: { focus: 'fees, diversification, time horizon, account type, and risk tolerance', check: 'fees, fund type, contribution amount, time horizon, and liquidity needs', risk: 'taking risk you cannot hold through a downturn' },
    Retirement: { focus: 'contribution rates, account rules, tax treatment, fees, and time horizon', check: 'account limits, match rules, fees, tax treatment, and withdrawal rules', risk: 'missing rules that affect taxes, access, or long-term flexibility' },
    Taxes: { focus: 'records, deadlines, withholding, deductions, and filing rules', check: 'forms, receipts, dates, income sources, and current IRS rules', risk: 'using stale rules or missing documentation' },
    'Real Estate': { focus: 'monthly payment, taxes, insurance, repairs, cash reserves, and closing costs', check: 'loan terms, taxes, insurance, HOA fees, repairs, and cash left after closing', risk: 'treating approval amount as the real budget' },
  }
  return map[category]
}

function faqFor(category: Category): Array<[string, string]> {
  const map: Record<Category, Array<[string, string]>> = {
    'Personal Finance': [['What should I check first?', 'Start with income, fixed bills, due dates, and the cash cushion you need before changing anything.'], ['How do I avoid overcorrecting?', 'Make the first change small enough to keep for a full month before increasing it.'], ['When should I get help?', 'Consider help if the issue involves debt collection, legal documents, taxes, or a major financial commitment.']],
    Credit: [['Which fees should I check first?', 'Start with interest charges, annual fees, late fees, balance transfer fees, and cash advance fees.'], ['Can a small mistake hurt my credit?', 'Yes. Late payments, high utilization, and repeated applications can matter.'], ['Where can I verify credit card rules?', 'The CFPB publishes consumer guidance on credit cards and common fees.']],
    Investing: [['What should beginners compare first?', 'Start with fees, diversification, time horizon, and whether you can leave the money invested.'], ['Should beginners avoid risk completely?', 'No. The goal is to take risk you understand and can hold, not to chase returns or panic quickly.'], ['When should I get help?', 'Consider qualified help for tax-sensitive accounts, large portfolios, or decisions you do not understand.']],
    Retirement: [['What should beginners review first?', 'Start with contribution limits, account type, employer match rules, fees, and withdrawal rules.'], ['Should conservative investors avoid stocks?', 'Not always. The right mix depends on age, timeline, risk tolerance, and other savings.'], ['Where can I verify current rules?', 'Check IRS retirement resources and plan documents before acting.']],
    Taxes: [['What records matter most?', 'Start with income forms, receipts, payment records, and dates that affect filing or deductions.'], ['Why do current rules matter?', 'Tax limits, forms, and thresholds can change, so stale advice can create errors.'], ['When should I get help?', 'Consider tax help for business income, multiple states, property sales, investments, or complex deductions.']],
    'Real Estate': [['Is approval the same as affordability?', 'No. Approval is a lender calculation. Affordability depends on your full budget and cash reserves.'], ['What costs are easy to miss?', 'Taxes, insurance, HOA fees, maintenance, repairs, utilities, closing costs, and moving costs are common gaps.'], ['When should I slow down?', 'Slow down if the payment leaves little room for repairs, savings, or income changes.']],
  }
  return map[category]
}

export function buildArticleDraft(input: DraftInput) {
  const keyword = cleanKeyword(input.keyword)
  const topic = naturalTopic(keyword)
  const category = input.category
  const frame = categoryFrame(category)
  const title = trim(buildTitle(keyword, input.intent), 70)
  const seoTitle = trim(buildSeoTitle(keyword, input.intent), 65)
  const excerpt = trim(`A practical guide to ${topic}, including what to check, common mistakes, examples, and safer next steps.`, 155)
  const seoDescription = trim(buildSeoDescription(keyword), 155)
  const author = resolvePostAuthorName({ title, category })
  const needsDisclaimer = ['Taxes', 'Investing', 'Retirement', 'Real Estate'].includes(category)
  const disclaimer = needsDisclaimer ? paragraph('<em>This article is for general educational purposes and is not personal financial, investment, tax, or legal advice.</em>') : ''
  const faqs = faqFor(category)

  const html = [
    disclaimer,
    paragraph(`${sentenceCase(topic)} matters because small details can change the real cost or risk. This guide focuses on ${frame.focus}, so you can compare the choice without turning it into a generic money rule.`),
    '<h2>Quick Answer</h2>',
    paragraph(`${sentenceCase(topic)} is a financial decision that should be checked against your income, timeline, fees, taxes, risk tolerance, and ability to reverse the choice if conditions change.`),
    '<h2>Key Takeaways</h2>',
    list([
      `Start by checking ${frame.check}.`,
      `The biggest risk is usually ${frame.risk}.`,
      'Use current official guidance when rules, rates, taxes, or account limits may have changed.',
    ]),
    '<h2>Why this matters</h2>',
    paragraph(`A weak article about ${topic} gives broad advice. A useful one explains what changes the outcome: costs, timing, rules, risk, and how easy the decision is to reverse.`),
    paragraph(`For readers, the practical question is not whether there is one perfect answer. It is which option fits the numbers in front of them without creating a bigger problem later.`),
    '<h2>How it works</h2>',
    list([
      'Define the exact decision in one sentence.',
      'Write down the numbers that affect the result.',
      'Compare the realistic options side by side.',
      'Look for fees, deadlines, account rules, taxes, and penalties.',
      'Choose the smallest useful step before making bigger changes.',
    ]),
    '<h2>Decision Checklist</h2>',
    list([
      `Confirm ${frame.check}.`,
      'Compare the total cost, not just the headline number.',
      'Check whether the decision affects taxes, credit, liquidity, or long-term flexibility.',
      'Decide what would make you pause, wait, or choose a safer option.',
    ]),
    '<h2>Risk and Tradeoffs</h2>',
    paragraph(`The main tradeoff is ${frame.risk}. A decision can look helpful in the short term but still be expensive if it adds fees, reduces flexibility, or depends on an outcome that is not guaranteed.`),
    '<h2>Real Examples</h2>',
    paragraph(`For example, two choices around ${topic} may look similar at first. One may have a lower monthly cost, while the other may be safer because it keeps more cash available or avoids a fee later.`),
    paragraph('That is why the answer depends on the details. A small fee, a deadline, or a rule about access can matter more than the headline benefit.'),
    '<h2>Common Mistakes to Avoid</h2>',
    list([
      'Comparing only one headline number.',
      'Ignoring timing, fees, taxes, penalties, or account rules.',
      'Following broad advice without checking your own numbers.',
      'Making the first step too large to maintain.',
      'Using old information when current rules matter.',
    ]),
    '<h2>Sources</h2>',
    officialSource(category),
    '<h2>FAQ</h2>',
    ...faqs.flatMap(([q, a]) => [`<h3>${q}</h3>`, paragraph(a)]),
    '<h2>What You Can Do Next</h2>',
    paragraph(`Treat ${topic} as a specific finance decision, not a slogan. Gather the numbers, compare the tradeoffs, verify current rules, and take the smallest useful next step.`),
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
    status: nextStatusFromEvaluation(evaluation),
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

function relatedKeywords(keyword: any, category: Category) {
  const words = significantKeywordTerms(keyword).slice(0, 5)
  return Array.from(new Set([...words, category.toLowerCase(), 'checklist', 'common mistakes', 'what to check']))
}
