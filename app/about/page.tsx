export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-serif text-4xl font-black mb-6">
        About CashClimb
      </h1>

      <p className="text-gray-600 mb-6">
        CashClimb was built to make financial information easier to understand — and more useful.
      </p>

      <p className="text-gray-600 mb-6">
        Most financial content is either too simplistic or unnecessarily complex. 
        CashClimb aims to sit in the middle: clear enough to understand, but detailed enough to act on.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-3">What we focus on</h2>
      <ul className="list-disc pl-5 text-gray-600 space-y-2">
        <li>Investing and portfolio strategy</li>
        <li>Debt and credit decisions</li>
        <li>Long-term wealth building</li>
        <li>Practical financial frameworks</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10 mb-3">Our approach</h2>
      <p className="text-gray-600">
        We focus on helping readers understand tradeoffs — not just giving answers. 
        Financial decisions are rarely simple, and good guidance should reflect that.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-3">Who it’s for</h2>
      <p className="text-gray-600">
        CashClimb is for readers who want to make smarter financial decisions 
        without relying on hype, speculation, or overly complex explanations.
      </p>
    </main>
  )
}