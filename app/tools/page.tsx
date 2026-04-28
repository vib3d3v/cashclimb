import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const tools = [
  {
    title: 'Savings Calculator',
    href: '/tools/savings-calculator',
    description:
      'Plan a savings goal, set a timeline, and see how much you need to save each month.',
  },
  {
    title: 'Compound Calculator',
    href: '/tools/compound-calculator',
    description:
      'Estimate how contributions and long-term compounding can grow your money over time.',
  },
]

export default function ToolsPage() {
  return (
    <>
      <Navbar />

      <div className="bg-bg-2 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-3">
            Tools
          </p>

          <h1 className="font-serif text-4xl font-black mb-3">
            Free financial tools built for real decisions
          </h1>

          <p className="text-[#9A9490] max-w-2xl leading-relaxed">
            Use practical calculators to plan savings goals, understand compound growth,
            and make clearer money decisions.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group block bg-bg-2 border border-border rounded-3xl p-7 hover:border-gold transition-colors"
            >
              <p className="text-xs font-bold tracking-widest uppercase text-gold mb-3">
                Calculator
              </p>

              <h2 className="font-serif text-3xl font-black text-[#F0EDE8] mb-3 group-hover:text-gold transition-colors">
                {tool.title}
              </h2>

              <p className="text-[#9A9490] leading-relaxed mb-6">
                {tool.description}
              </p>

              <span className="text-sm font-semibold text-gold">
                Open tool →
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </>
  )
}