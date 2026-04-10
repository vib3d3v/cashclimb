'use client'
import { useState } from 'react'

export default function CompoundCalculator() {
  const [monthly, setMonthly] = useState(500)
  const [years, setYears] = useState(20)
  const [rate, setRate] = useState(7)

  const months = years * 12
  const monthlyRate = rate / 100 / 12

  let futureValue = 0

  for (let i = 0; i < months; i++) {
    futureValue = (futureValue + monthly) * (1 + monthlyRate)
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-6">
        Compound Growth Calculator
      </h2>

      <div className="space-y-4">
        <input
          type="number"
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          className="w-full border p-3 rounded"
          placeholder="Monthly investment"
        />

        <input
          type="number"
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full border p-3 rounded"
          placeholder="Years"
        />

        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-full border p-3 rounded"
          placeholder="Annual return (%)"
        />
      </div>

      <div className="mt-6 text-xl font-bold">
        Future Value: ${futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  )
}