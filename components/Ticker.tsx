const TICKERS = [
  { name: 'S&P 500', val: '5,218.19', change: '+0.42%', up: true },
  { name: 'NASDAQ',  val: '16,340.87', change: '-0.18%', up: false },
  { name: 'DOW',     val: '38,996.40', change: '+0.31%', up: true },
  { name: '10Y Treasury', val: '4.31%', change: '-0.05%', up: false },
  { name: 'Gold',    val: '$2,181.20', change: '+0.67%', up: true },
  { name: 'BTC/USD', val: '$68,440',  change: '+2.14%', up: true },
  { name: 'EUR/USD', val: '1.0842',   change: '-0.09%', up: false },
  { name: 'Oil (WTI)', val: '$81.14', change: '+0.55%', up: true },
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
            <span className={t.up ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
              {t.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
