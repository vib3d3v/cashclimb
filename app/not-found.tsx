import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="font-serif text-[8rem] font-black text-gold opacity-20 leading-none select-none">404</div>
        <h1 className="font-serif text-3xl font-bold -mt-4 mb-3">Page Not Found</h1>
        <p className="text-[#9A9490] mb-8 max-w-sm">
          The article or page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-4">
          <Link href="/"     className="cc-btn-primary">Go Home</Link>
          <Link href="/blog" className="cc-btn-ghost">Browse Articles</Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
