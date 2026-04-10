export default function EditorialStandardsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-serif text-4xl font-black mb-6">
        Editorial Standards
      </h1>

      <p className="text-gray-600 mb-8">
        CashClimb exists to provide clear, practical financial education. 
        Our goal is to help readers make better decisions — not to overwhelm them with jargon or sell products.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-3">How we write</h2>
      <p className="text-gray-600">
        Every article is written to answer a real financial question. We prioritise clarity, usefulness, and decision-making over complexity or theory.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-3">How we review</h2>
      <p className="text-gray-600">
        Articles are reviewed for clarity, accuracy, and relevance. Where financial rules or market conditions change, we aim to update content accordingly.
      </p>

      <h2 className="text-2xl font-bold mt-10 mb-3">What we don’t do</h2>
      <ul className="list-disc pl-5 text-gray-600 space-y-2">
        <li>No sponsored rankings</li>
        <li>No paid product placements disguised as advice</li>
        <li>No hype-driven or misleading claims</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10 mb-3">What readers should expect</h2>
      <ul className="list-disc pl-5 text-gray-600 space-y-2">
        <li>Plain-English explanations</li>
        <li>Clear tradeoffs, not one-sided opinions</li>
        <li>Guidance focused on real-world decisions</li>
      </ul>

      <div className="mt-12 p-5 bg-gray-100 rounded-xl text-sm text-gray-600">
        CashClimb provides educational content only and does not offer personalised financial advice.
      </div>
    </main>
  )
}