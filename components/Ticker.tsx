const TICKERS = [
  { name: 'Reader-first', val: 'Guidance', change: 'No hype', up: true },
  { name: 'Coverage', val: 'Investing', change: 'Debt', up: true },
  { name: 'Coverage', val: 'Retirement', change: 'Credit', up: true },
  { name: 'Coverage', val: 'Taxes', change: 'Property', up: true },
  { name: 'Publishing', val: 'Reviewed', change: 'Updated', up: true },
  { name: 'Monetization', val: 'No sponsored rankings', change: 'Clear disclosures', up: true },
  { name: 'Style', val: 'Plain English', change: 'Practical use cases', up: true },
]

export default function Ticker() {
  const doubled = [...TICKERS, ...TICKERS]

  return (
    <div className="bg-bg-3 border-y border-border py-2 overflow-hidden">
      <div className="ticker-animate flex gap-12 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-xs">
            <span className="text-[#9A9490] font-medium">{t.name}</span>
            <span className="text-[#F0EDE8]">{t.val}</span>
            <span className="text-gold font-semibold">{t.change}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
