import type { Category, WorkflowCheck } from '@/types'

type EditablePost = {
  id: string
  title: string
  excerpt: string
  body: string
  category: string | null
  seo_title: string | null
  seo_description: string | null
  primary_keyword: string | null
  cover_url: string | null
  author: string | null
}

type RewrittenPost = {
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  contentHtml: string
  author: string
}

type RelatedLink = {
  title: string
  slug: string
}

const AUTHOR_NAME = 'Daniel Reeves'

const TOOL_BLOCKS: Record<string, string[]> = {
  'Personal Finance': [
    'A simple budgeting app or spreadsheet template to track cash flow.',
    'A high-yield savings account for short-term goals and emergency funds.',
    'A bill calendar or autopay system to avoid missed due dates.',
  ],
  Credit: [
    'A free credit monitoring service to watch score changes and alerts.',
    'A debt payoff tracker that compares avalanche and snowball plans.',
    'A balance transfer or consolidation comparison page, if it fits your situation.',
  ],
  Investing: [
    'A low-cost brokerage with clear fees and strong account protections.',
    'An IRA or workplace retirement account contribution tracker.',
    'A rebalancing checklist so your allocation stays aligned with your plan.',
  ],
  Retirement: [
    'A retirement projection calculator to test contribution scenarios.',
    'A rollover checklist for old workplace plans and IRAs.',
    'A beneficiary and account review checklist for yearly maintenance.',
  ],
  Taxes: [
    'A document checklist so you are ready before filing season starts.',
    'A withholding estimator or tax payment tracker for variable income.',
    'A secure receipt and deduction folder for year-round record keeping.',
  ],
  'Real Estate': [
    'A mortgage affordability calculator that includes taxes and insurance.',
    'A closing-cost worksheet so the full cash requirement is visible early.',
    'A home maintenance sinking-fund tracker for recurring ownership costs.',
  ],
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function sanitizeTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim()
}

