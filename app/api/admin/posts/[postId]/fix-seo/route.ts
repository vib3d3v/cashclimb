import { NextResponse } from 'next/server'
import readingTime from 'reading-time'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle } from '@/lib/editorial-workflow'

export const dynamic = 'force-dynamic'

function cleanText(value: any = '') {
  return String(value || '').trim()
}

function stripHtml(html: string) {
  return cleanText(html).replace(/<[^>]*>/g, ' ')
}

function titleCase(value: string) {
  return cleanText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.length <= 3
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ')
}

function trimTo(value: string, max: number) {
  const clean = cleanText(value)
  if (clean.length <= max) return clean
  return clean.slice(0, max).replace(/\s+\S*$/, '').trim()
}

function ensureKeyword(title: string, keyword: string) {
  const cleanTitle = cleanText(title)
  const cleanKeyword = cleanText(keyword)

  if (!cleanKeyword) return cleanTitle
  if (cleanTitle.toLowerCase().includes(cleanKeyword.toLowerCase())) return cleanTitle

  return `${titleCase(cleanKeyword)}: ${cleanTitle}`
}

function removeBadTitleSuffix(title: string) {
  return cleanText(title)
    .replace(/:\s*A Practical CashClimb Guide$/i, '')
    .replace(/\s*A Practical CashClimb Guide$/i, '')
    .replace(/:\s*$/g, '')
    .trim()
}

function improveTitle(post: any) {
  const keyword = cleanText(post.primary_keyword)
  const current = removeBadTitleSuffix(post.title)

  let title = current

  if (!title || title.length < 35) {
    title = keyword
      ? `${titleCase(keyword)}: Step-by-Step Guide`
      : 'A Practical Guide to Smarter Money Decisions'
  }

  title = ensureKeyword(title, keyword)
  title = removeBadTitleSuffix(title)

  if (title.endsWith(':')) {
    title = `${title} Step-by-Step Guide`
  }

  return trimTo(title, 70)
}

function improveExcerpt(post: any, title: string) {
  const current = cleanText(post.excerpt)

  if (current.length >= 90 && current.length <= 180) {
    return current
  }

  const keyword = cleanText(post.primary_keyword || title).toLowerCase()

  return trimTo(
    `Learn ${keyword} with a clear checklist, practical examples, common mistakes, and safe next steps for everyday money decisions.`,
    180
  )
}

function improveSeoTitle(post: any, title: string) {
  const current = removeBadTitleSuffix(post.seo_title || '')

  if (current.length >= 40 && current.length <= 65) {
    return current
  }

  return trimTo(title, 65)
}

function improveSeoDescription(post: any, excerpt: string) {
  const current = cleanText(post.seo_description)

  if (current.length >= 120 && current.length <= 160) {
    return current
  }

  return trimTo(excerpt, 160)
}

function ensureKeyTakeaways(body: string) {
  if (/key takeaways/i.test(body)) return body

  return `
<h2>Key Takeaways</h2>
<ul>
  <li>Start by understanding the main decision before comparing options.</li>
  <li>Look at costs, risks, timing, and your personal situation together.</li>
  <li>Use the checklist below as a practical guide, not personal financial advice.</li>
</ul>

${body}
`.trim()
}

function ensureFaq(body: string, keyword: string) {
  if (/<h2[^>]*>\s*FAQ/i.test(body) || /frequently asked questions/i.test(body)) {
    return body
  }

  const topic = cleanText(keyword) || 'this topic'

  return `${body}

<h2>FAQ</h2>
<h3>Is ${topic} the right choice for everyone?</h3>
<p>No. The best choice depends on your goals, timeline, cash flow, risk tolerance, and local rules.</p>

<h3>What should I check before making a decision?</h3>
<p>Review costs, deadlines, taxes, fees, alternatives, and whether the decision fits your wider financial plan.</p>

<h3>Should I get professional advice?</h3>
<p>For tax, legal, investment, or complex financial decisions, consider speaking with a qualified professional.</p>
`.trim()
}

