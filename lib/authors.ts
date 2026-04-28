export type AuthorProfile = {
  slug: string
  name: string
  role: string
  tagline: string
  intro: string
  bio: string[]
  topics: string[]
  initials: string
  schemaType: 'Person' | 'Organization'
}

export const AUTHORS: AuthorProfile[] = [
  {
    slug: 'cashclimb-editorial',
    name: 'CashClimb Editorial',
    role: 'Editorial Team',
    tagline: 'Research-backed financial guides for everyday readers.',
    intro:
      'The CashClimb Editorial team creates clear, practical financial education to help readers save money, compare options, and make better everyday money decisions.',
    bio: [
      'CashClimb Editorial is the in-house team behind CashClimb’s guides, tools, and financial resources. Our goal is to make money management easier, clearer, and more practical for everyday readers.',
      'We research and simplify topics like saving, budgeting, banking, debt, credit, investing basics, and income growth. Our editorial approach focuses on clarity, usefulness, and responsible financial framing.',
      'CashClimb content is educational only and should not be treated as personal financial advice. Readers should consider their own situation and speak with a qualified professional before making major financial decisions.',
    ],
    topics: ['Saving', 'Budgeting', 'Banking', 'Debt', 'Credit', 'Investing Basics'],
    initials: 'CE',
    schemaType: 'Organization',
  },
  {
    slug: 'daniel-reeves',
    name: 'Daniel Reeves',
    role: 'Personal Finance Writer',
    tagline: 'Helping readers save more, budget better, and earn on the side.',
    intro:
      'Daniel writes practical money advice focused on better habits, stronger savings, and realistic ways to increase income.',
    bio: [
      'Daniel Reeves writes about practical ways to save money, build better habits, reduce financial stress, and earn extra income. He focuses on simple strategies that readers can use in everyday life.',
      'His work covers budgeting systems, side hustles, cash flow, spending habits, and realistic financial improvement. At CashClimb, Daniel aims to make financial growth feel practical, motivating, and achievable.',
      'Daniel’s articles are written for educational purposes and are reviewed for clarity, usefulness, and responsible financial context.',
    ],
    topics: ['Budgeting', 'Saving', 'Side Hustles', 'Income', 'Money Habits'],
    initials: 'DR',
    schemaType: 'Person',
  },
  {
    slug: 'sophie-tran',
    name: 'Sophie Tran',
    role: 'Finance Writer',
    tagline: 'Smart budgeting, digital finance, and modern money tools.',
    intro:
      'Sophie covers budgeting, digital banking, and simple financial systems that help readers stay organized and in control.',
    bio: [
      'Sophie Tran focuses on budgeting, digital banking, and modern financial tools that make managing money easier. She breaks down complex ideas into clear, practical advice that readers can apply right away.',
      'Her work explores apps, banking tools, saving systems, and habits that help people stay on top of their finances in a fast-moving digital world.',
      'At CashClimb, Sophie’s goal is to make modern money management feel simpler, safer, and less stressful for beginner and intermediate readers.',
    ],
    topics: ['Budgeting', 'Banking', 'Apps', 'Tools', 'Digital Finance'],
    initials: 'ST',
    schemaType: 'Person',
  },
]

export function getAuthorBySlug(slug: string) {
  return AUTHORS.find((author) => author.slug === slug)
}

export function getAuthorByName(name?: string) {
  const normalized = (name || 'CashClimb Editorial').trim().toLowerCase()

  return (
    AUTHORS.find((author) => author.name.toLowerCase() === normalized) ||
    AUTHORS.find((author) => author.slug === 'cashclimb-editorial')!
  )
}