function trimToLength(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`
}

function words(text: string) {
  return stripHtml(text).split(/\s+/).filter(Boolean).length
}

export function buildToolBlock(category: string | null | undefined) {
  const items = TOOL_BLOCKS[category || ''] ?? TOOL_BLOCKS['Personal Finance']
  const list = items.map((item) => `<li>${item}</li>`).join('')
  return `\n<h2>Tools and accounts that can help</h2>\n<p>The right tool will not solve the whole problem for you, but it can make the next step easier. Compare costs, safety, features, and account rules before you commit.</p>\n<ul>${list}</ul>\n<p><em>Editorial note: this section is educational and is meant to help you compare categories of tools or accounts, not to push a specific provider.</em></p>\n`
}

function buildRelatedLinksBlock(relatedLinks: RelatedLink[]) {
  if (!relatedLinks.length) return ''
  const items = relatedLinks
    .slice(0, 3)
    .map((link) => `<li><a href="/blog/${link.slug}">${link.title}</a></li>`)
    .join('')
  return `\n<h2>Related guides to read next</h2>\n<p>If you want to go one step deeper after this article, these related guides can help you compare options and turn the advice into a plan.</p>\n<ul>${items}</ul>\n`
}

export function insertToolBlock(contentHtml: string, category: string | null | undefined) {
  if (/tools and accounts that can help|tools that can help/i.test(contentHtml)) return contentHtml
  const block = buildToolBlock(category)
  if (/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(contentHtml)) {
    return contentHtml.replace(/(<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>)/i, `${block}$1`)
  }
  if (/<h2[^>]*>\s*(what you can do next|final thoughts|the bottom line)\s*<\/h2>/i.test(contentHtml)) {
    return contentHtml.replace(/(<h2[^>]*>\s*(what you can do next|final thoughts|the bottom line)\s*<\/h2>)/i, `${block}$1`)
  }
  return `${contentHtml.trim()}${block}`
}

function ensureFaqBlock(html: string, title: string, keyword?: string | null) {
  if (/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(html)) return html
  const topic = keyword?.trim() || title.toLowerCase()
  return `${html.trim()}\n<h2>FAQ</h2>\n<h3>What should you look at first?</h3>\n<p>Start with the one number or decision that changes the rest of the picture. In most cases, that means reviewing the cost, timing, and tradeoffs around ${topic} before you do anything else.</p>\n<h3>How can you avoid common mistakes?</h3>\n<p>Slow down enough to compare fees, deadlines, and account rules. Many expensive mistakes happen when people move too fast and skip the details.</p>\n<h3>What is the next practical step?</h3>\n<p>Pick one action you can complete this week, then revisit the article after you have real numbers in front of you.</p>`
}

function ensureTakeaways(html: string, keyword?: string | null) {
  if (/<h2[^>]*>\s*key takeaways\s*<\/h2>/i.test(html)) return html
  const topic = keyword?.trim() || 'this topic'
  const block = `<h2>Key Takeaways</h2><ul><li>Know the main tradeoff before you act on ${topic}.</li><li>Compare timing, fees, and account rules before making a move.</li><li>Use a simple next step so the advice becomes practical.</li></ul>`
  const firstH2 = html.match(/<h2\b/i)
  if (firstH2) {
    return html.replace(/<h2\b/i, `${block}<h2`)
  }
  return `${block}${html}`
}

function ensureExample(html: string, keyword?: string | null) {
  if (/for example|for instance|let'?s say|imagine that|suppose you/i.test(stripHtml(html))) return html
  const topic = keyword?.trim() || 'this situation'
  return html.replace(/(<h2[^>]*>[^<]+<\/h2>\s*<p>)/i, `$1For example, if you compare two choices around ${topic}, a small difference in timing, fees, or interest can change the outcome more than people expect. `)
}

function ensureConclusion(html: string) {
  if (/<h2[^>]*>\s*(what you can do next|final thoughts|the bottom line|next steps)\s*<\/h2>/i.test(html)) return html
  return `${html.trim()}\n<h2>What you can do next</h2>\n<p>Choose one action from this guide and do it this week. A clear next step is usually more valuable than trying to solve the whole problem in one sitting.</p>`
}

function ensureDisclaimer(html: string, category: string | null | undefined) {
  const needsDisclaimer = ['Taxes', 'Investing', 'Retirement', 'Real Estate'].includes(category ?? '')
  if (!needsDisclaimer) return html
  if (/not financial advice|general information|educational purposes/i.test(stripHtml(html))) return html
  return `<p><em>This article is for general educational purposes and is not personal financial, tax, or legal advice.</em></p>${html}`
}

function ensureInternalLinks(html: string, relatedLinks: RelatedLink[]) {
  const existing = (html.match(/href="\/blog\//gi) || []).length
  if (existing >= 1 || !relatedLinks.length) return html
  const block = buildRelatedLinksBlock(relatedLinks)
  if (/<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>/i.test(html)) {
    return html.replace(/(<h2[^>]*>\s*(faq|frequently asked questions)\s*<\/h2>)/i, `${block}$1`)
  }
  return `${html.trim()}${block}`
}

function ensureDepth(html: string, keyword?: string | null) {
  if (words(html) >= 900) return html
  const topic = keyword?.trim() || 'this decision'
  return `${html.trim()}\n<h2>Common mistakes to avoid</h2>\n<p>One of the biggest mistakes with ${topic} is making a decision before you understand the tradeoffs. Another is focusing on one number while ignoring timing, fees, account rules, or the impact on the rest of your plan.</p>\n<p>It also helps to revisit the decision after you have real numbers. The article becomes much more useful once you apply it to your own cash flow, deadlines, and priorities.</p>`
}

function titleCaseKeyword(keyword: string) {
  return keyword
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ensureKeywordInTitle(title: string, keyword?: string | null) {
  const cleanTitle = sanitizeTitle(title || '')
  const cleanKeyword = keyword?.trim()
  if (!cleanKeyword) return cleanTitle || 'Finance guide'
  if (cleanTitle.toLowerCase().includes(cleanKeyword.toLowerCase())) {
    return cleanTitle
  }

  const keywordTitle = titleCaseKeyword(cleanKeyword)
  const candidate = `${keywordTitle}: ${cleanTitle || 'Practical guide'}`
  return trimToLength(candidate, 70)
}

function ensureKeywordPlacement(html: string, keyword?: string | null) {
  const cleanKeyword = keyword?.trim()
  if (!cleanKeyword) return html
  const plain = stripHtml(html).toLowerCase()
  if (plain.slice(0, 650).includes(cleanKeyword.toLowerCase())) {
    return html
  }

  const introSentence = `This guide explains ${cleanKeyword} in plain language so you can compare the tradeoffs, avoid common mistakes, and decide on a practical next step.`
  if (/<p>/i.test(html)) {
    return html.replace(/<p>/i, `<p>${introSentence} `)
  }
  return `<p>${introSentence}</p>${html}`
}

function softenFlaggedLanguage(html: string) {
  return html
    .replace(/\bfree money\b/gi, 'a high-value workplace benefit')
    .replace(/\bthis should be priority one\b/gi, 'for many readers, this is often a sensible place to start')
    .replace(/\bshould be your first priority\b/gi, 'is often a sensible early priority')
    .replace(/\byou should\b/gi, 'many readers choose to')
    .replace(/\bwe recommend\b/gi, 'one common approach is to')
    .replace(/\bthe best investment\b/gi, 'one option some investors compare')
    .replace(/\bguaranteed returns?\b/gi, 'predictable outcomes')
    .replace(/\brisk-free returns?\b/gi, 'lower-risk outcomes')
    .replace(/\bsurefire\b/gi, 'potential')
    .replace(/\bfavor\b/gi, 'lean toward')
    .replace(/\bprioritize\b/gi, 'start with')
}

function strengthenMetadata(post: EditablePost, contentHtml: string, titleOverride?: string) {
  const baseTitle = ensureKeywordInTitle(titleOverride || post.title || post.primary_keyword || 'Finance guide', post.primary_keyword)
  const seoTitle = post.seo_title?.trim()
    ? trimToLength(ensureKeywordInTitle(post.seo_title.trim(), post.primary_keyword), 65)
    : trimToLength(baseTitle.length < 40 ? `${baseTitle} | CashClimb Guide` : baseTitle, 65)

  let excerpt = post.excerpt?.trim() || ''
  if (!excerpt) {
    excerpt = trimToLength(stripHtml(contentHtml), 155)
  }
  if (post.primary_keyword && !excerpt.toLowerCase().includes(post.primary_keyword.toLowerCase())) {
    excerpt = trimToLength(`${post.primary_keyword} explained in a practical, beginner-friendly way. ${excerpt}`, 155)
  }

  let seoDescription = post.seo_description?.trim() || ''
  if (!seoDescription) {
    seoDescription = excerpt || trimToLength(stripHtml(contentHtml), 155)
  }
  if (post.primary_keyword && !seoDescription.toLowerCase().includes(post.primary_keyword.toLowerCase())) {
    seoDescription = `${post.primary_keyword} explained with practical steps, tradeoffs, and common mistakes to avoid.`
  }
  seoDescription = trimToLength(seoDescription, 160)
  if (seoDescription.length < 120) {
    seoDescription = trimToLength(`${seoDescription} Learn the main tradeoffs, practical steps, and common mistakes to avoid.`, 160)
  }

  return {
    title: baseTitle,
    excerpt: excerpt || trimToLength(stripHtml(contentHtml), 155),
    seoTitle,
    seoDescription,
  }
}

function fallbackHumanize(contentHtml: string, category: string | null | undefined) {
  let html = contentHtml
    .replace(/\bWhen it comes to\b/gi, 'For')
    .replace(/\bIn today's world\b/gi, 'Right now')
    .replace(/\bIt is important to note that\b/gi, 'Keep in mind that')
    .replace(/\bIn conclusion,?\b/gi, 'In short,')
    .replace(/\bdelve into\b/gi, 'look at')

  if (!/for example|for instance|let's say|imagine that/i.test(stripHtml(html))) {
    html = html.replace(/(<h2[^>]*>[^<]+<\/h2>\s*<p>)/i, `$1For example, a small change in timing, fees, or interest can make a bigger difference than most readers expect. `)
  }

  html = insertToolBlock(html, category)

  if (!/<h2[^>]*>\s*(what you can do next|final thoughts|the bottom line)\s*<\/h2>/i.test(html)) {
    html += '\n<h2>What you can do next</h2>\n<p>Pick one action from this guide and do it this week. Small, repeatable progress is usually more useful than trying to fix everything at once.</p>'
  }

  return html
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 45000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function openaiJsonRewrite<T>(prompt: string, timeoutMs = 45000, retries = 1) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  let attempt = 0
  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(
        'https://api.openai.com/v1/responses',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-5-mini',
            input: prompt,
            text: { format: { type: 'json_object' } },
          }),
        },
        timeoutMs
      )

      if (!response.ok) {
        if (attempt === retries) return null
      } else {
        const data = await response.json()
        const text = data.output_text || data.output?.[0]?.content?.[0]?.text || '{}'
        try {
          return JSON.parse(text) as T
        } catch {
          if (attempt === retries) return null
        }
      }
    } catch {
      if (attempt === retries) return null
    }

    attempt += 1
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
  }

  return null
}

type TargetedImproveResult = {
  title?: string
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  openingParagraph?: string
  replacements?: Array<{ original: string; revised: string }>
}

function humanizePrompt(post: EditablePost) {
  return `You are a senior finance editor polishing an article for CashClimb.
Return ONLY valid JSON with this shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "contentHtml": "string",
  "author": "Daniel Reeves"
}

