import { createAdminClient } from '@/lib/supabase-server'
import {
  AUTOMATION_QUALITY_THRESHOLD,
  evaluateFinanceArticle,
  isReadyForHumanReview,
  nextStatusFromEvaluation,
} from '@/lib/editorial-workflow'
import { fixPostContentDepthAndTone } from '@/lib/automation/advanced-content-fixer'
import type { WorkflowEvaluation } from '@/types'

export type EditorialEngineOptions = {
  threshold?: number
  maxPasses?: number
  reason?: string
}

export type EditorialEngineResult = {
  postId: string
  threshold: number
  passes: number
  before: WorkflowEvaluation
  after: WorkflowEvaluation
  readyForReview: boolean
  status: string
  unresolved: string[]
}

function evaluatePost(post: any): WorkflowEvaluation {
  return evaluateFinanceArticle({
    title: post.title || '',
    excerpt: post.excerpt || '',
    body: post.body || '',
    primaryKeyword: post.primary_keyword || null,
    category: post.category || null,
    seoTitle: post.seo_title || null,
    seoDescription: post.seo_description || null,
    coverUrl: post.cover_url || null,
  })
}

async function readPost(postId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single()
  if (error) throw error
  if (!data) throw new Error('Post not found.')
  return data
}

async function saveEngineRun(postId: string, payload: Record<string, any>) {
  const supabase = createAdminClient()

  await supabase.from('generation_runs').insert({
    post_id: postId,
    step: 'ai_editorial_engine',
    model: 'cashclimb-editorial-engine-v2',
    status: payload.readyForReview ? 'completed' : 'needs_review',
    details: payload,
  }).then(() => null, () => null)
}

async function markPost(postId: string, update: Record<string, any>) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('posts').update(update).eq('id', postId)
  if (error) throw error
}

export async function runAIEditorialEngine(
  postId: string,
  options: EditorialEngineOptions = {}
): Promise<EditorialEngineResult> {
  const threshold = Math.max(80, Math.min(100, Number(options.threshold ?? AUTOMATION_QUALITY_THRESHOLD) || AUTOMATION_QUALITY_THRESHOLD))
  const maxPasses = Math.max(1, Math.min(5, Number(options.maxPasses ?? 3) || 3))

  let post = await readPost(postId)
  const before = evaluatePost(post)
  let current = before
  let passes = 0
  const history: any[] = [{ pass: 0, score: current.score, status: nextStatusFromEvaluation(current, threshold) }]

  await markPost(postId, {
    status: 'improving',
    quality_score: current.score,
    risk_level: current.risk_level,
    review_notes: `AI editorial engine started. Current score ${current.score}. Target ${threshold}.`,
    workflow_meta: {
      ...(post.workflow_meta || {}),
      editorialEngine: {
        status: 'running',
        threshold,
        startedAt: new Date().toISOString(),
        reason: options.reason || 'automation',
      },
    },
  })

  while (!isReadyForHumanReview(current, threshold) && passes < maxPasses) {
    const result = await fixPostContentDepthAndTone(postId)
    passes += 1
    current = result.after
    history.push({
      pass: passes,
      score: current.score,
      unresolved: result.unresolved,
      fixesApplied: result.fixesApplied,
      wordCount: result.wordCount,
    })
    post = result.post
  }

  const readyForReview = isReadyForHumanReview(current, threshold)
  const status = readyForReview ? 'ready_for_review' : 'review_required'
  const unresolved = current.checks.filter((check) => !check.passed).map((check) => check.name)

  await markPost(postId, {
    status,
    quality_score: current.score,
    risk_level: current.risk_level,
    review_notes: readyForReview
      ? `AI editorial engine finished. Score ${current.score}. Ready for human review.`
      : `AI editorial engine finished at ${current.score}/${threshold}. Needs review: ${unresolved.join(', ') || 'manual review required'}.`,
    workflow_meta: {
      ...(post.workflow_meta || {}),
      editorialEngine: {
        status: readyForReview ? 'ready_for_review' : 'review_required',
        threshold,
        passes,
        finishedAt: new Date().toISOString(),
        history,
        unresolved,
      },
    },
  })

  const finalResult: EditorialEngineResult = {
    postId,
    threshold,
    passes,
    before,
    after: current,
    readyForReview,
    status,
    unresolved,
  }

  await saveEngineRun(postId, finalResult)

  return finalResult
}
