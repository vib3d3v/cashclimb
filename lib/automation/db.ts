import { createAdminClient } from '@/lib/supabase-server'
import type { Category } from '@/types'
import { buildArticleDraft, generateKeywordIdeas } from './content'
import { generateSerpApiKeywordIdeas } from './serpapi'
import { cleanupExternalLinks } from '@/lib/normalize-links'
import { runAIEditorialEngine } from '@/lib/platform/ai-editorial-engine'
import { canonicalPrimaryKeyword, cleanKeywordList, cleanSeoText, keywordLooksSeoWorthy } from '@/lib/seo/keyword-quality'
import { fallbackHighValueCandidates, normalizeKeywordQueueRows, rankKeywordCandidates } from './keyword-intelligence'

function ensureCategory(category: string | null | undefined): Category {
  const allowed: Category[] = [
    'Investing',
    'Personal Finance',
    'Credit',
    'Taxes',
    'Real Estate',
    'Retirement',
  ]

  return allowed.includes(category as Category)
    ? (category as Category)
    : 'Personal Finance'
}

function cleanKeyword(value: any) {
  return canonicalPrimaryKeyword(value)
}


const EXPANSION_TOPICS: Record<Category, string[]> = {
  'Personal Finance': [
    'how to build a starter budget when income changes monthly',
    'weekly money reset checklist for beginners',
    'how to split bills when living with roommates',
    'emergency fund calculator rules for irregular income',
    'how to reduce subscription spending without losing essentials',
    'cash stuffing categories for beginners',
    'how to plan for annual expenses in a monthly budget',
    'simple sinking fund tracker setup',
    'how to stop impulse spending online',
    'budget categories for single income households',
  ],
  Credit: [
    'how to remove old addresses from your credit report',
    'credit utilization mistakes before applying for a mortgage',
    'how to rebuild credit after missed payments',
    'authorized user credit card checklist',
    'how to dispute duplicate accounts on a credit report',
    'secured credit card graduation checklist',
    'credit score drop after paying off debt explained',
    'how to freeze your credit at all three bureaus',
    'hard inquiry vs soft inquiry explained',
    'credit card statement closing date explained',
  ],
  Investing: [
    'how to compare expense ratios on index funds',
    'etf overlap checklist for beginner investors',
    'how to start investing with a small monthly amount',
    'taxable brokerage account mistakes beginners make',
    'index fund vs target date fund for beginners',
    'how to rebalance a simple investment portfolio',
    'dividend investing mistakes for new investors',
    'how to choose between voo and vti style funds',
    'investment fees checklist before opening an account',
    'how to avoid panic selling during market drops',
  ],
  Retirement: [
    'how to calculate retirement savings rate by age',
    'traditional ira vs roth ira checklist',
    'how to use employer match without overcontributing',
    'retirement planning checklist for self employed workers',
    'how catch up contributions work after age 50',
    '401k rollover mistakes to avoid',
    'how to estimate healthcare costs in retirement',
    'retirement account beneficiary checklist',
    'how to choose a target date fund',
    'early retirement withdrawal penalties explained',
  ],
  Taxes: [
    'quarterly tax payment checklist for side hustles',
    'how to organize receipts for tax season',
    'tax deductions checklist for freelancers',
    'w2 vs 1099 tax differences explained',
    'how to avoid underpayment penalties as a freelancer',
    'home office deduction checklist for beginners',
    'tax documents checklist before filing',
    'how to track mileage for taxes',
    'common tax filing mistakes beginners make',
    'how estimated taxes work for irregular income',
  ],
  'Real Estate': [
    'first time homebuyer closing cost checklist',
    'how to estimate mortgage affordability safely',
    'rent vs buy checklist for expensive cities',
    'home inspection red flags for first time buyers',
    'down payment savings plan for beginners',
    'how escrow accounts work for homeowners',
    'property tax reassessment explained for buyers',
    'mortgage preapproval checklist before house hunting',
    'hidden costs of homeownership checklist',
    'co buying a home with family checklist',
  ],
}