Goals:
- Keep the same factual meaning and overall structure.
- Remove robotic filler and generic AI phrasing.
- Vary sentence rhythm and use more natural transitions.
- Keep or improve practical examples.
- Keep the tone educational, confident, and grounded.
- Preserve any internal links.
- Add or improve one useful tools/accounts section for monetization-ready editorial structure.
- Do not make personalized tax, legal, or financial recommendations.
- Return valid HTML only in contentHtml.

Current article:
TITLE: ${post.title}
EXCERPT: ${post.excerpt}
SEO TITLE: ${post.seo_title || post.title}
SEO DESCRIPTION: ${post.seo_description || post.excerpt}
PRIMARY KEYWORD: ${post.primary_keyword || ''}
CATEGORY: ${post.category || ''}
CONTENT HTML:
${post.body}`
}

function refreshPrompt(post: EditablePost) {
  return `You are updating an older finance article for CashClimb so it feels fresh, useful, and editorial.
Return ONLY valid JSON with this shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "contentHtml": "string",
  "author": "Daniel Reeves"
}

Goals:
- Keep the same core topic and search intent.
- Refresh intros, transitions, and section framing so the piece feels current.
- Tighten weak sections and remove repetition.
- Preserve or improve internal links.
- Add or improve one tools/accounts section for comparison intent and monetization readiness.
- Preserve disclaimers where appropriate.
- Do not invent new statistics or unverifiable facts.
- Return valid HTML only in contentHtml.

