import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Savings Calculator',
  description: 'Estimate simple savings goals and monthly savings targets with CashClimb.',
}

export default function SavingsCalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">Financial tool</p>
        <h1 className="font-serif text-4xl md:text-5xl font-black text-[#F0EDE8]">
          Savings Calculator
        </h1>
        <p className="text-[#9A9490] mt-4 max-w-2xl leading-relaxed">
          This simple savings tool page is ready for expansion. Add calculator inputs here when you want a dedicated savings goal tool.
        </p>
      </main>
      <Footer />
    </>
  )
}