function buildExpansionIdeas(input?: any) {
  const focus = input?.focus && input.focus !== 'Mixed' && ['Personal Finance', 'Credit', 'Investing', 'Retirement', 'Taxes', 'Real Estate'].includes(input.focus)
    ? [input.focus as Category]
    : (['Personal Finance', 'Credit', 'Investing', 'Retirement', 'Taxes', 'Real Estate'] as Category[])

  return focus.flatMap((category) => EXPANSION_TOPICS[category].map((keyword, index) => ({
    keyword,
    category,
    intent: keyword.includes('checklist') ? 'checklist' : keyword.startsWith('how to') ? 'how-to' : 'informational',
    priority: 15 + index,
    source: 'automation',
    status: 'queued',
    brief: {
      keyword,
      category,
      intent: keyword.includes('checklist') ? 'checklist' : keyword.startsWith('how to') ? 'how-to' : 'informational',
      audience: input?.audience || 'Beginners',
      market: input?.market || 'US / Canada / UK / Australia',
      source: 'expanded-fallback',
      requiredSections: [
        'Quick Answer',
        'Key Takeaways',
        'Step-by-Step Guidance',
        'Common Mistakes',
        'Checklist',
        'FAQ',
        'Sources',
      ],
    },
    notes: 'Generated by CashClimb expanded fallback automation.',
  })))
}

export async function insertKeywordIdeas(input?: any) {
  const supabase = createAdminClient()
  const requested = Math.min(100, Math.max(1, Number(input?.howMany ?? 20) || 20))
  const candidateCount = Math.min(500, Math.max(100, requested * 12))

  const [{ data: existingQueued }, { data: existingPosts }] = await Promise.all([
    supabase
      .from('keyword_queue')
      .select('keyword, category, status')
      .in('status', ['queued', 'processing', 'completed']),
    supabase
      .from('posts')
      .select('title, primary_keyword, category, slug'),
  ])

  const existingKeywords = [
    ...(existingQueued || []).map((row: any) => row.keyword),
    ...(existingPosts || []).map((row: any) => row.primary_keyword),
  ].filter(Boolean)
  const existingTitles = (existingPosts || []).map((row: any) => row.title).filter(Boolean)

  const serpApiIdeas = await generateSerpApiKeywordIdeas({
    ...input,
    howMany: candidateCount,
    existingKeywords,
    existingTitles,
  })

  const fallbackIdeas = generateKeywordIdeas({ ...input, howMany: 100 })
  const expansionIdeas = buildExpansionIdeas(input)
  const highValueFallback = fallbackHighValueCandidates({ focus: input?.focus ?? 'Mixed' })

  const rankedCandidates = rankKeywordCandidates({
    candidates: [
      ...serpApiIdeas.map((idea) => ({
        keyword: idea.keyword,
        category: ensureCategory(idea.category),
        intent: idea.intent,
        source: String(idea.brief?.source || 'serpapi'),
        signals: { appearances: 2, autocomplete: 1, related: 1 },
      })),
      ...fallbackIdeas.map((idea) => ({
        keyword: idea.keyword,
        category: ensureCategory(idea.category),
        intent: idea.intent,
        source: 'fallback-seed',
        signals: { appearances: 1 },
      })),
      ...expansionIdeas.map((idea) => ({
        keyword: idea.keyword,
        category: ensureCategory(idea.category),
        intent: idea.intent,
        source: 'expanded-fallback',
        signals: { appearances: 1 },
      })),
      ...highValueFallback,
    ],
    requested: requested * 3,
    existingKeywords,
    existingTitles,
    options: input,
  })

  const ideas = normalizeKeywordQueueRows(rankedCandidates)
    .filter((idea) => idea.keyword && keywordLooksSeoWorthy(idea.keyword))

  const inserted: any[] = []
  const skipped: any[] = []
  const existingSet = new Set(
    [...(existingQueued || []), ...(existingPosts || [])]
      .map((row: any) => `${ensureCategory(row.category)}:${cleanKeyword(row.keyword || row.primary_keyword || row.title)}`)
  )

  for (const idea of ideas) {
    if (inserted.length >= requested) break
    const key = `${idea.category}:${idea.keyword}`
    if (existingSet.has(key)) {
      skipped.push({ keyword: idea.keyword, reason: 'already exists or covered' })
      continue
    }

    const { data, error } = await supabase
      .from('keyword_queue')
      .insert(idea)
      .select('*')
      .single()

    if (error) {
      skipped.push({ keyword: idea.keyword, reason: error.message })
      continue
    }

    if (data) {
      inserted.push(data)
      existingSet.add(key)
    }
  }

  return {
    inserted: inserted.length,
    skipped: skipped.length,
    keywords: inserted,
    skippedKeywords: skipped,
    intelligence: {
      candidatesReviewed: rankedCandidates.length,
      serpApiCandidates: serpApiIdeas.length,
      mode: serpApiIdeas.length ? 'serpapi-keyword-intelligence' : 'high-value-fallback',
    },
  }
}

