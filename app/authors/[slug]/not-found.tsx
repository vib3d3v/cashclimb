import Link from "next/link"

export default function AuthorNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-neutral-900">Author not found</h1>
      <p className="mt-3 text-neutral-600">
        The author page you’re looking for doesn’t exist.
      </p>
      <Link
        href="/blog"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
      >
        Back to blog
      </Link>
    </main>
  )
}