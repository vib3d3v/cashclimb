import slugify from 'slugify'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import type { Category, WorkflowEvaluation } from '@/types'
import {
  buildSeoArticleTitle,
  buildSeoDescription,
  buildSeoMetaTitle,
  canonicalPrimaryKeyword,
  cleanKeywordList,
  cleanSeoText,
  cleanSlugText,
  keywordAppearsNaturally,
  normalizeGeneratedPostFields,
  titleCaseKeyword,
} from '@/lib/seo/keyword-quality'

const CATEGORY_VALUES: Category[] = ['Investing', 'Personal Finance', 'Credit', 'Taxes', 'Real Estate', 'Retirement']
const YMYL_CATEGORIES = new Set(['Investing', 'Retirement', 'Taxes', 'Real Estate'])

type FixResult = {
  post: any
  before: WorkflowEvaluation
  after: WorkflowEvaluation
  wordCount: number
  fixesApplied: string[]
  unresolved: string[]
}

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function wordCount(html = '') {
  return stripHtml(html).split(/\s+/).filter(Boolean).length
}

function escapeHtml(value: any = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function p(text: string) {
  return `<p>${escapeHtml(text)}</p>`
}

function rawP(html: string) {
  return `<p>${html}</p>`
}

function list(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function titleCase(value = '') {
  return titleCaseKeyword(value)
}

function categoryFromPost(post: any): Category {
  return CATEGORY_VALUES.includes(post?.category) ? post.category : 'Personal Finance'
}

function primaryKeyword(post: any) {
  const explicit = canonicalPrimaryKeyword(post?.primary_keyword || post?.primaryKeyword || '')
  if (explicit) return explicit

  return canonicalPrimaryKeyword(
    String(post?.title || 'personal finance guide')
      .replace(/[:|].*$/, '')
      .replace(/\b(a|an|the|guide|cashclimb|practical|simple|complete)\b/gi, '')
  ) || 'personal finance guide'
}

function readTimeFor(html: string) {
  return `${Math.max(1, Math.ceil(wordCount(html) / 220))} min read`
}

function appendSection(html: string, heading: string, body: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (new RegExp(`<h2[^>]*>\\s*${escaped}\\s*<\\/h2>`, 'i').test(html)) return html
  return `${html}\n<h2>${heading}</h2>\n${body}`
}

function removeSection(html: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return html.replace(new RegExp(`<h2[^>]*>\\s*${escaped}\\s*<\\/h2>[\\s\\S]*?(?=<h2|$)`, 'gi'), '')
}

function removeBadFillerSections(html: string) {
  let out = html
  for (const heading of [
    'Data and sources to verify',
    'Tools and accounts that can help',
    'Helpful official resources',
    'How CashClimb readers can use this guide',
  ]) {
    out = removeSection(out, heading)
  }
  return out
}

function sanitizeAdvisoryPhrasing(html: string) {
  const replacements: Array<[RegExp, string]> = [
    [/\byou should\b/gi, 'you may want to'],
    [/\byou need to\b/gi, 'you may need to'],
    [/\byou must\b/gi, 'you may need to'],
    [/\balways\b/gi, 'often'],
    [/\bnever\b/gi, 'rarely'],
    [/\bthe best option is\b/gi, 'one option to compare is'],
    [/\bguaranteed\b/gi, 'possible'],
    [/\brisk-free\b/gi, 'lower-risk'],
    [/\bwhen it comes to\b/gi, 'for'],
    [/\bin today'?s world\b/gi, 'today'],
    [/\bdelve into\b/gi, 'explain'],
    [/\bit is important to note that\b/gi, 'note that'],
  ]
  return replacements.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), html)
}

function ensureGeneralDisclaimer(html: string, category: Category) {
  if (!YMYL_CATEGORIES.has(category)) return html
  if (/not personal financial|not financial advice|general educational purposes/i.test(stripHtml(html))) return html
  return `${p('This article is for general educational purposes only and is not personal financial, investment, tax, or legal advice. Consider your full situation and speak with a qualified professional before making major money decisions.')}\n${html}`
}


function ensureKeywordInOpening(html: string, keyword: string) {
  if (keywordAppearsNaturally(keyword, '', stripHtml(html).slice(0, 1200))) return html

  const opening = p(`This guide explains ${keyword} in practical terms, including what to compare, what can go wrong, and which details to verify before acting.`)

  const disclaimerMatch = html.match(/^(\s*<p>[^<]*(?:general educational purposes|not personal financial|not financial advice)[\s\S]*?<\/p>\s*)/i)
  if (disclaimerMatch?.[0]) {
    return `${disclaimerMatch[0]}
${opening}
${html.slice(disclaimerMatch[0].length)}`
  }

  return `${opening}
${html}`
}

function officialSourceParagraph(category: Category) {
  if (category === 'Retirement') {
    return rawP('For current retirement account rules, check <a href="https://www.irs.gov/retirement-plans" target="_blank" rel="noopener noreferrer">IRS retirement plan resources</a> before acting.')
  }
  if (category === 'Credit') {
    return rawP('For current credit card rules and consumer protections, check the <a href="https://www.consumerfinance.gov/consumer-tools/credit-cards/" target="_blank" rel="noopener noreferrer">CFPB credit card resources</a>.')
  }
  if (category === 'Investing') {
    return rawP('For investor education and risk basics, review <a href="https://www.investor.gov/" target="_blank" rel="noopener noreferrer">SEC Investor.gov</a>.')
  }
  if (category === 'Taxes') {
    return rawP('For current tax rules, check <a href="https://www.irs.gov/individuals" target="_blank" rel="noopener noreferrer">IRS individual tax resources</a>.')
  }
  if (category === 'Real Estate') {
    return rawP('For homebuying rules and cost checklists, review the <a href="https://www.consumerfinance.gov/owning-a-home/" target="_blank" rel="noopener noreferrer">CFPB home buying guide</a>.')
  }
  return rawP('For current consumer finance guidance, review the <a href="https://www.consumerfinance.gov/consumer-tools/" target="_blank" rel="noopener noreferrer">CFPB consumer tools</a>.')
}

function buildUsefulDepthSections(html: string, keyword: string, category: Category) {
  let out = html

  out = appendSection(out, 'Quick Answer', [
    p(`${titleCase(keyword)} should be handled as a specific financial decision. Compare cost, timing, risk, flexibility, and current rules before taking action.`),
  ].join('\n'))

  out = appendSection(out, 'Decision Checklist', [
    list([
      'Check the total cost, not just the headline number.',
      'Confirm fees, taxes, interest, penalties, deadlines, and account rules.',
      'Compare one safer alternative before making a large or irreversible move.',
      'Consider qualified help when the decision affects taxes, investments, legal documents, property, retirement accounts, or large debts.',
    ]),
  ].join('\n'))

  out = appendSection(out, 'Risk and Tradeoffs', [
    p('The main risk is applying general finance guidance without checking your own numbers. Income stability, debt level, time horizon, liquidity needs, tax treatment, and account rules can change the right next step.'),
  ].join('\n'))

  out = appendSection(out, 'How to make the decision practical', [
    p('Start by turning the topic into a real decision. Write down the action being considered, the amount of money involved, the timing, and what could go wrong if income, rates, fees, or account rules change.'),
    p('A useful article should explain the tradeoff instead of adding broad advice. Readers need to know what helps, what can backfire, and what number to check before acting.'),
  ].join('\n'))

  out = appendSection(out, 'Real Examples', [
    p(`For example, a reader comparing options related to ${keyword} might see one choice that looks easier today and another that is slower but safer. The better choice depends on cash flow, fees, timing, flexibility, and whether the decision creates risk later.`),
    p('That comparison is more helpful than a generic rule because it shows how the decision changes when the reader has irregular income, high-interest debt, a thin emergency fund, or a short deadline.'),
  ].join('\n'))

  out = appendSection(out, 'Common Mistakes to Avoid', [
    list([
      'Comparing only one number, such as a monthly payment, rate, or projected return.',
      'Ignoring fees, tax treatment, deadlines, account rules, or penalties.',
      'Assuming a strategy works the same way for every reader.',
      'Making the next step too large to maintain consistently.',
      'Skipping current source checks when rules or limits may have changed.',
    ]),
  ].join('\n'))

  out = appendSection(out, 'What You Can Do Next', [
    p('Check the current numbers, read the account terms, and compare at least one safer alternative. If the decision affects taxes, investing, retirement accounts, property, legal documents, or large debts, consider getting qualified help.'),
    officialSourceParagraph(category),
  ].join('\n'))

  return out
}


function ensureKeyTakeaways(html: string, keyword: string, category: Category) {
  if (/<h2[^>]*>\s*key takeaways\s*<\/h2>[\s\S]*?<ul>[\s\S]*?<\/ul>/i.test(html)) return html

  const items = [
    `${titleCase(keyword)} should be checked against your actual costs, deadlines, account rules, and downside risk.`,
    `Start with the numbers you can verify today instead of relying on a generic rule.`,
    `For ${category.toLowerCase()} decisions, compare at least one safer alternative before taking a large or irreversible step.`,
    'Keep notes, screenshots, statements, or documents so you can review the decision later.',
  ]

  const section = `<h2>Key Takeaways</h2>\n${list(items)}`
  const firstH2 = html.search(/<h2\b/i)
  if (firstH2 === -1) return `${section}\n${html}`
  return `${html.slice(0, firstH2)}${section}\n${html.slice(firstH2)}`
}

function ensureInternalLink(html: string, category: Category) {
  if (/href="\/blog(?:\/|\?|"|#)/i.test(html)) return html

  const anchor = category === 'Credit'
    ? 'more credit guides'
    : category === 'Investing'
      ? 'more investing guides'
      : category === 'Taxes'
        ? 'more tax guides'
        : category === 'Retirement'
          ? 'more retirement guides'
          : category === 'Real Estate'
            ? 'more real estate guides'
            : 'more personal finance guides'

  return appendSection(
    html,
    'Related CashClimb guides',
    rawP(`You can also browse <a href="/blog" rel="internal">${anchor}</a> to compare this topic with other money decisions.`)
  )
}

function ensureMinimumDepth(html: string, keyword: string, category: Category) {
  let out = html
  let guard = 0
  while (wordCount(out) < 950 && guard < 3) {
    guard += 1
    out = appendSection(out, guard === 1 ? 'Additional Checks Before You Act' : `Additional Checks Before You Act ${guard}`, [
      p(`Before acting on ${keyword}, write down the exact action, the amount involved, the deadline, and the consequence if the decision goes wrong. This keeps the advice practical and helps you avoid treating a general article like personalized guidance.`),
      p(`For a ${category.toLowerCase()} topic, the safer approach is usually to compare fees, eligibility rules, timing, taxes, flexibility, and the worst-case outcome. If any of those details are unclear, pause and verify them with the official provider or a qualified professional.`),
    ].join('\n'))
  }
  return out
}

function normalizeArticleTitle(value: string, keyword: string) {
  const clean = cleanSeoText(value).replace(/\s+/g, ' ').trim()
  if (clean.length >= 35 && clean.length <= 72 && keywordAppearsNaturally(keyword, clean, '')) return buildSeoArticleTitle(clean)
  return buildSeoArticleTitle(keyword)
}

function buildSeoTitle(value: string, keyword: string) {
  const clean = cleanSeoText(value || '')
  if (clean.length >= 35 && clean.length <= 65 && keywordAppearsNaturally(keyword, clean, '')) return buildSeoMetaTitle(clean)
  return buildSeoMetaTitle(keyword)
}

function ensureConclusion(html: string) {
  if (/next steps|the bottom line|final thoughts/i.test(stripHtml(html))) return html
  return `${html}\n<h2>Next steps</h2>\n${p('Pick one practical action, gather the numbers, and compare the tradeoffs before acting. A smaller step that you can maintain is usually more useful than a rushed change that creates new problems.')}`
}

function ensureFaq(html: string) {
  if (/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(html)) return html
  return `${html}\n<h2>FAQ</h2>\n<h3>Does the same advice work for everyone?</h3>\n${p('No. The right approach can vary by income, debt level, country, account type, tax position, time horizon, and risk tolerance.')}\n<h3>What should I compare first?</h3>\n${p('Start with cost, timing, flexibility, downside risk, and whether the decision can be reversed without major damage.')}\n<h3>When is professional help worth considering?</h3>\n${p('Consider qualified help when the decision involves taxes, investments, retirement accounts, property, legal documents, business income, or large debt balances.')}`
}

function trimSeoTitle(value: string, keyword: string) {
  const fallback = `${titleCase(keyword)} Guide`
  const base = cleanSeoText(value || fallback).replace(/\s+/g, ' ').trim()
  return base.length >= 40 && base.length <= 65 ? base : fallback.slice(0, 65)
}

function trimSeoDescription(value: string, keyword: string) {
  const fallback = `A practical guide to ${keyword}, including examples, common mistakes, safer next steps, FAQs, and a clear checklist for readers.`
  let base = cleanSeoText(value || fallback).replace(/\s+/g, ' ').trim()
  if (base.length < 120) base = fallback
  if (base.length > 160) base = base.slice(0, 157).replace(/\s+\S*$/, '') + '...'
  return base
}

async function updateQualityCheck(postId: string, evaluation: WorkflowEvaluation) {
  const supabase = createAdminClient()
  await supabase.from('quality_checks').insert({
    post_id: postId,
    score: evaluation.score,
    passed: evaluation.passed,
    risk_level: evaluation.risk_level,
    checks: evaluation.checks,
  })
}

async function safeUpdatePost(postId: string, update: Record<string, any>) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('posts').update(update).eq('id', postId).select('*').single()
  if (!error) return data

  const fallback: Record<string, any> = {
    title: update.title,
    excerpt: update.excerpt,
    body: update.body,
    slug: update.slug,
    primary_keyword: update.primary_keyword,
    related_keywords: update.related_keywords,
    read_time: update.read_time,
    seo_title: update.seo_title,
    seo_description: update.seo_description,
    quality_score: update.quality_score,
    risk_level: update.risk_level,
    status: update.status,
    review_notes: update.review_notes,
  }
  Object.keys(fallback).forEach((key) => fallback[key] === undefined && delete fallback[key])
  const retry = await supabase.from('posts').update(fallback).eq('id', postId).select('*').single()
  if (retry.error) throw retry.error
  return retry.data
}

export async function fixPostContentDepthAndTone(postId: string): Promise<FixResult> {
  const supabase = createAdminClient()
  const { data: post, error } = await supabase.from('posts').select('*').eq('id', postId).single()
  if (error) throw error
  if (!post) throw new Error('Post not found.')

  const category = categoryFromPost(post)
  const keyword = canonicalPrimaryKeyword(primaryKeyword(post))

  const before = evaluateFinanceArticle({
    title: post.title || '',
    excerpt: post.excerpt || '',
    body: post.body || '',
    primaryKeyword: keyword,
    category,
    seoTitle: post.seo_title || post.title || '',
    seoDescription: post.seo_description || post.excerpt || '',
    coverUrl: post.cover_url || null,
  })

  let body = cleanSeoText(String(post.body || ''))
  body = removeBadFillerSections(body)
  body = sanitizeAdvisoryPhrasing(body)
  body = ensureGeneralDisclaimer(body, category)
  body = ensureKeywordInOpening(body, keyword)
  body = buildUsefulDepthSections(body, keyword, category)
  body = ensureKeyTakeaways(body, keyword, category)
  body = ensureInternalLink(body, category)
  body = ensureMinimumDepth(body, keyword, category)
  body = ensureFaq(body)
  body = ensureConclusion(body)
  body = body.replace(/\n{3,}/g, '\n\n').trim()

  const normalized = normalizeGeneratedPostFields({
    title: post.title || keyword,
    slug: post.slug || keyword,
    excerpt: post.excerpt || keyword,
    primaryKeyword: keyword,
    relatedKeywords: post.related_keywords || '',
    seoTitle: post.seo_title || post.title || keyword,
    seoDescription: post.seo_description || post.excerpt || keyword,
    body,
    category,
  })

  const title = normalized.title
  const excerpt = normalized.excerpt
  const seoTitle = normalized.seoTitle
  const seoDescription = normalized.seoDescription
  const slug = normalized.slug || cleanSlugText(title) || slugify(title, { lower: true, strict: true })
  const relatedKeywords = normalized.relatedKeywords
  body = normalized.body

  const after = evaluateFinanceArticle({
    title,
    excerpt,
    body,
    primaryKeyword: keyword,
    category,
    seoTitle,
    seoDescription,
    coverUrl: post.cover_url || null,
  })

  const beforeFailed = before.checks.filter((check) => !check.passed).map((check) => check.name)
  const fixesApplied = beforeFailed.filter((name) => after.checks.find((check) => check.name === name)?.passed)
  const unresolved = after.checks.filter((check) => !check.passed).map((check) => check.name)

  const updatedPost = await safeUpdatePost(postId, {
    title,
    slug: post.published ? cleanSlugText(post.slug || slug) : slug,
    excerpt,
    body,
    primary_keyword: keyword,
    related_keywords: relatedKeywords,
    read_time: readTimeFor(body),
    seo_title: seoTitle,
    seo_description: seoDescription,
    quality_score: after.score,
    risk_level: after.risk_level,
    status: nextStatusFromEvaluation(after),
    review_notes: unresolved.length
      ? `Advanced content fixer applied. Still needs review: ${unresolved.join(', ')}.`
      : `Advanced content fixer applied. Score ${after.score}.`,
    workflow_meta: {
      ...(post.workflow_meta || {}),
      lastAdvancedContentFixAt: new Date().toISOString(),
      fixesApplied,
      unresolved,
      wordCount: wordCount(body),
    },
  })

  await updateQualityCheck(postId, after)

  return {
    post: updatedPost,
    before,
    after,
    wordCount: wordCount(body),
    fixesApplied,
    unresolved,
  }
}