async function getNextQueuedKeyword(keywordId?: string | null) {
  const supabase = createAdminClient()

  if (keywordId) {
    const { data, error } = await supabase
      .from('keyword_queue')
      .select('*')
      .eq('id', keywordId)
      .in('status', ['queued', 'failed'])
      .maybeSingle()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('keyword_queue')
    .select('*')
    .eq('status', 'queued')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function lockKeyword(keyword: any) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('keyword_queue')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
      notes: 'Draft generation started.',
    })
    .eq('id', keyword.id)
    .eq('status', keyword.status)
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}

async function markKeywordCompleted(keywordId: string) {
  const supabase = createAdminClient()

  await supabase
    .from('keyword_queue')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'Draft generated successfully.',
    })
    .eq('id', keywordId)
}

async function markKeywordFailed(keywordId: string, message: string) {
  const supabase = createAdminClient()

  await supabase
    .from('keyword_queue')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
      notes: message || 'Draft generation failed.',
    })
    .eq('id', keywordId)
}

async function completeDuplicateKeywords(keyword: string, category: Category) {
  const supabase = createAdminClient()

  await supabase
    .from('keyword_queue')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      notes: 'Skipped because a draft already exists for this keyword.',
    })
    .eq('keyword', keyword)
    .eq('category', category)
    .in('status', ['queued', 'processing', 'failed'])
}

async function existingPostForKeyword(keyword: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('posts')
    .select('id,title,slug')
    .eq('primary_keyword', keyword)
    .maybeSingle()

  return data || null
}

