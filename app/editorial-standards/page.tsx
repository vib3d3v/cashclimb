import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function EditorialStandardsPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gold mb-4">
            Editorial Standards
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl font-black leading-[1.08] mb-6">
            How CashClimb creates
            <br />
            <span className="text-gold">useful, trustworthy content.</span>
          </h1>
          <p className="text-[#9A9490] text-lg leading-relaxed max-w-2xl">
            CashClimb exists to provide clear, practical financial education.
            These standards explain how content is written, reviewed, and framed
            for readers making real-world money decisions.
          </p>
        </div>

        <div className="grid gap-6">
          <section className="bg-bg-2 border border-border rounded-2xl p-8">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              How we write
            </h2>
            <p className="text-[#9A9490] leading-relaxed">
              Every article should answer a real financial question. We prioritise
              clarity, usefulness, and decision-making value over complexity,
              jargon, or content written purely for volume.
            </p>
          </section>

          <section className="bg-bg-2 border border-border rounded-2xl p-8">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              How we review
            </h2>
            <p className="text-[#9A9490] leading-relaxed mb-4">
              Articles are reviewed for clarity, structure, and relevance before
              publication. When market conditions, lending environments, tax
              settings, or other material facts change, content should be updated
              where appropriate.
            </p>
            <p className="text-[#9A9490] leading-relaxed">
              Readers should be able to see who wrote the content, when it was
              last updated, and what the article is intended to help them
              understand.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-bg-2 border border-border rounded-2xl p-8">
              <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
                What we aim to do
              </h2>
              <ul className="space-y-3 text-[#9A9490]">
                <li>• Explain financial topics in plain English</li>
                <li>• Show tradeoffs instead of one-sided conclusions</li>
                <li>• Focus on long-term usefulness</li>
                <li>• Help readers make better decisions</li>
              </ul>
            </section>

            <section className="bg-bg-2 border border-border rounded-2xl p-8">
              <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
                What we avoid
              </h2>
              <ul className="space-y-3 text-[#9A9490]">
                <li>• Sponsored rankings</li>
                <li>• Product placement disguised as education</li>
                <li>• Hype-driven headlines</li>
                <li>• Overstated promises or certainty</li>
              </ul>
            </section>
          </div>

          <section className="border border-gold/30 rounded-2xl p-8 bg-[rgba(212,175,55,0.04)]">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#F0EDE8]">
              Scope and limitations
            </h2>
            <p className="text-[#9A9490] leading-relaxed">
              CashClimb provides general educational content only. Nothing on the
              site should be interpreted as personalised financial, investment,
              legal, or tax advice. Readers should seek professional guidance
              where their circumstances require it.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
