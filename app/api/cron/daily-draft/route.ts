import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import readingTime from 'reading-time'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase-server'
import { evaluateFinanceArticle, nextStatusFromEvaluation } from '@/lib/editorial-workflow'
import { resolvePostAuthorName } from '@/lib/authors'

type KeywordRow = {
  id: string
  keyword: string
  category?: string | null
}

function categoryFor(value?: string | null) {
  const text = (value || '').toLowerCase()
  if (text.includes('credit')) return 'Credit'
  if (text.includes('tax')) return 'Taxes'
  if (text.includes('retirement') || text.includes('pension')) return 'Retirement'
  if (text.includes('real estate') || text.includes('property') || text.includes('home')) return 'Real Estate'
  if (text.includes('invest')) return 'Investing'
  return 'Personal Finance'
}

function titleFromKeyword(keyword: string) {
  return keyword
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function buildDraftHtml(title: string, category: string) {
  return `
<h2>Key Takeaways</h2>
<ul>
<li>This draft is a starting point and should be expanded before publishing.</li>
<li>Readers need clear examples, practical tradeoffs, and responsible financial framing.</li>
<li>Use this guide for education only, not personal financial advice.</li>
</ul>
<h2>Quick Answer</h2>
<p>${title} is a practical money topic that should be explained with plain language, realistic examples, and clear next steps.</p>
<h2>Why This Matters</h2>
<p>Financial decisions can affect savings, debt, taxes, risk, and long-term planning. A useful guide should help readers understand the tradeoffs without promising results.</p>
<h2>What To Compare</h2>
<p>Readers should compare costs, risk, timeline, flexibility, and whether the option fits their household situation.</p>
<h2>Example Scenario</h2>
<p>For example, a reader comparing ${category.toLowerCase()} options may need to balance short-term cash flow with long-term goals.</p>
<h2>FAQ</h2>
<h3>Is this financial advice?</h3>
<p>No. This article is for educational purposes only and is not personal financial advice.</p>
<h3>What should readers do next?</h3>
<p>They should compare options, check current rules, and consider speaking with a qualified professional when decisions are significant.</p>
<h2>Final Thoughts</h2>
<p>The best next step is to use this information as a starting point, then make decisions based on current facts and personal circumstances.</p>`
}

async function createDraftFromKeyword(keyword: KeywordRow) {
  const category = categoryFor(keyword.category || keyword.keyword)
  const title = titleFromKeyword(keyword.keyword)
  const excerpt = `A practical CashClimb draft covering ${keyword.keyword.toLowerCase()} with clear examples, tradeoffs, and educational guidance.`
  const body = buildDraftHtml(title, category)
  const stats = readingTime(body.replace(/<[^>]*>/g, ' '))
  const evaluation = evaluateFinanceArticle({ title, excerpt, body, category, primaryKeyword: keyword.keyword, coverUrl: null })
  const slug = slugify(title, { lower: true, strict: true })
  const now = new Date().toISOString()
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      excerpt,
      body,
      category,
      author: resolvePostAuthorName({ title, category }),
      cover_url: null,
      primary_keyword: keyword.keyword,
      published: false,
      status: nextStatusFromEvaluation(evaluation),
      quality_score: evaluation.score,
      risk_level: evaluation.risk_level,
      read_time: stats.text,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('quality_checks').insert({
    post_id: post.id,
    score: evaluation.score,
    passed: evaluation.passed,
    risk_level: evaluation.risk_level,
    checks: evaluation.checks,
  })

  await supabase.from('keyword_queue').update({ status: 'drafted', post_id: post.id }).eq('id', keyword.id)

  return post
}

export async function GET(req: NextRequest) {
  const unauthorized = requireAdmin(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const count = Math.max(1, Math.min(Number(searchParams.get('count') || 1), 5))
  const keywordId = searchParams.get('keywordId')
  const supabase = createAdminClient()

  let query = supabase.from('keyword_queue').select('*').order('priority', { ascending: true }).limit(count)
  if (keywordId) query = query.eq('id', keywordId).limit(1)
  else query = query.in('status', ['queued', 'failed'])

  const { data: keywords, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!keywords?.length) return NextResponse.json({ skipped: true, reason: 'No queued keywords found.' })

  const results = []
  for (const keyword of keywords as KeywordRow[]) {
    try {
      const post = await createDraftFromKeyword(keyword)
      results.push({ created: true, keyword: keyword.keyword, post })
    } catch (error) {
      await supabase.from('keyword_queue').update({ status: 'failed' }).eq('id', keyword.id)
      results.push({ created: false, keyword: keyword.keyword, error: error instanceof Error ? error.message : 'Failed' })
    }
  }

  return NextResponse.json(keywordId ? results[0] : { results })
}
