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
  if (!title || title.length < 35) title = keyword
  return trimTo(removeGenericSuffix(title), 70)
}

function fixExcerpt(post: any, title: string) {
  const current = clean(post.excerpt)
  if (current.length >= 90 && current.length <= 180) return current
  const topic = clean(post.primary_keyword || title).toLowerCase()
  return trimTo(`A practical guide to ${topic}, including what to compare, common mistakes, and safer next steps.`, 180)
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

function removeSection(body: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return body.replace(new RegExp(`<h2[^>]*>\\s*${escaped}\\s*<\\/h2>[\\s\\S]*?(?=<h2|$)`, 'gi'), '').trim()
}

function removeBadSections(body: string) {
  let out = body
  const headings = [
    'How to Think About [^<]+',
    'Data and sources to verify',
    'Tools and accounts that can help',
    'Helpful official resources',
    'Simple Checklist',
    'A simple framework to use',
    'How to make the decision practical',
    'How CashClimb readers can use this guide',
  ]

  for (const heading of headings) {
    out = out.replace(new RegExp(`<h2[^>]*>\\s*${heading}\\s*<\\/h2>[\\s\\S]*?(?=<h2|$)`, 'gi'), '')
  }

  return out.replace(/\n{3,}/g, '\n\n').trim()
}

function ensureDisclaimer(body: string, category?: string) {
  const needsDisclaimer = ['Taxes', 'Investing', 'Retirement', 'Real Estate'].includes(category || '')
  if (!needsDisclaimer) return body
  if (/not personal financial|general educational purposes|not financial advice/i.test(body)) return body
  return `<p><em>This article is for general educational purposes and is not personal financial, investment, tax, or legal advice.</em></p>\n\n${body}`.trim()
}

function ensureFaq(body: string, keyword: string) {
  if (/<h2[^>]*>\s*(FAQ|Frequently Asked Questions)\s*<\/h2>/i.test(body)) return body

  const topic = clean(keyword || 'this topic')

  return `${body}

<h2>FAQ</h2>
<h3>What should I check first?</h3>
<p>Start with the cost, timing, risk, and rules that could change the outcome.</p>

<h3>Does the same answer work for everyone?</h3>
<p>No. Income, debt, location, account rules, tax treatment, and timing can all change the right next step.</p>

<h3>When should I get help?</h3>
<p>Consider qualified help when ${topic} affects taxes, investments, legal documents, property, retirement accounts, or large debts.</p>`.trim()
}

function ensureConclusion(body: string) {
  if (/bottom line|final thoughts|conclusion|next steps/i.test(stripHtml(body))) return body

  return `${body}

<h2>Bottom Line</h2>
<p>Focus on the next useful action: gather the numbers, compare the real costs, and avoid changes that create new risk.</p>`.trim()
}

async function fixBody(post: any) {
  const keyword = clean(post.primary_keyword || post.title || 'this topic')
  let body = clean(post.body)

  if (!body) {
    body = `<p>This guide explains ${keyword} in plain English, with practical examples, common mistakes, and safer next steps.</p>`
  }

  body = removeBadSections(body)
  body = ensureDisclaimer(body, post.category)
  body = ensureFaq(body, keyword)
  body = ensureConclusion(body)
  body = await cleanupExternalLinks(body, { validateExternal: true, removeInvalid: true })

  return body.replace(/\n{3,}/g, '\n\n').trim()
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
