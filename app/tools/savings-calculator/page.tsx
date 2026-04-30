'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ToolsNav from '@/components/ToolsNav'

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function clampNumber(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function SavingsCalculatorPage() {
  const [goalAmount, setGoalAmount] = useState('10000')
  const [currentSavings, setCurrentSavings] = useState('1000')
  const [months, setMonths] = useState('12')
  const [monthlyContribution, setMonthlyContribution] = useState('500')
  const [annualInterestRate, setAnnualInterestRate] = useState('4')

  const results = useMemo(() => {
    const goal = Math.max(clampNumber(goalAmount), 0)
    const current = Math.max(clampNumber(currentSavings), 0)
    const monthCount = Math.max(clampNumber(months, 1), 1)
    const plannedMonthly = Math.max(clampNumber(monthlyContribution), 0)
    const annualRate = Math.max(clampNumber(annualInterestRate), 0)

    const remainingGoal = Math.max(goal - current, 0)
    const monthlyRate = annualRate / 100 / 12

    let requiredMonthly = 0

    if (remainingGoal <= 0) {
      requiredMonthly = 0
    } else if (monthlyRate === 0) {
      requiredMonthly = remainingGoal / monthCount
    } else {
      const futureValueCurrentSavings =
        current * Math.pow(1 + monthlyRate, monthCount)

      const remainingFutureGap = Math.max(goal - futureValueCurrentSavings, 0)

      const annuityFactor =
        (Math.pow(1 + monthlyRate, monthCount) - 1) / monthlyRate

      requiredMonthly =
        annuityFactor > 0
          ? remainingFutureGap / annuityFactor
          : remainingGoal / monthCount
    }

    let projectedBalance = current
    for (let i = 0; i < monthCount; i++) {
      projectedBalance = projectedBalance * (1 + monthlyRate) + plannedMonthly
    }

    let monthsToGoal: number | null = null
    if (current >= goal) {
      monthsToGoal = 0
    } else if (plannedMonthly > 0 || (monthlyRate > 0 && current > 0)) {
      let balance = current
      for (let i = 1; i <= 600; i++) {
        balance = balance * (1 + monthlyRate) + plannedMonthly
        if (balance >= goal) {
          monthsToGoal = i
          break
        }
      }
    }

    return {
      goal,
      current,
      remainingGoal,
      monthCount,
      annualRate,
      plannedMonthly,
      requiredMonthly,
      weeklyTarget: (requiredMonthly * 12) / 52,
      projectedBalance,
      difference: projectedBalance - goal,
      goalReached: projectedBalance >= goal,
      monthsToGoal,
      progressPercent: goal > 0 ? Math.min((current / goal) * 100, 100) : 0,
    }
  }, [goalAmount, currentSavings, months, monthlyContribution, annualInterestRate])

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
        <ToolsNav currentPath="/tools/savings-calculator" />

        <section className="max-w-4xl mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-gold mb-3">
            Financial Tool
          </p>

          <h1 className="font-serif text-4xl lg:text-6xl font-black leading-[1] mb-5">
            Savings Goal
            <br />
            <span className="text-gold">Calculator</span>
          </h1>

          <p className="text-[#9A9490] text-lg leading-relaxed max-w-3xl">
            Estimate how much you need to save each month to hit your target on time,
            and compare that with your current savings plan.
          </p>

          <div className="mt-6">
            <Link
              href="/tools"
              className="text-sm text-[#9A9490] hover:text-gold transition-colors"
            >
              ← Back to Tools
            </Link>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8">
          <section className="bg-bg-2 border border-border rounded-3xl p-8">
            <h2 className="font-serif text-2xl font-bold mb-6 text-[#F0EDE8]">
              Inputs
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-[#9A9490] mb-2">
                  Savings goal
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="cc-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[#9A9490] mb-2">
                  Current savings
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  className="cc-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[#9A9490] mb-2">
                  Timeline (months)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="cc-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[#9A9490] mb-2">
                  Annual interest rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(e.target.value)}
                  className="cc-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-[#9A9490] mb-2">
                  Planned monthly contribution
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
            </div>
          </section>

          <aside className="space-y-6">
            <section className="bg-bg-2 border border-border rounded-3xl p-8">
              <div className="text-sm text-[#9A9490] mb-2">
                Monthly amount needed
              </div>
              <div className="font-serif text-5xl font-black text-gold mb-3">
                {formatCurrency(results.requiredMonthly)}
              </div>
              <div className="text-[#9A9490] text-sm">
                Weekly target: {formatCurrency(results.weeklyTarget)}
              </div>
            </section>

            <section className="bg-bg-2 border border-border rounded-3xl p-8">
              <h2 className="font-serif text-2xl font-bold mb-5 text-[#F0EDE8]">
                Results
              </h2>

              <div className="grid gap-4">
                <div className="border border-border rounded-2xl p-5 bg-bg">
                  <div className="text-[#6A6460] text-sm mb-1">
                    Remaining to save
                  </div>
                  <div className="text-[#F0EDE8] text-2xl font-bold">
                    {formatCurrency(results.remainingGoal)}
                  </div>
                </div>

                <div className="border border-border rounded-2xl p-5 bg-bg">
                  <div className="text-[#6A6460] text-sm mb-1">
                    Projected balance
                  </div>
                  <div className="text-[#F0EDE8] text-2xl font-bold">
                    {formatCurrency(results.projectedBalance)}
                  </div>
                </div>

                <div className="border border-border rounded-2xl p-5 bg-bg">
                  <div className="text-[#6A6460] text-sm mb-1">
                    Goal status
                  </div>
                  <div className="text-[#F0EDE8] text-xl font-bold">
                    {results.goalReached
                      ? 'On track to hit your goal'
                      : `Short by ${formatCurrency(Math.abs(results.difference))}`}
                  </div>
                </div>

                <div className="border border-border rounded-2xl p-5 bg-bg">
                  <div className="text-[#6A6460] text-sm mb-3">Progress so far</div>
                  <div className="w-full h-3 rounded-full bg-[#111214] overflow-hidden mb-3">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${results.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-sm text-[#9A9490]">
                    {results.progressPercent.toFixed(1)}% funded
                  </div>
                </div>

                <div className="border border-border rounded-2xl p-5 bg-bg">
                  <div className="text-[#6A6460] text-sm mb-1">
                    Time to goal with current plan
                  </div>
                  <div className="text-[#F0EDE8] text-xl font-bold">
                    {results.monthsToGoal === null
                      ? 'Not reached with current inputs'
                      : results.monthsToGoal === 0
                      ? 'Already reached'
                      : `${results.monthsToGoal} month${
                          results.monthsToGoal === 1 ? '' : 's'
                        }`}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  )
}