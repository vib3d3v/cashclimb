import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ToolsNav from '@/components/ToolsNav'
import CompoundCalculator from '@/components/CompoundCalculator'
import Link from 'next/link'

export default function CompoundCalculatorPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
        <ToolsNav currentPath="/tools/compound-calculator" />

        <section className="max-w-4xl mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-3">
            Financial Tool
          </p>

          <h1 className="font-serif text-4xl lg:text-6xl font-black leading-[1] mb-5">
            Compound Growth
            <br />
            <span className="text-gold">Calculator</span>
          </h1>

          <p className="text-[#9A9490] text-lg leading-relaxed max-w-3xl">
            Estimate how regular contributions and long-term compounding can grow
            your money over time.
          </p>

          <div className="mt-6">
            <Link
              href="/tools"
              className="text-sm text-[#9A9490] hover:text-gold transition-colors"
            >
              ← Back to Tools
            </Link>
          </div>
        </section>

        <CompoundCalculator />
      </main>

      <Footer />
    </>
  )
}