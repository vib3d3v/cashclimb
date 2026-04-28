import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg px-6 py-24 text-[#F0EDE8]">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
        <h1 className="font-serif text-4xl font-black">Page not found</h1>
        <p className="mt-4 text-lg leading-8 text-[#9A9490]">
          This page may have moved, still be a draft, or the link may be incorrect.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/blog" className="cc-btn-primary">Back to Articles</Link>
          <Link href="/" className="cc-btn-ghost">Go Home</Link>
        </div>
      </div>
    </main>
  )
}