export async function createDraftFromKeyword(keywordId?: string | null): Promise<any> {
  const supabase = createAdminClient()

  const keyword = await getNextQueuedKeyword(keywordId)

  if (!keyword) {
    return {
      skipped: true,
      reason: keywordId ? 'Keyword not found or not queued.' : 'No queued keywords found.',
    }
  }

  const lockedKeyword = await lockKeyword(keyword)

  if (!lockedKeyword) {
    return {
      skipped: true,
      reason: 'Keyword already taken by another run.',
      keywordId: keyword.id,
    }
  }

  const normalizedKeyword = cleanKeyword(lockedKeyword.keyword)
  const category = ensureCategory(lockedKeyword.category)

  try {
    const existingPost = await existingPostForKeyword(normalizedKeyword)

    if (existingPost) {
      await completeDuplicateKeywords(normalizedKeyword, category)

      return {
        skipped: true,
        reason: 'Draft already exists for this keyword.',
        keyword: normalizedKeyword,
        post: existingPost,
      }
    }

    const draft = buildArticleDraft({
      keyword: normalizedKeyword,
      category,
      intent: lockedKeyword.intent,
      brief: lockedKeyword.brief,
    })

    const uniqueSlug = await nextAvailableSlug(draft.slug)
    const cleanedBody = await cleanupExternalLinks(draft.body, {
      validateExternal: true,
      removeInvalid: true,
    })

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title: cleanSeoText(draft.title),
        slug: uniqueSlug,
        excerpt: cleanSeoText(draft.excerpt),
        body: cleanSeoText(cleanedBody),
        category: draft.category,
        author: draft.author,
        cover_url: null,
        published: false,
        read_time: draft.read_time,
        primary_keyword: canonicalPrimaryKeyword(draft.primary_keyword),
        related_keywords: cleanKeywordList(draft.related_keywords),
        seo_title: cleanSeoText(draft.seo_title),
        seo_description: cleanSeoText(draft.seo_description),
        status: draft.status,
        quality_score: draft.quality_score,
        risk_level: draft.risk_level,
        review_notes: draft.review_notes,
        workflow_meta: {
          ...(draft.workflow_meta || {}),
          keywordQueueId: lockedKeyword.id,
          generatedBy: 'automation_batch',
        },
      })
      .select('*')
      .single()

    if (postError) throw postError

    await supabase.from('quality_checks').insert({
      post_id: post.id,
      score: draft.evaluation.score,
      passed: draft.evaluation.passed,
      risk_level: draft.evaluation.risk_level,
      checks: draft.evaluation.checks,
    })

    const editorialResult = await runAIEditorialEngine(post.id, {
      threshold: 95,
      maxPasses: 3,
      reason: 'draft_generation',
    })

    await supabase.from('generation_runs').insert({
      post_id: post.id,
      keyword_queue_id: lockedKeyword.id,
      step: 'draft_generation',
      model: 'cashclimb-template-engine',
      status: editorialResult.readyForReview ? 'completed' : 'needs_review',
      details: {
        keyword: normalizedKeyword,
        initialQualityScore: draft.evaluation.score,
        finalQualityScore: editorialResult.after.score,
        editorialStatus: editorialResult.status,
        editorialPasses: editorialResult.passes,
        slug: uniqueSlug,
      },
    })

    await markKeywordCompleted(lockedKeyword.id)

    const { data: finalPost } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post.id)
      .maybeSingle()

    return {
      created: true,
      keyword: normalizedKeyword,
      keywordId: lockedKeyword.id,
      post: finalPost || post,
      evaluation: editorialResult.after,
      editorialResult,
    }
  } catch (error: any) {
    const message = error?.message || 'Draft generation failed.'

    await markKeywordFailed(lockedKeyword.id, message)

    await supabase.from('generation_runs').insert({
      keyword_queue_id: lockedKeyword.id,
      step: 'draft_generation',
      model: 'cashclimb-template-engine',
      status: 'failed',
      error_message: message,
      details: {
        keyword: normalizedKeyword,
      },
    })

    throw error
  }
}


async function queuedKeywordCount() {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('keyword_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'queued')
  if (error) throw error
  return count || 0
}

export async function runAutomationBatch(options?: {
  keywordCount?: number
  draftCount?: number
  focus?: string
}) {
  const keywordCount = Math.max(1, Math.min(50, Number(options?.keywordCount ?? 10) || 10))
  const draftCount = Math.max(1, Math.min(10, Number(options?.draftCount ?? 1) || 1))

  let keywords: any = {
    inserted: 0,
    skipped: 0,
    keywords: [],
    skippedKeywords: [],
  }

  // Queue-first behavior: use existing queued keywords before generating new ideas.
  const queuedBefore = await queuedKeywordCount()
  if (queuedBefore < draftCount) {
    keywords = await insertKeywordIdeas({
      howMany: keywordCount,
      focus: options?.focus ?? 'Mixed',
    })
  }

  const drafts: any[] = []
  let attempts = 0
  const maxAttempts = Math.max(5, draftCount * 10)

  while (drafts.filter((draft) => draft.created).length < draftCount && attempts < maxAttempts) {
    attempts += 1
    const result = await createDraftFromKeyword()
    drafts.push(result)

    if (result?.reason === 'No queued keywords found.') break
  }

  return {
    keywords,
    drafts,
    created: drafts.filter((draft) => draft.created).length,
    skipped: drafts.filter((draft) => draft.skipped).length,
    attempts,
  }
}

async function nextAvailableSlug(baseSlug: string) {
  const supabase = createAdminClient()

  const base =
    cleanKeyword(baseSlug)
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cashclimb-guide'

  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`

    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) return candidate
  }

  return `${base}-${Date.now()}`
}