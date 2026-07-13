import readingTime from 'reading-time'
import type { Category } from '@/types'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import {
  buildSeoArticleTitle,
  buildExcerpt,
  buildSeoDescription,
  buildSeoMetaTitle,
  canonicalPrimaryKeyword,
  normalizeTargetKeyword,
  cleanKeywordList,
  cleanSeoText,
  cleanSlugText,
  significantKeywordTerms,
  titleCaseKeyword,
} from '@/lib/seo/keyword-quality'
import { resolvePostAuthorName } from '@/lib/authors'

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
    'how to set up bill pay without overdraft fees',
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

type CategoryFrame = {
  focus: string
  check: string
  risk: string
  internalLink: string
  internalText: string
  entities: string[]
}

const FRAMES: Record<Category, CategoryFrame> = {
  'Personal Finance': {
    focus: 'cash flow, bills, savings, and day-to-day money habits',
    check: 'income dates, fixed costs, due dates, account balance, and emergency savings',
    risk: 'making the system too strict to maintain when income or bills shift',
    internalLink: '/blog/monthly-budget-checklist-for-beginners',
    internalText: 'monthly budget checklist',
    entities: ['checking account', 'cash flow', 'due dates', 'bank alerts', 'automatic payments', 'emergency fund'],
  },
  Credit: {
    focus: 'fees, interest, utilization, payment history, and credit report accuracy',
    check: 'APR, balances, due dates, limits, fees, and credit report details',
    risk: 'hurting your score or paying more interest by moving too quickly',
    internalLink: '/blog/credit-utilization-explained-for-beginners',
    internalText: 'credit utilization guide',
    entities: ['credit report', 'credit utilization', 'payment history', 'fees', 'APR', 'disputes'],
  },
  Investing: {
    focus: 'fees, diversification, time horizon, account type, and risk tolerance',
    check: 'expense ratios, fund type, contribution amount, time horizon, and liquidity needs',
    risk: 'taking risk you cannot hold through a downturn',
    internalLink: '/blog/index-funds-for-beginners',
    internalText: 'index funds guide',
    entities: ['brokerage account', 'diversification', 'expense ratio', 'time horizon', 'volatility', 'taxable account'],
  },
  Retirement: {
    focus: 'contribution rates, account rules, tax treatment, fees, and time horizon',
    check: 'account limits, match rules, fees, tax treatment, and withdrawal rules',
    risk: 'missing rules that affect taxes, access, or long-term flexibility',
    internalLink: '/blog/ira-vs-401k-for-beginners',
    internalText: 'IRA vs 401(k) guide',
    entities: ['IRA', '401(k)', 'contribution limit', 'employer match', 'tax treatment', 'withdrawal rules'],
  },
  Taxes: {
    focus: 'records, deadlines, withholding, deductions, and filing rules',
    check: 'forms, receipts, dates, income sources, and current IRS rules',
    risk: 'using stale rules or missing documentation',
    internalLink: '/blog/tax-documents-checklist-for-freelancers',
    internalText: 'tax documents checklist',
    entities: ['IRS', 'deductions', 'withholding', 'receipts', 'tax forms', 'filing deadline'],
  },
  'Real Estate': {
    focus: 'monthly payment, taxes, insurance, repairs, cash reserves, and closing costs',
    check: 'loan terms, taxes, insurance, HOA fees, repairs, and cash left after closing',
    risk: 'treating approval amount as the real budget',
    internalLink: '/blog/first-time-homebuyer-budget-checklist',
    internalText: 'homebuyer budget checklist',
    entities: ['mortgage', 'closing costs', 'property taxes', 'insurance', 'cash reserves', 'repairs'],
  },
}

function sentenceCase(value: any) {
  const clean = cleanSeoText(value)
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : ''
}

function paragraph(text: any) {
  return `<p>${cleanSeoText(text)}</p>`
}

function rawParagraph(html: string) {
  return `<p>${html}</p>`
}