Current article:
TITLE: ${post.title}
EXCERPT: ${post.excerpt}
SEO TITLE: ${post.seo_title || post.title}
SEO DESCRIPTION: ${post.seo_description || post.excerpt}
PRIMARY KEYWORD: ${post.primary_keyword || ''}
CATEGORY: ${post.category || ''}
CONTENT HTML:
${post.body}`
}

function paragraphMatchesFlag(paragraph: string, failedChecks: WorkflowCheck[]) {
  const text = stripHtml(paragraph).toLowerCase()
  if (!text) return false
  if (/free money|guaranteed|risk-free|priority one|you should|we recommend|best investment|surefire|favor\b|prioritize\b/.test(text)) {
    return true
  }
  return failedChecks.some((check) => {
    const details = (check.details || '').toLowerCase()
    return details && text.includes(details.slice(0, 40))
  })
}

function extractTargetedSegments(post: EditablePost, failedChecks: WorkflowCheck[]) {
  const paragraphs = post.body.match(/<p>[\s\S]*?<\/p>/gi) || []
  const openingParagraph = paragraphs[0] || ''
  const flaggedParagraphs = paragraphs.filter((paragraph) => paragraphMatchesFlag(paragraph, failedChecks)).slice(0, 4)
  return { openingParagraph, flaggedParagraphs }
}

function targetedImprovePrompt(post: EditablePost, failedChecks: WorkflowCheck[], relatedLinks: RelatedLink[]) {
  const failedSummary = failedChecks.map((check) => `- ${check.name}: ${check.details}`).join('\n')
  const relatedSummary = relatedLinks.map((link) => `- ${link.title} (/blog/${link.slug})`).join('\n') || '- none available'
  const { openingParagraph, flaggedParagraphs } = extractTargetedSegments(post, failedChecks)
  const flaggedSummary = flaggedParagraphs.length ? flaggedParagraphs.join('\n\n') : '(none extracted)'

  return `You are a senior finance editor making a targeted revision.
Return ONLY valid JSON with this shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "openingParagraph": "<p>...</p>",
  "replacements": [{ "original": "<p>...</p>", "revised": "<p>...</p>" }]
}

Rules:
- Rewrite ONLY the opening paragraph and the flagged paragraphs provided below.
- Keep the topic and factual meaning intact.
- Remove advisory, guaranteed-return, or overly prescriptive language.
- Make the primary keyword appear naturally in the title and opening paragraph.
- Do not rewrite the full article.
- Keep HTML valid.
- If a field does not need changes, still return a safe improved value.

Failed checks:
${failedSummary}

Primary keyword: ${post.primary_keyword || ''}
Category: ${post.category || ''}
Current title: ${post.title}
Current excerpt: ${post.excerpt}
Current SEO title: ${post.seo_title || post.title}
Current SEO description: ${post.seo_description || post.excerpt}
Available internal links:
${relatedSummary}

