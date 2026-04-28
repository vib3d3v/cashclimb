import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gold mb-4">
            About CashClimb
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl font-black leading-[1.08] mb-6">
            Clear financial thinking,
            <br />
            <span className="text-gold">without the noise.</span>
          </h1>
          <p className="text-[#9A9490] text-lg leading-relaxed max-w-2xl">
            CashClimb was built to make financial information easier to understand,
            more useful in practice, and less dependent on hype, jargon, or
            product-driven advice.
          </p>
        </div>

        <div className="grid gap-6">
          <section className="bg-bg-2 border border-border rounded-2xl p-8">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              Why the site exists
            </h2>
            <p className="text-[#9A9490] leading-relaxed mb-4">
              Most financial content falls into one of two extremes: it is either
              too shallow to be useful or too technical to be practical. CashClimb
              aims to sit in the middle.
            </p>
            <p className="text-[#9A9490] leading-relaxed">
              The goal is simple: help readers make better financial decisions with
              clear explanations, grounded frameworks, and long-term thinking.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-bg-2 border border-border rounded-2xl p-8">
              <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
                What CashClimb covers
              </h2>
              <ul className="space-y-3 text-[#9A9490]">
                <li>• Investing and portfolio construction</li>
                <li>• Personal finance and debt decisions</li>
                <li>• Wealth-building frameworks</li>
                <li>• Retirement and long-term planning</li>
                <li>• Property and finance tradeoffs</li>
              </ul>
            </section>

            <section className="bg-bg-2 border border-border rounded-2xl p-8">
              <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
                Who it’s for
              </h2>
              <p className="text-[#9A9490] leading-relaxed">
                CashClimb is for readers who want to make smarter decisions about
                money without relying on speculation, aggressive sales language, or
                overcomplicated explanations.
              </p>
            </section>
          </div>

          <section className="bg-bg-2 border border-border rounded-2xl p-8">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              Our approach
            </h2>
            <p className="text-[#9A9490] leading-relaxed mb-4">
              Good financial guidance should explain tradeoffs, not just give
              answers. Most important money decisions involve uncertainty, time,
              and competing priorities.
            </p>
            <p className="text-[#9A9490] leading-relaxed">
              That’s why CashClimb focuses on clarity, relevance, and long-term
              usefulness rather than urgency, hype, or short-term predictions.
            </p>
          </section>

          <section className="border border-gold/30 rounded-2xl p-8 bg-[rgba(212,175,55,0.04)]">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              What CashClimb is not
            </h2>
            <p className="text-[#9A9490] leading-relaxed">
              CashClimb provides educational content and general financial
              commentary. It is not personalised financial advice, and it should
              not replace qualified professional guidance where tax, legal, or
              major financial consequences are involved.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