function list(items: string[]) {
  return `<ul>${items.map((item) => `<li>${cleanSeoText(item)}</li>`).join('')}</ul>`
}

function inferIntent(keyword: string, requested?: string | null) {
  const request = (requested || '').toLowerCase()
  if (request && request !== 'mixed') return request
  if (/\bvs\b|compare|comparison/.test(keyword)) return 'comparison'
  if (/mistake|avoid/.test(keyword)) return 'mistakes'
  if (/checklist/.test(keyword)) return 'checklist'
  if (/how to|step by step/.test(keyword)) return 'how-to'
  return 'informational'
}

function cleanKeyword(value: any) {
  return normalizeTargetKeyword(value)
}

function buildKeywordIdea(keyword: string, category: Category, input?: any): KeywordIdea {
  const clean = cleanKeyword(keyword)
  const intent = inferIntent(clean, input?.intentMix)
  const commercial = /account|card|loan|mortgage|brokerage|ira|tax|insurance|fee/.test(clean) ? -8 : 0
  const scoreBoost = /checklist|mistakes|beginner|step by step|explained|guide/.test(clean) ? 0 : 12
  return {
    keyword: clean,
    category,
    intent,
    priority: 20 + scoreBoost + commercial + Math.min(40, clean.length),
    brief: buildBrief(clean, category, intent, input),
  }
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
      'Do not repeat the full keyword phrase across sections.',
      'Use entities and semantic variations naturally.',
      'Do not promise outcomes or guaranteed returns.',
      'Avoid personalized financial, tax, investment, or legal advice.',
    ],
  }
}

function officialSource(category: Category) {
  const source = OFFICIAL_LINKS[category][0]
  return rawParagraph(`For current rules or consumer guidance, verify details with <a href="${source.href}" target="_blank" rel="noopener noreferrer">${source.title}</a>.`)
}

function faqFor(category: Category): Array<[string, string]> {
  const map: Record<Category, Array<[string, string]>> = {
    'Personal Finance': [['What should I check first?', 'Start with income dates, fixed bills, due dates, and the cash buffer you want to keep untouched.'], ['Should every bill be automatic?', 'No. Fixed bills are easier to automate. Variable bills often deserve a review before payment.'], ['When should I change my setup?', 'Change it when payday, due dates, fees, or your usual balance pattern changes.']],
    Credit: [['Which fees should I check first?', 'Start with interest charges, annual fees, late fees, balance transfer fees, and cash advance fees.'], ['Can a small mistake hurt my credit?', 'Yes. Late payments, high utilization, and repeated applications can matter.'], ['Where can I verify credit card rules?', 'The CFPB publishes consumer guidance on credit cards and common fees.']],
    Investing: [['What should beginners compare first?', 'Start with fees, diversification, time horizon, and whether you can leave the money invested.'], ['Should beginners avoid risk completely?', 'No. The goal is to take risk you understand and can hold, not to chase returns or panic quickly.'], ['When should I get help?', 'Consider qualified help for tax-sensitive accounts, large portfolios, or decisions you do not understand.']],
    Retirement: [['What should beginners review first?', 'Start with contribution limits, account type, employer match rules, fees, and withdrawal rules.'], ['Should conservative investors avoid stocks?', 'Not always. The right mix depends on age, timeline, risk tolerance, and other savings.'], ['Where can I verify current rules?', 'Check IRS retirement resources and plan documents before acting.']],
    Taxes: [['What records matter most?', 'Start with income forms, receipts, payment records, and dates that affect filing or deductions.'], ['Why do current rules matter?', 'Tax limits, forms, and thresholds can change, so stale advice can create errors.'], ['When should I get help?', 'Consider tax help for business income, multiple states, property sales, investments, or complex deductions.']],
    'Real Estate': [['Is approval the same as affordability?', 'No. Approval is a lender calculation. Affordability depends on your full budget and cash reserves.'], ['What costs are easy to miss?', 'Taxes, insurance, HOA fees, maintenance, repairs, utilities, closing costs, and moving costs are common gaps.'], ['When should I slow down?', 'Slow down if the payment leaves little room for repairs, savings, or income changes.']],
  }
  return map[category]
}

