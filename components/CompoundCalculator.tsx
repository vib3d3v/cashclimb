'use client'

import { useMemo, useState } from 'react'

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function CompoundCalculator() {
  const [initialAmount, setInitialAmount] = useState('10000')
  const [monthlyContribution, setMonthlyContribution] = useState('500')
  const [years, setYears] = useState('20')
  const [annualReturn, setAnnualReturn] = useState('7')

  const results = useMemo(() => {
    const principal = Math.max(parseNumber(initialAmount), 0)
    const contribution = Math.max(parseNumber(monthlyContribution), 0)
    const yearCount = Math.max(parseNumber(years, 1), 1)
    const annualRate = Math.max(parseNumber(annualReturn), 0)

    const monthlyRate = annualRate / 100 / 12
    const totalMonths = yearCount * 12

    let futureValue = principal

    for (let i = 0; i < totalMonths; i++) {
      futureValue = futureValue * (1 + monthlyRate) + contribution
    }

    const totalContributions = principal + contribution * totalMonths
    const estimatedGrowth = futureValue - totalContributions

    return {
      futureValue,
      totalContributions,
      estimatedGrowth,
    }
  }, [initialAmount, monthlyContribution, years, annualReturn])

  return (
    <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8">
      <section className="bg-bg-2 border border-border rounded-3xl p-8">
        <h2 className="font-serif text-2xl font-bold mb-6 text-[#F0EDE8]">
          Inputs
        </h2>

        <div className="grid gap-5">
          <div>
            <label className="block text-sm text-[#9A9490] mb-2">
              Initial amount
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="cc-input"
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9490] mb-2">
              Monthly contribution
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="cc-input"
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9490] mb-2">
              Years invested
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="cc-input"
            />
          </div>

          <div>
            <label className="block text-sm text-[#9A9490] mb-2">
              Annual return (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(e.target.value)}
              className="cc-input"
            />
          </div>
        </div>
      </section>

      <aside className="bg-bg-2 border border-border rounded-3xl p-8">
        <h2 className="font-serif text-2xl font-bold mb-5 text-[#F0EDE8]">
          Results
        </h2>

        <div className="border border-gold/40 rounded-2xl p-6 bg-[rgba(212,175,55,0.06)] mb-5">
          <div className="text-[#9A9490] text-sm mb-2">Estimated future value</div>
          <div className="font-serif text-5xl font-black text-gold">
            {formatCurrency(results.futureValue)}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-2xl p-5 bg-bg">
            <div className="text-[#6A6460] text-sm mb-1">
              Total contributions
            </div>
            <div className="text-[#F0EDE8] text-2xl font-bold">
              {formatCurrency(results.totalContributions)}
            </div>
          </div>

          <div className="border border-border rounded-2xl p-5 bg-bg">
            <div className="text-[#6A6460] text-sm mb-1">
              Estimated growth
            </div>
            <div className="text-[#F0EDE8] text-2xl font-bold">
              {formatCurrency(results.estimatedGrowth)}
            </div>
          </div>
        </div>

        <p className="text-sm text-[#6A6460] mt-6 leading-relaxed">
          This calculator uses a fixed annual return assumption and monthly
          contributions for planning purposes only.
        </p>
      </aside>
    </div>
  )
}