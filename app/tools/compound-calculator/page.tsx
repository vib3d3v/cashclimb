import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CompoundCalculator from '@/components/CompoundCalculator'

export const metadata = {
  title: 'Compound Interest Calculator',
  description: 'Estimate how savings or investments can grow over time with CashClimb compound interest calculator.',
}

export default function CompoundCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">Financial tool</p>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-[#F0EDE8]">
            Compound Interest Calculator
          </h1>
          <p className="text-[#9A9490] mt-4 max-w-2xl leading-relaxed">
            Estimate how regular saving, time, and compounding can affect long-term growth. This is for educational use only.
          </p>
        </div>
        <CompoundCalculator />
      </main>
      <Footer />
    </>
  )
}