function topicLabel(keyword: string) {
  const clean = normalizeTargetKeyword(keyword)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) return 'automatic bill pay'
  if (/tax[-\s]?loss harvesting/.test(clean)) return 'tax-loss harvesting'
  if (/co[-\s]?ownership agreement/.test(clean)) return 'co-ownership planning'
  if (/hard inquiry/.test(clean)) return 'credit report disputes'
  if (/currency conversion fee/.test(clean)) return 'currency conversion fees'
  if (/credit utilization/.test(clean)) return 'credit utilization'
  return clean
}

function semanticVariants(keyword: string, category: Category) {
  const clean = normalizeTargetKeyword(keyword)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) {
    return ['automatic bill payments', 'recurring payments', 'payment dates', 'checking account buffer', 'balance alerts', 'overdraft protection']
  }
  if (/tax[-\s]?loss harvesting/.test(clean)) return ['realized losses', 'taxable brokerage account', 'wash-sale rule', 'replacement fund', 'capital gains', 'portfolio rebalancing']
  if (/co[-\s]?ownership agreement/.test(clean)) return ['ownership share', 'monthly housing costs', 'repair rules', 'exit plan', 'decision rights', 'dispute process']
  return FRAMES[category].entities
}

function introFor(keyword: string, category: Category, frame: CategoryFrame) {
  const clean = normalizeTargetKeyword(keyword)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) {
    return [
      'Automatic bill pay can prevent missed due dates, but it can also create overdraft fees when payments leave before income arrives.',
      'A safer setup matches recurring payments with your payday, keeps a small checking buffer, and uses alerts before bills pull money from the account.',
    ]
  }
  if (/tax[-\s]?loss harvesting/.test(clean)) {
    return [
      'Tax-loss harvesting can reduce taxable gains, but the benefit depends on timing, replacement investments, and the wash-sale rule.',
      'The goal is not to trade for the sake of trading. It is to decide whether the tax benefit is worth the added complexity.',
    ]
  }
  if (/co[-\s]?ownership agreement/.test(clean)) {
    return [
      'Buying a home with friends can make ownership feel more affordable, but the agreement matters as much as the mortgage.',
      'The strongest plans explain costs, repairs, decision rights, and exit terms before anyone is under pressure.',
    ]
  }
  return [
    `${sentenceCase(topicLabel(clean))} affects ${frame.focus}.`,
    'The better starting point is to compare the numbers, the timing, and the downside before making a bigger commitment.',
  ]
}

function quickAnswerFor(keyword: string, category: Category, frame: CategoryFrame) {
  const clean = normalizeTargetKeyword(keyword)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) return 'Schedule fixed bills after reliable income arrives, keep variable bills manual when possible, and turn on low-balance alerts so you can move money before a payment clears.'
  if (/tax[-\s]?loss harvesting/.test(clean)) return 'The basic move is to sell an investment at a loss, use that loss against eligible gains, and avoid buying a substantially identical replacement too soon.'
  if (/co[-\s]?ownership agreement/.test(clean)) return 'A useful agreement covers ownership share, monthly costs, repairs, exit terms, missed payments, and how disputes will be handled.'
  return `Start with ${frame.check}. Then compare the total cost, flexibility, and worst-case outcome before acting.`
}

