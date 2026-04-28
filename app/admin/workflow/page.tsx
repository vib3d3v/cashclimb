export const dynamic = 'force-dynamic'

export default function AdminPlaceholderPage() {
  return (
    <div className="rounded-2xl border border-border bg-bg-2 p-8">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Admin</p>
      <h1 className="font-serif text-4xl font-black text-[#F0EDE8] mb-4">Dashboard section</h1>
      <p className="text-[#9A9490] leading-relaxed max-w-2xl">
        This admin section is available as a stable route. Add your full workflow tools here when ready.
      </p>
    </div>
  )
}
