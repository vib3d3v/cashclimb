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

export type AuthorResolvablePost = {
  title?: string | null
  category?: string | null
  author?: string | null
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
      'CashClimb Editorial is the in-house team behind CashClimb guides, tools, and financial resources. Our goal is to make money management easier, clearer, and more practical for everyday readers.',
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
      'Daniel articles are written for educational purposes and are reviewed for clarity, usefulness, and responsible financial context.',
    ],
    topics: ['Budgeting', 'Saving', 'Side Hustles', 'Income', 'Money Habits'],
    initials: 'DR',
    schemaType: 'Person',
  },
  {
    slug: 'sophie-tran',
    name: 'Sophie Tran',
    role: 'Finance Writer',
    tagline: 'Smart credit, banking, tax organization, and modern money tools.',
    intro:
      'Sophie covers credit, banking, tax organization, and practical money systems that help readers stay organized and in control.',
    bio: [
      'Sophie Tran focuses on credit, banking, tax organization, and modern financial tools that make managing money easier. She breaks down complex ideas into clear, practical advice that readers can apply right away.',
      'Her work explores account comparison, records, payment systems, credit decisions, scams, and tools that help people manage money with more confidence.',
      'At CashClimb, Sophie goal is to make modern money management feel simpler, safer, and less stressful for beginner and intermediate readers.',
    ],
    topics: ['Credit', 'Banking', 'Taxes', 'Financial Tools', 'Scam Prevention'],
    initials: 'ST',
    schemaType: 'Person',
  },
  {
    slug: 'jordan-lee',
    name: 'Jordan Lee',
    role: 'Investing and Retirement Writer',
    tagline: 'Plain-English investing, retirement, and long-term planning guidance.',
    intro:
      'Jordan writes about investing basics, retirement planning, pensions, superannuation, and long-term wealth decisions for everyday readers.',
    bio: [
      'Jordan Lee writes about investing, retirement planning, pensions, superannuation, and long-term wealth decisions. His work focuses on making complex planning topics easier to understand.',
      'He covers account types, contribution rules, long-term tradeoffs, investing basics, and cross-border planning topics for readers who want clear explanations before making decisions.',
      'Jordan CashClimb articles are educational and reviewed for clarity, usefulness, and responsible financial context.',
    ],
    topics: ['Investing', 'Retirement', 'Pensions', 'Superannuation', 'Long-Term Planning'],
    initials: 'JL',
    schemaType: 'Person',
  },
]

export function getAuthorBySlug(slug: string) {
  return AUTHORS.find((author) => author.slug === slug)
}

export function getAuthorByName(name?: string | null) {
  const normalized = (name || 'CashClimb Editorial').trim().toLowerCase()

  return (
    AUTHORS.find((author) => author.name.toLowerCase() === normalized) ||
    AUTHORS.find((author) => author.slug === 'cashclimb-editorial')!
  )
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function isEditorialOrBlank(author?: string | null) {
  const normalized = (author || '').trim().toLowerCase()
  return !normalized || normalized.includes('editorial') || normalized === 'cashclimb'
}

export function resolvePostAuthorName(post: AuthorResolvablePost) {
  const title = (post.title || '').toLowerCase()
  const category = (post.category || '').toLowerCase()
  const combined = `${title} ${category}`

  if (
    containsAny(combined, [
      'pension',
      'pensions',
      'superannuation',
      'retirement',
      'ira',
      'index fund',
      'index funds',
      'investing',
      'investment',
      'investor',
      'real estate',
      'property',
      'mortgage',
      'wealth',
      'long-term',
      'long term',
    ])
  ) {
    return 'Jordan Lee'
  }

  if (
    containsAny(combined, [
      'tax',
      'taxes',
      'freelancer tax',
      'credit',
      'bank',
      'banking',
      'scam',
      'scams',
      'payment app',
      'online bank',
      'checking account',
      'tools',
      'app',
      'apps',
    ])
  ) {
    return 'Sophie Tran'
  }

  if (
    containsAny(combined, [
      'budget',
      'budgeting',
      'debt',
      'saving',
      'savings',
      'save',
      'cash',
      'emergency fund',
      'paycheck',
      'holiday spending',
      'house deposit',
      'side hustle',
      'side hustles',
      'income',
      'money habits',
      'money management',
    ])
  ) {
    return 'Daniel Reeves'
  }

  if (!isEditorialOrBlank(post.author)) {
    return post.author!.trim()
  }

  return 'Daniel Reeves'
}