function exampleFor(keyword: string, category: Category) {
  const clean = normalizeTargetKeyword(keyword)
  if (/bill pay/.test(clean) && /overdraft/.test(clean)) {
    return [
      'Imagine rent is due on the first, utilities clear on the third, and your paycheck usually arrives on the fifth. Automating every bill at the start of the month may look organized, but it creates a timing problem.',
      'A cleaner setup would move fixed payments after payday where possible, keep one unpredictable bill manual, and send a low-balance alert several days before the largest payment clears.',
    ]
  }
  if (/tax[-\s]?loss harvesting/.test(clean)) {
    return [
      'Suppose an index fund in a taxable account is down for the year while the rest of the portfolio still fits your plan. Selling the losing position may create a tax loss, but the replacement choice matters.',
      'Buying a nearly identical fund too soon can create a wash-sale issue, so the trade needs to be planned before the order is placed.',
    ]
  }
  return [
    'For example, two choices can have the same headline benefit but very different timing, fees, and flexibility.',
    `That is why ${FRAMES[category].check} should be reviewed before treating the obvious option as the right one.`,
  ]
}

function humanBody(keyword: string, category: Category, frame: CategoryFrame) {
  const variants = semanticVariants(keyword, category)
  const intro = introFor(keyword, category, frame)
  const examples = exampleFor(keyword, category)
  const faqs = faqFor(category)
  const needsDisclaimer = ['Taxes', 'Investing', 'Retirement', 'Real Estate'].includes(category)

  return [
    needsDisclaimer ? paragraph('This article is for general educational purposes only and is not personal financial, investment, tax, or legal advice.') : '',
    ...intro.map(paragraph),
    '<h2>Quick Answer</h2>',
    paragraph(quickAnswerFor(keyword, category, frame)),
    '<h2>Key Takeaways</h2>',
    list([
      `Start with ${frame.check}.`,
      `Watch the main risk: ${frame.risk}.`,
      `Use current official guidance when rules, rates, taxes, or account limits may have changed.`,
      `Keep the first action small enough to reverse if your numbers change.`,
    ]),
    '<h2>Why This Matters</h2>',
    paragraph(`Money mistakes often happen when ${variants[0]} is treated as a set-and-forget task instead of a system that needs timing, limits, and follow-up.`),
    paragraph(`A few details can change the outcome: ${variants.slice(1, 4).join(', ')}, and whether you have enough room to absorb surprises.`),
    '<h2>What to Check First</h2>',
    paragraph(`Before making changes, write down ${frame.check}. This turns a vague money decision into a list you can actually compare.`),
    paragraph(`Also note which details are fixed and which ones can change. A due date, rate, fee, balance, or tax rule may look small on its own, but those details often decide whether the plan is useful or risky.`),
    list([
      'The exact account, bill, investment, loan, or deadline involved.',
      'The amount of money at risk if the timing is wrong.',
      'Any fee, tax, penalty, rate, or rule that could change the result.',
      'The point where you would pause instead of moving forward.',
    ]),
    '<h2>How to Set Up a Safer System</h2>',
    paragraph(`A safer system starts with one change, not a full overhaul. Review ${variants.slice(0, 3).join(', ')}, then decide which part should be automatic and which part still needs a manual check.`),
    paragraph('If the decision involves a bank, broker, lender, tax form, or property document, keep a copy of the terms you relied on. That makes it easier to review the choice later and catch changes before they become expensive.'),
    paragraph('The best setup is usually boring. It should reduce missed steps, make problems visible earlier, and give you time to respond before a fee, deadline, or rule creates a larger issue.'),
    '<h2>Decision Checklist</h2>',
    list([
      `Confirm ${variants[0]} fits your current cash flow or account rules.`,
      'Compare the total cost, not just the headline number.',
      'Check whether the decision affects taxes, credit, liquidity, or long-term flexibility.',
      'Set a reminder to review the setup after the first full cycle.',
    ]),
    '<h2>Risk and Tradeoffs</h2>',
    paragraph(`The main tradeoff is ${frame.risk}. A choice can be helpful in one area while creating a problem somewhere else.`),
    paragraph(`The safest version usually leaves room for delay, error, or a surprise expense. If the plan only works when everything goes perfectly, it is probably too tight.`),
    paragraph('Look for second-order effects too. A lower payment may reduce pressure this month but cost more over time. A faster action may solve the visible problem but leave less flexibility if income changes.'),
    '<h2>Real Examples</h2>',
    paragraph(`For example, the same strategy can help one reader and hurt another if income timing, account rules, or cash reserves are different.`),
    ...examples.map(paragraph),
    '<h2>Common Mistakes to Avoid</h2>',
    list([
      'Comparing only one headline number.',
      'Ignoring timing, fees, taxes, penalties, or account rules.',
      'Automating a decision that still needs manual review.',
      'Making the first step too large to maintain.',
      'Using old information when current rules matter.',
    ]),
    paragraph('Another common mistake is assuming the setup will keep working forever. Review it after the first month, again after any income change, and whenever a provider changes fees, rates, due dates, or account terms.'),
    '<h2>When to Pause</h2>',
    paragraph('Pause before acting if you cannot explain the downside in one sentence. Also slow down if the decision depends on a deadline you have not confirmed, a tax rule you have not checked, or a balance that leaves no room for error.'),
    paragraph('A short delay can be useful when the next step affects credit, taxes, retirement accounts, property, legal documents, or large debts. In those cases, a qualified professional may be cheaper than fixing a rushed mistake later.'),
    paragraph('Before you move forward, write down what would make the decision successful and what would make it fail. That simple review turns the article from general information into a practical checklist you can revisit.'),
    '<h2>Helpful Internal Guide</h2>',
    rawParagraph(`If you are building the basics first, read CashClimb’s <a href="${frame.internalLink}">${frame.internalText}</a> for a broader checklist.`),
    '<h2>Sources</h2>',
    officialSource(category),
    '<h2>FAQ</h2>',
    ...faqs.flatMap(([q, a]) => [`<h3>${q}</h3>`, paragraph(a)]),
    '<h2>What You Can Do Next</h2>',
    paragraph('Choose one practical action, test it for a full cycle, and review the result before adding more complexity. Good money systems are easier to keep than dramatic ones.'),
  ].filter(Boolean).join('\n')
}