function ensureDisclaimer(body: string) {
  if (/not personal financial/i.test(body) || /general educational purposes/i.test(body)) {
    return body
  }

  return `<p><em>This article is for general educational purposes and is not personal financial, investment, tax, or legal advice.</em></p>

${body}`.trim()
}

function ensureInternalLinks(body: string) {
  if (/href="\/blog/i.test(body) || /href='\/blog/i.test(body)) return body

  return `${body}

<h2>Related CashClimb guides</h2>
<ul>
  <li><a href="/blog">Explore more personal finance guides</a></li>
  <li><a href="/editorial-standards">Read our editorial standards</a></li>
</ul>
`.trim()
}

function ensureConclusion(body: string) {
  if (/final thoughts|bottom line|next steps|conclusion/i.test(body)) return body

  return `${body}

<h2>Bottom Line</h2>
<p>The smartest next step is to compare the tradeoffs clearly, avoid rushed decisions, and choose the option that fits your goals, timeline, and financial situation.</p>
`.trim()
}

function expandIfTooShort(body: string, keyword: string) {
  const plain = stripHtml(body)
  const wordCount = plain.split(/\s+/).filter(Boolean).length

  if (wordCount >= 900) return body

  const topic = cleanText(keyword) || 'this decision'

  return `${body}

<h2>How to Think Through ${titleCase(topic)}</h2>
<p>A useful framework starts with your goal. Are you trying to reduce risk, save money, improve cash flow, avoid mistakes, or make a better long-term decision? Once the goal is clear, the next step is to compare the practical tradeoffs rather than looking for one perfect answer.</p>

<p>For most readers, the important details include timing, fees, taxes, debt levels, income stability, emergency savings, and whether the decision creates flexibility or pressure later. A simple checklist can help you slow down and compare those details before acting.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
  <li>Making the decision based on one headline number.</li>
  <li>Ignoring fees, taxes, deadlines, or account rules.</li>
  <li>Following generic advice without checking your own situation.</li>
  <li>Skipping a second review before making a major financial move.</li>
</ul>

<h2>Simple Checklist</h2>
<ul>
  <li>Define the goal clearly.</li>
  <li>List the costs and risks.</li>
  <li>Compare at least two realistic options.</li>
  <li>Check whether the decision affects taxes, debt, or long-term plans.</li>
  <li>Pause before committing if the decision is complex or high stakes.</li>
</ul>
`.trim()
}

function improveBody(post: any) {
  const keyword = cleanText(post.primary_keyword || post.title)
  let body = cleanText(post.body)

  if (!body) {
    body = `<p>This guide explains ${keyword} in plain English, with practical examples, common mistakes, and safe next steps.</p>`
  }

  body = ensureDisclaimer(body)
  body = ensureKeyTakeaways(body)
  body = expandIfTooShort(body, keyword)
  body = ensureFaq(body, keyword)
  body = ensureInternalLinks(body)
  body = ensureConclusion(body)

  return body
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const postId = context.params.id
    const supabase = createAdminClient()

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const title = improveTitle(post)
    const excerpt = improveExcerpt(post, title)
    const body = improveBody({ ...post, title, excerpt })
    const seo_title = improveSeoTitle(post, title)
    const seo_description = improveSeoDescription(post, excerpt)

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
        read_time: readingTime(body.replace(/<[^>]*>/g, ' ')).text,
        quality_score: evaluation.score,
        risk_level: evaluation.risk_level,
        review_notes: evaluation.checks
          ?.filter((check: any) => !check.passed)
          ?.map((check: any) => check.label || check.name || check.message)
          ?.filter(Boolean)
          ?.join('\n') || null,
      })
      .eq('id', postId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
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
      score: evaluation.score,
      checks: evaluation.checks,
      updated: {
        title,
        excerpt,
        body,
        seo_title,
        seo_description,
      },
    })
  } catch (err: any) {
    console.error('[fix-seo]', err)

    return NextResponse.json(
      { error: err.message || 'Fix SEO failed' },
      { status: 500 }
    )
  }
}