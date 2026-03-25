export type Category =
  | 'Investing'
  | 'Personal Finance'
  | 'Credit'
  | 'Taxes'
  | 'Real Estate'
  | 'Retirement'

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  category: Category
  author: string
  cover_url: string | null
  published: boolean
  read_time: string
  created_at: string
  updated_at: string
  view_count: number
}

export interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  body: string
  approved: boolean
  created_at: string
}

export interface AnalyticsSummary {
  total_posts: number
  total_views: number
  total_comments: number
  posts_this_month: number
  top_posts: { title: string; slug: string; view_count: number }[]
  views_by_category: { category: string; views: number }[]
  recent_comments: Comment[]
}