Opening paragraph to improve:
${openingParagraph || '(none found)'}

Flagged paragraphs to rewrite:
${flaggedSummary}`
}

function replaceParagraphs(html: string, replacements: Array<{ original: string; revised: string }> | undefined) {
  if (!replacements?.length) return html
  let next = html
  for (const pair of replacements) {
    const original = pair.original?.trim()
    const revised = pair.revised?.trim()
    if (!original || !revised) continue
    next = next.replace(original, revised)
  }
  return next
}

function replaceOpeningParagraph(html: string, openingParagraph?: string) {
  if (!openingParagraph?.trim()) return html
  return html.replace(/<p>[\s\S]*?<\/p>/i, openingParagraph.trim())
}

export async function humanizeExistingPost(post: EditablePost): Promise<RewrittenPost> {
  const parsed = await openaiJsonRewrite<Partial<RewrittenPost>>(humanizePrompt(post), 45000, 1)
  const contentHtml = insertToolBlock(parsed?.contentHtml?.trim() || fallbackHumanize(post.body, post.category), post.category)
  return {
    title: parsed?.title?.trim() || post.title,
    excerpt: parsed?.excerpt?.trim() || post.excerpt,
    seoTitle: parsed?.seoTitle?.trim() || post.seo_title || post.title,
    seoDescription: parsed?.seoDescription?.trim() || post.seo_description || post.excerpt,
    contentHtml,
    author: parsed?.author?.trim() || post.author || AUTHOR_NAME,
  }
}

export async function refreshExistingPost(post: EditablePost): Promise<RewrittenPost> {
  const parsed = await openaiJsonRewrite<Partial<RewrittenPost>>(refreshPrompt(post), 45000, 1)
  let contentHtml = parsed?.contentHtml?.trim() || fallbackHumanize(post.body, post.category)
  if (!/last updated|reviewed for clarity|editorial refresh/i.test(contentHtml)) {
    contentHtml = `<p><em>Last updated for clarity and usability.</em></p>${contentHtml}`
  }
  contentHtml = insertToolBlock(contentHtml, post.category)
  return {
    title: parsed?.title?.trim() || post.title,
    excerpt: parsed?.excerpt?.trim() || post.excerpt,
    seoTitle: parsed?.seoTitle?.trim() || post.seo_title || post.title,
    seoDescription: parsed?.seoDescription?.trim() || post.seo_description || post.excerpt,
    contentHtml,
    author: parsed?.author?.trim() || post.author || AUTHOR_NAME,
  }
}

export async function improveFailedChecks(
  post: EditablePost,
  failedChecks: WorkflowCheck[],
  relatedLinks: RelatedLink[] = []
): Promise<RewrittenPost> {
  const parsed = failedChecks.length
    ? await openaiJsonRewrite<TargetedImproveResult>(targetedImprovePrompt(post, failedChecks, relatedLinks), 30000, 2)
    : null

  let contentHtml = post.body
  contentHtml = replaceOpeningParagraph(contentHtml, parsed?.openingParagraph)
  contentHtml = replaceParagraphs(contentHtml, parsed?.replacements)
  contentHtml = softenFlaggedLanguage(contentHtml)
  contentHtml = fallbackHumanize(contentHtml, post.category)
  contentHtml = ensureDisclaimer(contentHtml, post.category)
  contentHtml = ensureTakeaways(contentHtml, post.primary_keyword)
  contentHtml = ensureKeywordPlacement(contentHtml, post.primary_keyword)
  contentHtml = ensureExample(contentHtml, post.primary_keyword)
  contentHtml = ensureInternalLinks(contentHtml, relatedLinks)
  contentHtml = ensureDepth(contentHtml, post.primary_keyword)
  contentHtml = ensureFaqBlock(contentHtml, post.title, post.primary_keyword)
  contentHtml = ensureConclusion(contentHtml)
  contentHtml = insertToolBlock(contentHtml, post.category)
  contentHtml = softenFlaggedLanguage(contentHtml)

  const metadata = strengthenMetadata(post, contentHtml, parsed?.title?.trim() || post.title)

  return {
    title: metadata.title,
    excerpt: parsed?.excerpt?.trim() || metadata.excerpt,
    seoTitle: parsed?.seoTitle?.trim() || metadata.seoTitle,
    seoDescription: parsed?.seoDescription?.trim() || metadata.seoDescription,
    contentHtml,
    author: post.author || AUTHOR_NAME,
  }
}
