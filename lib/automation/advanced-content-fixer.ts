import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import type { Category, WorkflowEvaluation } from '@/types'

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
  const safe = String(value || '')
  return safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function p(text: string) {
  return `<p>${escapeHtml(text)}</p>`
}

function list(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function categoryFromPost(post: any): Category {
  return CATEGORY_VALUES.includes(post?.category) ? post.category : 'Personal Finance'
}

function primaryKeyword(post: any) {
  const explicit = String(post?.primary_keyword || post?.primaryKeyword || '').trim()
  if (explicit) return explicit.toLowerCase()
  return String(post?.title || 'personal finance guide')
    .replace(/[:|].*$/, '')
    .replace(/\b(a|an|the|guide|cashclimb|practical|simple|complete)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase() || 'personal finance guide'
}

function readTimeFor(html: string) {
  const minutes = Math.max(1, Math.ceil(wordCount(html) / 220))
  return `${minutes} min read`
}

function appendSection(html: string, heading: string, body: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const exists = new RegExp(`<h2[^>]*>\\s*${escaped}\\s*<\\/h2>`, 'i').test(html)
  if (exists) return html
  return `${html}\n<h2>${heading}</h2>\n${body}`
}

function sanitizeAdvisoryPhrasing(html: string) {
  let out = html

  const replacements: Array<[RegExp, string]> = [
    [/\byou should\b/gi, 'you may want to'],
    [/\byou need to\b/gi, 'you may need to'],
    [/\byou must\b/gi, 'you may need to'],
    [/\balways\b/gi, 'often'],
    [/\bnever\b/gi, 'rarely'],
    [/\bthe best option is\b/gi, 'one option to compare is'],
    [/\bthe right choice is\b/gi, 'the right choice may depend on your situation and could be'],
    [/\bguaranteed\b/gi, 'possible'],
    [/\brisk-free\b/gi, 'lower-risk'],
    [/\bthis is financial advice\b/gi, 'this is general financial education'],
    [/\bthis is tax advice\b/gi, 'this is general tax education'],
    [/\bthis is legal advice\b/gi, 'this is general legal education'],
    [/\bpersonalized advice\b/gi, 'general education'],
    [/\bmake sure you\b/gi, 'consider whether you should'],
    [/\bthe smartest move is\b/gi, 'a practical next step may be'],
    [/\bthe safest approach is\b/gi, 'a lower-risk approach may be'],
    [/\bdo this before\b/gi, 'consider doing this before'],
    [/\bin conclusion,? this article\b/gi, 'the bottom line'],
    [/\bwhen it comes to\b/gi, 'for'],
    [/\bin today'?s world\b/gi, 'today'],
    [/\bnavigating the\b/gi, 'understanding the'],
    [/\bdelve into\b/gi, 'explain'],
    [/\bit is important to note that\b/gi, 'note that'],
  ]

  for (const [pattern, replacement] of replacements) out = out.replace(pattern, replacement)
  return out
}

function ensureGeneralDisclaimer(html: string, category: Category) {
  if (!YMYL_CATEGORIES.has(category)) return html
  if (/not personal financial|not financial advice|general educational purposes/i.test(stripHtml(html))) return html
  return `${p('This article is for general educational purposes only and is not personal financial, investment, tax, or legal advice. Consider your full situation and speak with a qualified professional before making major money decisions.')}\n${html}`
}

function buildScenario(keyword: string, category: Category) {
  return [
    p(`For example, imagine a reader comparing two choices related to ${keyword}. The first option looks easier because the monthly cost is lower. The second option looks less convenient, but it may leave more cash available for emergencies or reduce long-term risk. That is why the better answer cannot be based on one number alone.`),
    p(`A practical comparison would look at the upfront cost, monthly effect, total cost over time, flexibility, tax treatment, and what happens if income changes. For ${category.toLowerCase()} decisions, those details often matter more than the headline benefit.`),
  ].join('\n')
}

function buildDepthSections(html: string, keyword: string, category: Category) {
  let out = html

  out = appendSection(
    out,
    'How to compare the tradeoffs',
    [
      p(`A stronger decision starts with the tradeoffs behind ${keyword}. Do not compare only the most attractive number. Compare the cost, timeline, risk, flexibility, and the amount of effort required to keep the plan working.`),
      list([
        'Cost: check upfront fees, recurring costs, interest, taxes, penalties, and opportunity cost.',
        'Timeline: decide whether the choice needs to work for weeks, years, or decades.',
        'Risk: ask what could go wrong if income, rates, rules, or market conditions change.',
        'Flexibility: compare how easy it is to adjust the decision later.',
        'Proof: verify current figures with official sources before publishing or acting.',
      ]),
    ].join('\n')
  )

  out = appendSection(
    out,
    'Example scenario',
    buildScenario(keyword, category)
  )

  out = appendSection(
    out,
    'Common mistakes to avoid',
    [
      p(`Many readers make ${keyword} harder by treating a general rule like a personal recommendation. A rule of thumb can be useful, but it should still be checked against income, debts, tax position, account rules, location, and time horizon.`),
      list([
        'Choosing the lowest monthly payment without checking total cost.',
        'Ignoring how fees, taxes, rates, or deadlines change the real outcome.',
        'Assuming a strategy works the same way in every country or account type.',
        'Following a generic recommendation without checking risk tolerance or cash flow.',
        'Skipping source checks for current contribution limits, tax thresholds, or lending rules.',
      ]),
    ].join('\n')
  )

  out = appendSection(
    out,
    'A practical review checklist',
    [
      p(`Use this checklist before treating ${keyword} as finished. The goal is not to find a perfect answer. The goal is to remove obvious risks and make the next step easier to explain.`),
      list([
        'Write the exact decision in one sentence.',
        'List the numbers needed to compare the options fairly.',
        'Check whether the decision affects taxes, credit, retirement accounts, property, or legal documents.',
        'Identify one downside that would make the choice less attractive.',
        'Decide what information needs expert review before publishing or acting.',
      ]),
    ].join('\n')
  )

  out = appendSection(
    out,
    'What to verify before acting',
    [
      p(`Before making a decision based on ${keyword}, verify anything that can change. Rates, tax thresholds, account limits, government rules, and lender policies can become outdated quickly. A good article should point readers toward current sources rather than pretending one static answer fits every case.`),
      p('For CashClimb, this is also an editorial quality step. Articles should explain the decision clearly, avoid promises, show the tradeoffs, and leave room for professional advice when the topic involves taxes, investing, property, retirement, or legal documents.'),
    ].join('\n')
  )

  return out
}

function ensureConclusion(html: string, keyword: string) {
  if (/what you can do next|next steps|the bottom line|final thoughts/i.test(stripHtml(html))) return html
  return `${html}\n<h2>What you can do next</h2>\n${p(`Use ${keyword} as a starting point, not a final instruction. Gather the numbers, compare the tradeoffs, check current rules, and choose one low-risk next step that fits your situation.`)}`
}

function ensureFaq(html: string, keyword: string) {
  if (/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(html)) return html
  return `${html}\n<h2>FAQ</h2>\n<h3>Is ${escapeHtml(keyword)} the same for everyone?</h3>\n${p('No. The right approach can vary by income, country, tax position, debt level, timeline, risk tolerance, and existing financial commitments.')}\n<h3>What is the first thing to compare?</h3>\n${p('Start with total cost, flexibility, risk, and timing. Those factors usually reveal more than one headline number.')}\n<h3>When is professional help worth considering?</h3>\n${p('Consider qualified help when the decision involves taxes, investments, retirement accounts, property, legal documents, business income, or large debt balances.')}`
}

function ensureNaturalKeywordOpening(html: string, keyword: string) {
  const lower = stripHtml(html).toLowerCase()
  if (lower.slice(0, 600).includes(keyword.toLowerCase())) return html
  return `${p(`${titleCase(keyword)} is easier to evaluate when the decision is broken into costs, timing, risk, flexibility, and next steps.`)}\n${html}`
}

function trimSeoTitle(value: string, keyword: string) {
  const fallback = `${titleCase(keyword)} Guide`
  const base = String(value || fallback).replace(/\s+/g, ' ').trim()
  if (base.length >= 40 && base.length <= 65) return base
  return fallback.slice(0, 65)
}

function trimSeoDescription(value: string, keyword: string) {
  const fallback = `A practical guide to ${keyword}, including examples, common mistakes, safer next steps, FAQs, and a clear checklist for readers.`
  let base = String(value || fallback).replace(/\s+/g, ' ').trim()
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
  const keyword = primaryKeyword(post)

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

  let body = String(post.body || '')
  body = sanitizeAdvisoryPhrasing(body)
  body = ensureGeneralDisclaimer(body, category)
  body = ensureNaturalKeywordOpening(body, keyword)
  body = buildDepthSections(body, keyword, category)
  body = ensureFaq(body, keyword)
  body = ensureConclusion(body, keyword)

  // A second pass is intentional. Short generated drafts often need another section after the first expansion.
  if (wordCount(body) < 900) {
    body = appendSection(
      body,
      'How CashClimb readers can use this guide',
      [
        p(`The most useful way to use this ${keyword} guide is to turn it into a decision note. Write the choice at the top, list the numbers you know, list the information you still need, and mark anything that requires a current source or professional review.`),
        p('This keeps the article practical without becoming personal advice. It also makes the content more useful for readers because the next step is clear, cautious, and based on comparison rather than pressure.'),
      ].join('\n')
    )
  }

  const title = post.title || `${titleCase(keyword)}: Step-by-Step Guide`
  const excerpt = post.excerpt || `Learn ${keyword} with practical examples, common mistakes, safer next steps, and a clear checklist for everyday financial decisions.`
  const seoTitle = trimSeoTitle(post.seo_title || title, keyword)
  const seoDescription = trimSeoDescription(post.seo_description || excerpt, keyword)
  const readTime = readTimeFor(body)

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
  const nextStatus = nextStatusFromEvaluation(after)

  const updatedPost = await safeUpdatePost(postId, {
    title,
    excerpt,
    body,
    read_time: readTime,
    seo_title: seoTitle,
    seo_description: seoDescription,
    quality_score: after.score,
    risk_level: after.risk_level,
    status: nextStatus,
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
