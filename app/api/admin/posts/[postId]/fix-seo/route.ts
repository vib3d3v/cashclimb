import { NextResponse } from 'next/server'
import readingTime from 'reading-time'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'
import { cleanupExternalLinks } from '@/lib/normalize-links'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function clean(value: any = '') {
  return String(value || '').trim()
}

function stripHtml(value: any = '') {
  return clean(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordCount(value: any = '') {
  return stripHtml(value).split(/\s+/).filter(Boolean).length
}

function titleCase(value: any = '') {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.length <= 3
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ')
}

function trimTo(value: any = '', max = 160) {
  const text = clean(value)
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '').trim()
}

function removeGenericSuffix(value: any = '') {
  return clean(value)
    .replace(/:\s*A Practical CashClimb Guide$/i, '')
    .replace(/\s*A Practical CashClimb Guide$/i, '')
    .replace(/:\s*$/g, '')
    .trim()
}

function fixTitle(post: any) {
  const keyword = clean(post.primary_keyword || post.title || 'personal finance guide')
  let title = removeGenericSuffix(post.title)

  if (!title || title.length < 35) {
    title = `${titleCase(keyword)}: Step-by-Step Guide`
  }

  if (keyword && !title.toLowerCase().includes(keyword.toLowerCase())) {
    title = `${titleCase(keyword)}: ${title}`
  }

  return trimTo(removeGenericSuffix(title), 70)
}

function fixExcerpt(post: any, title: string) {
  const current = clean(post.excerpt)
  if (current.length >= 90 && current.length <= 180) return current

  const topic = clean(post.primary_keyword || title).toLowerCase()
  return trimTo(
    `Learn ${topic} with a clear checklist, practical examples, common mistakes, and safe next steps for everyday money decisions.`,
    180
  )
}

function fixSeoTitle(post: any, title: string) {
  const current = removeGenericSuffix(post.seo_title)
  if (current.length >= 40 && current.length <= 65) return current
  return trimTo(title, 65)
}

function fixSeoDescription(post: any, excerpt: string) {
  const current = clean(post.seo_description)
  if (current.length >= 120 && current.length <= 160) return current
  return trimTo(excerpt, 160)
}

function ensureDisclaimer(body: string) {
  if (/not personal financial|general educational purposes|not financial advice/i.test(body)) return body
  return `<p><em>This article is for general educational purposes and is not personal financial, investment, tax, or legal advice.</em></p>\n\n${body}`.trim()
}

function ensureKeyTakeaways(body: string) {
  if (/<h2[^>]*>\s*Key Takeaways\s*<\/h2>/i.test(body)) return body

  return `<h2>Key Takeaways</h2>
<ul>
  <li>Start by understanding the main decision before comparing options.</li>
  <li>Review costs, timing, risks, and your personal financial situation together.</li>
  <li>Use this guide as an educational checklist, not personal financial advice.</li>
</ul>

${body}`.trim()
}

function ensureFaq(body: string, keyword: string) {
  if (/<h2[^>]*>\s*(FAQ|Frequently Asked Questions)\s*<\/h2>/i.test(body)) return body

  const topic = clean(keyword || 'this topic')

  return `${body}

<h2>FAQ</h2>
<h3>Is ${topic} right for everyone?</h3>
<p>No. The right choice depends on your goals, timeline, income, risk tolerance, and local rules.</p>

<h3>What should I check before making a decision?</h3>
<p>Review fees, taxes, deadlines, risks, alternatives, and whether the decision fits your wider financial plan.</p>

<h3>Should I get professional advice?</h3>
<p>For tax, legal, investment, or complex financial decisions, consider speaking with a qualified professional.</p>`.trim()
}

function ensureInternalLinks(body: string) {
  if (/href=["']\/blog/i.test(body) || /href=["']\/editorial-standards/i.test(body)) return body

  return `${body}

<h2>Related CashClimb Guides</h2>
<ul>
  <li><a href="/blog">Explore more personal finance guides</a></li>
  <li><a href="/editorial-standards">Read our editorial standards</a></li>
</ul>`.trim()
}

function ensureConclusion(body: string) {
  if (/bottom line|final thoughts|conclusion|next steps/i.test(stripHtml(body))) return body

  return `${body}

<h2>Bottom Line</h2>
<p>The best next step is to compare your options clearly, avoid rushed decisions, and choose the path that fits your goals, timeline, and financial situation.</p>`.trim()
}

function expandBody(body: string, keyword: string) {
  if (wordCount(body) >= 900) return body

  const topic = titleCase(keyword || 'this decision')

  return `${body}

<h2>How to Think About ${topic}</h2>
<p>A useful decision starts with your goal. Are you trying to reduce risk, save money, improve cash flow, avoid mistakes, or build a stronger long-term plan? Once the goal is clear, compare the practical tradeoffs instead of looking for one perfect answer.</p>

<p>Most money decisions involve timing, fees, taxes, account rules, debt levels, income stability, and personal priorities. Looking at those details together makes the decision more practical and less stressful.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
  <li>Making the decision based on one headline number.</li>
  <li>Ignoring fees, taxes, deadlines, or account rules.</li>
  <li>Following generic advice without checking your own situation.</li>
  <li>Skipping a second review before making a high-stakes financial decision.</li>
</ul>

<h2>Simple Checklist</h2>
<ul>
  <li>Define your goal clearly.</li>
  <li>List the costs, risks, and tradeoffs.</li>
  <li>Compare at least two realistic options.</li>
  <li>Check whether taxes, debt, or long-term plans are affected.</li>
  <li>Pause before committing if the decision is complex or high stakes.</li>
</ul>`.trim()
}

async function fixBody(post: any) {
  const keyword = clean(post.primary_keyword || post.title || 'this topic')
  let body = clean(post.body)

  if (!body) {
    body = `<p>This guide explains ${keyword} in plain English, with practical examples, common mistakes, and safe next steps.</p>`
  }

  body = ensureDisclaimer(body)
  body = ensureKeyTakeaways(body)
  body = expandBody(body, keyword)
  body = ensureFaq(body, keyword)
  body = ensureInternalLinks(body)
  body = ensureConclusion(body)
  body = await cleanupExternalLinks(body, { validateExternal: true, removeInvalid: true })

  return body
}

export async function POST(
  _request: Request,
  context: { params: { postId?: string; id?: string } }
) {
  try {
    const postId = clean(context.params?.postId || context.params?.id)

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Missing post ID' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ success: false, error: `Post not found: ${postId}` }, { status: 404 })
    }

    const title = fixTitle(post)
    const excerpt = fixExcerpt(post, title)
    const body = await fixBody({ ...post, title, excerpt })
    const seo_title = fixSeoTitle(post, title)
    const seo_description = fixSeoDescription(post, excerpt)

    const evaluation = evaluateFinanceArticle({
      title,
      excerpt,
      body,
      primaryKeyword: post.primary_keyword || '',
      category: post.category || 'Personal Finance',
      seoTitle: seo_title,
      seoDescription: seo_description,
      coverUrl: post.cover_url || '',
    })

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title,
        excerpt,
        body,
        seo_title,
        seo_description,
        read_time: readingTime(stripHtml(body)).text,
        quality_score: evaluation.score,
        risk_level: evaluation.risk_level,
        review_notes:
          evaluation.checks
            ?.filter((check: any) => !check.passed)
            ?.map((check: any) => check.name || check.label || check.message)
            ?.filter(Boolean)
            ?.join('\n') || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    await supabase.from('quality_checks').insert({
      post_id: postId,
      score: evaluation.score,
      passed: evaluation.passed,
      risk_level: evaluation.risk_level,
      checks: evaluation.checks,
    })

    return NextResponse.json({
      success: true,
      postId,
      score: evaluation.score,
      checks: evaluation.checks,
    })
  } catch (err: any) {
    console.error('[fix-seo]', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Fix SEO failed' },
      { status: 500 }
    )
  }
}
