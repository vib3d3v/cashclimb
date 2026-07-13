import readingTime from 'reading-time'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import type { Category, WorkflowEvaluation } from '@/types'
import { cleanSeoTitle } from '@/lib/seo/clean-title'
import {
  buildSeoArticleTitle,
  buildSeoDescription,
  buildSeoMetaTitle,
  buildExcerpt,
  cleanSeoText,
  cleanSlugText,
  normalizeTargetKeyword,
} from '@/lib/seo/keyword-quality'

const CATEGORY_VALUES: Category[] = [
  'Investing',
  'Personal Finance',
  'Credit',
  'Taxes',
  'Real Estate',
  'Retirement',
]

const YMYL_CATEGORIES = new Set([
  'Investing',
  'Retirement',
  'Taxes',
  'Real Estate',
])

type FixResult = {
  post: any
  before: WorkflowEvaluation
  after: WorkflowEvaluation
  fixesApplied: string[]
  unresolved: string[]
}

function safeString(value: any = '') {
  return String(value || '')
}

function stripHtml(html: any = '') {
  return safeString(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(value: any = '') {
  const safe = safeString(value)

  return safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function p(text: any) {
  return `<p>${escapeHtml(text)}</p>`
}

function list(items: any[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function titleCase(value: any = '') {
  return safeString(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function trimToSentence(value: any, max: number) {
  const clean = safeString(value).replace(/\s+/g, ' ').trim()

  if (clean.length <= max) return clean

  const trimmed = clean.slice(0, max).replace(/\s+\S*$/, '').trim()
  return trimmed.replace(/[.,;:!?-]+$/, '')
}

function ensureRange(value: any, min: number, max: number, fallback: any) {
  let clean = safeString(value).replace(/\s+/g, ' ').trim()
  const safeFallback = safeString(fallback).replace(/\s+/g, ' ').trim()

  if (clean.length < min) clean = safeFallback
  if (clean.length > max) clean = trimToSentence(clean, max)

  return clean
}

function categoryFromPost(post: any): Category {
  return CATEGORY_VALUES.includes(post?.category)
    ? post.category
    : 'Personal Finance'
}

function primaryKeyword(post: any) {
  const value = safeString(post?.primary_keyword || post?.primaryKeyword).trim()

  if (value) return value.toLowerCase()

  return (
    safeString(post?.title || 'personal finance guide')
      .replace(/[:|].*$/, '')
      .replace(/\b(a|an|the|guide|cashclimb|practical|simple|complete)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase() || 'personal finance guide'
  )
}

function stockCoverFor(category: Category) {
  const envName = `STOCK_COVER_${category.toUpperCase().replace(/\s+/g, '_')}_URLS`
  const specific = process.env[envName]
  const generic =
    process.env.STOCK_COVER_PERSONAL_FINANCE_URLS ||
    process.env.STOCK_COVER_FINANCE_URLS

  const source = specific || generic || ''

  return source
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)[0] || null
}

async function relatedLinks(currentPostId: string, category: Category) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('title, slug')
    .eq('published', true)
    .eq('category', category)
    .neq('id', currentPostId)
    .order('updated_at', { ascending: false })
    .limit(3)

  if (data?.length) {
    return data.map((post) => ({
      title: post.title,
      href: `/blog/${post.slug}`,
    }))
  }

  return [
    {
      title: `${category} articles`,
      href: `/blog?category=${encodeURIComponent(category)}`,
    },
    {
      title: 'All CashClimb guides',
      href: '/blog',
    },
  ]
}

function removeBadLanguage(html: any) {
  return safeString(html)
    .replace(/guaranteed return/gi, 'potential return')
    .replace(/risk-free return/gi, 'lower-risk option')
    .replace(/surefire investment/gi, 'investment option')
    .replace(/double your money/gi, 'improve your long-term outcome')
    .replace(/this is the best investment/gi, 'this may be one option to compare')
    .replace(/everyone should invest in/gi, 'some readers may compare')
    .replace(/you should buy this stock/gi, 'review the risks before making any investment decision')
    .replace(/\bthis is tax advice\b/gi, 'this is general tax education')
    .replace(/\bthis is legal advice\b/gi, 'this is general legal education')
    .replace(/\bpersonalized advice\b/gi, 'general education')
    .replace(/when it comes to/gi, 'for')
    .replace(/in today's world/gi, 'today')
    .replace(/navigating the/gi, 'understanding the')
    .replace(/delve into/gi, 'explain')
    .replace(/it is important to note that/gi, 'note that')
    .replace(/in conclusion,? this article/gi, 'the bottom line')
}

function hasHeading(html: any, label: RegExp) {
  return new RegExp(`<h2[^>]*>\\s*${label.source}\\s*<\\/h2>`, 'i').test(
    safeString(html)
  )
}

function appendMissingSection(html: any, heading: string, content: string) {
  const safeHtml = safeString(html)

  if (
    hasHeading(
      safeHtml,
      new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    )
  ) {
    return safeHtml
  }

  return `${safeHtml}\n<h2>${escapeHtml(heading)}</h2>\n${safeString(content)}`
}

function ensureOpeningKeyword(html: any, keyword: string) {
  const safeHtml = safeString(html)
  const plain = stripHtml(safeHtml).toLowerCase()
  const safeKeyword = safeString(keyword).toLowerCase()

  if (plain.slice(0, 600).includes(safeKeyword)) return safeHtml

  return `${p(
    'This guide explains the practical choices, risks, costs, and next steps to compare before taking action.'
  )}\n${safeHtml}`
}

function ensureDisclaimer(html: any, category: Category) {
  const safeHtml = safeString(html)

  if (!YMYL_CATEGORIES.has(category)) return safeHtml

  if (/not financial advice|general information|educational purposes/i.test(stripHtml(safeHtml))) {
    return safeHtml
  }

  return `${p(
    'This article is for general educational purposes only and is not personal financial, investment, tax, or legal advice.'
  )}\n${safeHtml}`
}


function ensureQuickAnswer(html: any, keyword: string) {
  const safeHtml = safeString(html)
  if (/<h2[^>]*>\s*Quick Answer\s*<\/h2>/i.test(safeHtml)) return safeHtml
  return `${safeHtml}
<h2>Quick Answer</h2>
${p(
    `${titleCase(keyword)} is best treated as a financial decision, not a universal rule. Compare the cost, timing, risk, flexibility, and current rules before taking action.`
  )}`
}

function ensureDecisionChecklist(html: any) {
  const safeHtml = safeString(html)
  if (/<h2[^>]*>\s*Decision Checklist\s*<\/h2>/i.test(safeHtml)) return safeHtml
  return `${safeHtml}
<h2>Decision Checklist</h2>
${list([
    'Check the total cost, not just the headline number.',
    'Confirm fees, taxes, interest, penalties, deadlines, and account rules.',
    'Compare one safer alternative before making a large or irreversible move.',
    'Consider qualified help when the decision affects taxes, investments, legal documents, property, retirement accounts, or large debts.',
  ])}`
}

function ensureRiskTradeoffs(html: any) {
  const safeHtml = safeString(html)
  if (/<h2[^>]*>\s*Risk and Tradeoffs\s*<\/h2>/i.test(safeHtml)) return safeHtml
  return `${safeHtml}
<h2>Risk and Tradeoffs</h2>
${p(
    'The main risk is applying general finance guidance without checking your own numbers. Income stability, debt level, time horizon, liquidity needs, tax treatment, and account rules can change the right next step.'
  )}`
}

function ensureKeyTakeaways(html: any, keyword: string) {
  const safeHtml = safeString(html)

  if (/<h2[^>]*>\s*key takeaways\s*<\/h2>/i.test(safeHtml) && /<ul>[\s\S]*?<\/ul>/i.test(safeHtml)) {
    return safeHtml
  }

  return `${safeHtml}\n<h2>Key Takeaways</h2>\n${list([
    'This works best when you compare costs, timing, risk, and flexibility together.',
    'A simple checklist usually beats a rushed decision based on one number.',
    'Review reliable sources and consider qualified help before making tax, legal, investing, or major borrowing decisions.',
  ])}`
}

function ensureInternalLinks(html: any, links: Array<{ title: string; href: string }>) {
  const safeHtml = safeString(html)

  if ((safeHtml.match(/href="\/blog/gi) || []).length >= 1) return safeHtml

  const items = links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.title)}</a></li>`)
    .join('')

  return `${safeHtml}\n<h2>Related CashClimb guides</h2>\n<p>Use these related resources to compare the next step before making a money decision.</p>\n<ul>${items}</ul>`
}

function ensureFAQ(html: any, keyword: string) {
  const safeHtml = safeString(html)

  if (/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(safeHtml)) {
    return safeHtml
  }

  return `${safeHtml}\n<h2>FAQ</h2>\n<h3>Is ${escapeHtml(keyword)} the same for everyone?</h3>\n${p(
    'No. The right choice depends on your income, timeline, account rules, location, taxes, risk tolerance, and existing obligations.'
  )}\n<h3>What should I check first?</h3>\n${p(
    'Start with cost, timing, risk, flexibility, and whether the decision affects taxes, credit, retirement accounts, or long-term cash flow.'
  )}\n<h3>When should I get professional help?</h3>\n${p(
    'Consider professional help when a decision involves investments, taxes, legal documents, large debt balances, home purchases, business income, or retirement accounts.'
  )}`
}

function ensureExamples(html: any, keyword: string) {
  const safeHtml = safeString(html)

  if (/for example|for instance|let'?s say|imagine that|suppose you/i.test(stripHtml(safeHtml))) {
    return safeHtml
  }

  return appendMissingSection(
    safeHtml,
    'Example scenario',
    `${p(
      `For example, imagine you are comparing two choices related to ${keyword}. One looks cheaper today, but the other gives you more flexibility if your income changes. The better decision is not always the lowest monthly cost. It is the option that fits your risk, timeline, cash flow, and ability to recover if something changes.`
    )}`
  )
}

function ensureConclusion(html: any, keyword: string) {
  const safeHtml = safeString(html)

  if (/what you can do next|next steps|in summary|the bottom line|final thoughts/i.test(stripHtml(safeHtml))) {
    return safeHtml
  }

  return `${safeHtml}\n<h2>What you can do next</h2>\n${p(
    `Write down the specific decision you are making about ${keyword}, gather the numbers, and compare the tradeoffs before acting. One clear, low-risk step is better than a rushed move that creates a new money problem.`
  )}`
}

function ensureDepth(html: any, keyword: string, category: Category) {
  let out = safeString(html)
  const plain = stripHtml(out)

  if (plain.split(/\s+/).filter(Boolean).length >= 900) return out

  out = appendMissingSection(
    out,
    'How to compare your options',
    [
      p(
        'A practical way to approach the decision is to compare choices side by side. Look at the immediate cost, the long-term cost, the risk if your situation changes, and the amount of flexibility you keep. A decision that looks good in one month can become expensive if fees, interest rates, taxes, or deadlines are ignored.'
      ),
      list([
        'Write down the goal before comparing products, accounts, or strategies.',
        'Separate fixed costs from variable costs so the tradeoffs are easier to see.',
        'Check whether the decision affects credit, taxes, retirement rules, or housing costs.',
        'Avoid choices that depend on perfect timing or guaranteed outcomes.',
      ]),
    ].join('\n')
  )

  out = appendMissingSection(
    out,
    'Mistakes that make this decision harder',
    [
      p(
        `Many ${category.toLowerCase()} mistakes come from moving too fast. A reader may focus on one benefit and miss the fee, risk, deadline, or tax treatment attached to it. Slow comparison protects readers from turning a useful idea into a costly commitment.`
      ),
      list([
        'Only comparing monthly payments instead of total cost.',
        'Ignoring how the decision changes if income drops or expenses rise.',
        'Following generic advice that does not match the reader’s timeline.',
        'Skipping the fine print on fees, limits, taxes, or withdrawal rules.',
      ]),
    ].join('\n')
  )

  out = appendMissingSection(
    out,
    'Sources and facts to verify',
    p(
      'Before publishing, verify any current rates, contribution limits, tax thresholds, government rules, or market statistics with official sources. This keeps the article useful for readers and reduces the risk of stale claims.'
    )
  )

  return out
}

function ensureH2Structure(html: any, keyword: string) {
  const safeHtml = safeString(html)
  const count = (safeHtml.match(/<h2\b/gi) || []).length

  if (count >= 4) return safeHtml

  let out = safeHtml

  out = appendMissingSection(
    out,
    'What this means',
    p('The decision is easier to evaluate when you separate the goal, the cost, the timing, and the risks.')
  )

  out = appendMissingSection(
    out,
    'A simple checklist',
    list(['Define the goal.', 'Gather the numbers.', 'Compare the tradeoffs.', 'Choose one low-risk next step.'])
  )

  out = appendMissingSection(
    out,
    'Common mistakes',
    list(['Rushing the decision.', 'Ignoring fees.', 'Assuming the outcome is guaranteed.'])
  )

  out = appendMissingSection(
    out,
    'Next steps',
    p('Use the checklist, verify current rules, and pause before making any large financial commitment.')
  )

  return out
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

  const { data, error } = await supabase
    .from('posts')
    .update(update)
    .eq('id', postId)
    .select('*')
    .single()

  if (!error) return data

  const fallback: Record<string, any> = {
    title: update.title,
    excerpt: update.excerpt,
    body: update.body,
    cover_url: update.cover_url,
    read_time: update.read_time,
    seo_title: update.seo_title,
    seo_description: update.seo_description,
    quality_score: update.quality_score,
    risk_level: update.risk_level,
    status: update.status,
    review_notes: update.review_notes,
  }

  Object.keys(fallback).forEach((key) => {
    if (fallback[key] === undefined) delete fallback[key]
  })

  const retry = await supabase
    .from('posts')
    .update(fallback)
    .eq('id', postId)
    .select('*')
    .single()

  if (retry.error) throw retry.error

  return retry.data
}

export async function fixPostSeoIssues(postId: string): Promise<FixResult> {
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) throw error
  if (!post) throw new Error('Post not found.')

  const category = categoryFromPost(post)
  const keyword = primaryKeyword(post)
  const existingBody = post.body || post.content || ''

  const before = evaluateFinanceArticle({
    title: post.title || '',
    excerpt: post.excerpt || '',
    body: existingBody,
    primaryKeyword: keyword,
    category,
    seoTitle: post.seo_title || post.title || '',
    seoDescription: post.seo_description || post.excerpt || '',
    coverUrl: null,
  })

  const failedBefore = before.checks
    .filter((check) => !check.passed)
    .map((check) => check.name)

  const links = await relatedLinks(postId, category)
  const fixesApplied: string[] = []

  const normalizedKeyword = normalizeTargetKeyword(keyword)
  let title = buildSeoArticleTitle(post.title || normalizedKeyword)
  let excerpt = buildExcerpt(normalizedKeyword, category)
  let seoTitle = buildSeoMetaTitle(post.seo_title || title)
  let seoDescription = buildSeoDescription(normalizedKeyword, category)

  let body = safeString(existingBody)

  body = removeBadLanguage(body)
  body = ensureOpeningKeyword(body, keyword)
  body = ensureDisclaimer(body, category)
  body = ensureQuickAnswer(body, keyword)
  body = ensureKeyTakeaways(body, keyword)
  body = ensureDecisionChecklist(body)
  body = ensureRiskTradeoffs(body)
  body = ensureH2Structure(body, keyword)
  body = ensureExamples(body, keyword)
  body = ensureDepth(body, keyword, category)
  body = ensureInternalLinks(body, links)
  body = ensureFAQ(body, keyword)
  body = ensureConclusion(body, keyword)

  const coverUrl = null
  const readTime = readingTime(stripHtml(body)).text

  const after = evaluateFinanceArticle({
    title,
    excerpt,
    body,
    primaryKeyword: keyword,
    category,
    seoTitle,
    seoDescription,
    coverUrl,
  })

  for (const name of failedBefore) {
    const afterCheck = after.checks.find((check) => check.name === name)
    if (afterCheck?.passed) fixesApplied.push(name)
  }

  const unresolved = after.checks
    .filter((check) => !check.passed)
    .map((check) => check.name)

  const nextStatus = nextStatusFromEvaluation(after)

  const updatedPost = await safeUpdatePost(postId, {
    title,
    excerpt,
    body,
    cover_url: null,
    read_time: readTime,
    seo_title: seoTitle,
    seo_description: seoDescription,
    quality_score: after.score,
    risk_level: after.risk_level,
    status: nextStatus,
    review_notes: unresolved.length
      ? `Auto-fixed ${fixesApplied.length} issue(s). Still needs review: ${unresolved.join(', ')}.`
      : `Auto-fixed SEO issues. Score ${after.score}.`,
    workflow_meta: {
      ...(post.workflow_meta || {}),
      lastSeoAutofixAt: new Date().toISOString(),
      fixesApplied,
      unresolved,
    },
  })

  await updateQualityCheck(postId, after)

  return {
    post: updatedPost,
    before,
    after,
    fixesApplied,
    unresolved,
  }
}