export function buildArticleDraft(input: DraftInput) {
  const keyword = cleanKeyword(input.keyword)
  const category = input.category
  const frame = FRAMES[category]
  const title = cleanSeoText(buildSeoArticleTitle(keyword, input.intent))
  const seoTitle = cleanSeoText(buildSeoMetaTitle(keyword, input.intent))
  const excerpt = cleanSeoText(buildExcerpt(keyword, category))
  const seoDescription = cleanSeoText(buildSeoDescription(keyword, category))
  const author = resolvePostAuthorName({ title, category })
  let html = cleanSeoText(humanBody(keyword, category, frame))
  const readTime = readingTime(html.replace(/<[^>]*>/g, ' ')).text
  const related = cleanKeywordList([
    keyword,
    ...significantKeywordTerms(keyword),
    ...semanticVariants(keyword, category),
  ])

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
    slug: cleanSlugText(title),
    excerpt,
    body: html,
    category,
    author,
    read_time: readTime,
    primary_keyword: canonicalPrimaryKeyword(keyword),
    related_keywords: related,
    seo_title: seoTitle,
    seo_description: seoDescription,
    cover_url: null,
    status: nextStatusFromEvaluation(evaluation),
    quality_score: evaluation.score,
    risk_level: evaluation.risk_level,
    review_notes: evaluation.passed
      ? `Generated by automation. Editorial score ${evaluation.score}.`
      : `Generated by automation. Needs review: ${evaluation.checks.filter((check) => !check.passed).map((check) => check.name).join(', ')}.`,
    workflow_meta: {
      automationVersion: 'entity-editorial-v4',
      intent: input.intent || null,
      brief: input.brief || null,
      exactKeywordPolicy: 'semantic-first, no forced repetition',
    },
    evaluation,
  }
}
