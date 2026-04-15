import type { WorkflowEvaluation } from '@/types'
import SEORecheckButton from '@/components/admin/SEORecheckButton'
import HumanizeButton from '@/components/admin/HumanizeButton'
import RefreshArticleButton from '@/components/admin/RefreshArticleButton'
import ImproveFailedChecksButton from '@/components/admin/ImproveFailedChecksButton'

function toneFor(score: number) {
  if (score >= 85) return 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10'
  if (score >= 70) return 'text-yellow-300 border-yellow-400/20 bg-yellow-400/10'
  return 'text-red-300 border-red-400/20 bg-red-400/10'
}

function iconFor(passed: boolean, severity: 'info' | 'warn' | 'error') {
  if (passed) return '✓'
  if (severity === 'error') return '✕'
  return '!'
}

export default function SEOChecklistCard({
  postId,
  evaluation,
}: {
  postId: string
  evaluation: WorkflowEvaluation
}) {
  return (
    <aside className="rounded-xl border border-border bg-bg-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6A6460]">SEO Checklist</p>
          <h2 className="mt-2 font-serif text-2xl font-bold">Editorial score</h2>
        </div>
        <div className={`rounded-xl border px-4 py-3 text-right ${toneFor(evaluation.score)}`}>
          <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">Score</div>
          <div className="mt-1 text-2xl font-black">{evaluation.score}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <SEORecheckButton postId={postId} />
        <HumanizeButton postId={postId} />
        <RefreshArticleButton postId={postId} />
        <ImproveFailedChecksButton postId={postId} />
      </div>

      <div className="mt-6 space-y-3">
        {evaluation.checks.map((check) => (
          <div key={check.name} className="rounded-xl border border-border bg-bg px-4 py-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                  check.passed
                    ? 'bg-emerald-400/15 text-emerald-300'
                    : check.severity === 'error'
                      ? 'bg-red-400/15 text-red-300'
                      : 'bg-yellow-400/15 text-yellow-300'
                }`}
              >
                {iconFor(check.passed, check.severity)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0EDE8]">{check.name}</p>
                <p className="mt-1 text-sm text-[#9A9490]">{check.details}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
