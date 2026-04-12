import { NextRequest, NextResponse } from 'next/server'
import slugify from 'slugify'
import readingTime from 'reading-time'
import { createAdminClient } from '@/lib/supabase-server'
import type { Category } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type GeneratedArticle = {
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  contentHtml: string
  author: string
}

type InternalLink = {
  title: string
  slug: string
  category: string | null
}

const AUTHOR_NAME = 'CashClimb Editorial'
const COVER_BUCKET = process.env.COVER_IMAGE_BUCKET || 'post-covers'

const CATEGORY_ROTATION: Category[] = [
  'Personal Finance',
  'Credit',
  'Retirement',
  'Investing',
  'Taxes',
  'Real Estate',
]

const TOPIC_BANK: Record<Category, string[]> = {
  'Personal Finance': [
    'How to build a monthly budget that actually works',
    'How to manage irregular income without losing control of your money',
    'A simple emergency fund plan for beginners',
    'How to stop lifestyle creep when your income increases',
    'Cash stuffing vs digital budgeting: which works better?',
  ],
  Credit: [
    'How to use a credit card without falling into debt',
    'What to know before applying for your first credit card',
    'How minimum payments can keep you in debt longer',
    'Buy now, pay later: when it helps and when it hurts',
    'How to rebuild healthy credit habits after missed payments',
  ],
  Retirement: [
    'Why retirement planning should start earlier than most people think',
    'How small monthly contributions can grow over time',
    'What beginners should understand about retirement saving',
    'How to balance present spending with long-term retirement goals',
    'Common retirement planning mistakes in your 20s and 30s',
  ],
  Investing: [
    'A beginner-friendly guide to long-term investing',
    'What risk tolerance really means for new investors',
    'How diversification helps reduce investing mistakes',
    'Why chasing fast returns usually backfires',
    'How to learn investing before putting money in',
  ],
  Taxes: [
    'Basic tax concepts freelancers should understand',
    'How to organize income records for easier tax filing',
    'What self-employed workers should track all year',
    'Why setting aside tax money monthly reduces stress',
    'Simple bookkeeping habits that make tax season easier',
  ],
  'Real Estate': [
    'How to know whether renting or buying fits your finances',
    'The hidden costs people forget when planning to buy a home',
    'How to save for a down payment without derailing other goals',
    'What first-time home buyers should prepare financially',
    'How housing costs affect your long-term financial plan',
  ],
}

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

function getCategoryForToday(date = new Date()): Category {
  const dayNumber = Math.floor(date.getTime() / 86_400_000)
  return CATEGORY_ROTATION[dayNumber % CATEGORY_ROTATION.length]
}

function pickTopic(category: Category, date = new Date()): string {
  const topics = TOPIC_BANK[category]
  const dayNumber = Math.floor(date.getTime() / 86_400_000)
  return topics[dayNumber % topics.length]
}

function buildSlug(title: string) {
  return slugify(title, { lower: true, strict: true, trim: true })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function categorySpecificGuidance(category: Category) {
  switch (category) {
    case 'Investing':
      return [
        'Focus on long-term principles, diversification, risk, and learning.',
        'Do not mention specific stock picks, price targets, or market timing.',
        'Avoid hype, urgency, and guaranteed-return language.',
      ].join(' ')
    case 'Credit':
      return [
        'Focus on responsible borrowing, payment habits, utilization, and avoiding debt traps.',
        'Do not glamorize debt or overspending.',
      ].join(' ')
    case 'Taxes':
      return [
        'Keep the content educational and general.',
        'Do not provide personalized tax advice or jurisdiction-specific filing instructions.',
      ].join(' ')
    case 'Real Estate':
      return [
        'Focus on affordability, mortgage basics, budgeting, and tradeoffs.',
        'Do not frame homes as guaranteed investments.',
      ].join(' ')
    case 'Retirement':
      return [
        'Emphasize time horizon, consistency, and realistic planning.',
        'Do not overpromise outcomes.',
      ].join(' ')
    case 'Personal Finance':
    default:
      return [
        'Keep the content practical, simple, and beginner-friendly.',
        'Use clear, concrete examples.',
      ].join(' ')
  }
}

function tryParseJson(text: string) {
  const trimmed = text.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return valid JSON.')
  }
  return JSON.parse(trimmed.slice(start, end + 1))
}

async function fetchInternalLinks(category: Category): Promise<InternalLink[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select('title, slug, category')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) {
    throw new Error(`Failed to fetch internal links: ${error.message}`)
  }

  const allPosts = (data ?? []) as InternalLink[]
  const sameCategory = allPosts.filter((post) => post.category === category).slice(0, 3)
  const others = allPosts.filter((post) => post.category !== category).slice(0, 3)

  return [...sameCategory, ...others].slice(0, 4)
}

async function slugExists(slug: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Boolean(data)
}

async function hasSimilarRecentTitle(title: string) {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const normalized = normalizeWhitespace(title.toLowerCase())

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw new Error(error.message)

  return (data ?? []).some((post) => {
    const existing = normalizeWhitespace(String(post.title).toLowerCase())
    return existing === normalized
  })
}

function buildPrompt(category: Category, topic: string, internalLinks: InternalLink[]) {
  const linksText =
    internalLinks.length > 0
      ? internalLinks
          .map(
            (link, index) =>
              `${index + 1}. Title: "${link.title}" | URL: /blog/${link.slug} | Category: ${link.category ?? 'General'}`
          )
          .join('\n')
      : 'No internal links available.'

  return `
You are a senior personal finance editor writing for a Western-market readership.

Primary markets:
- United States
- Canada
- United Kingdom
- Australia

Audience:
- English-speaking readers in Western markets
- Beginners and early intermediates
- Adults looking for practical financial education

Style rules:
- Use plain, natural English for Western readers.
- Use examples that fit Western consumer contexts.
- Prefer USD when giving example amounts unless the topic is clearly broader.
- Avoid country-specific claims unless clearly framed as general examples.
- Do not write for a Philippine audience.
- Do not use local references, institutions, or slang from Southeast Asia.

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "excerpt": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "contentHtml": "string",
  "author": "CashClimb Editorial"
}

Write one full blog draft.

Topic: ${topic}
Category: ${category}
Tone: practical, calm, trustworthy, clear, non-hype

Category-specific guidance:
${categorySpecificGuidance(category)}

Rules:
- Do not use markdown.
- contentHtml must be valid HTML only.
- Use one short intro paragraph.
- Use 4 to 6 <h2> sections.
- Each section should have 1 to 3 paragraphs.
- Include at least one <ul> or <ol>.
- Add one short conclusion section.
- Keep the article useful and concrete.
- Avoid fluff and repetition.
- Do not mention AI.
- Do not make guarantees, predictions, or personalized financial advice.
- Keep title under 70 characters.
- Keep excerpt between 140 and 180 characters.
- Keep seoTitle under 60 characters.
- Keep seoDescription between 140 and 160 characters.
- author must be "${AUTHOR_NAME}".

Internal linking:
- Naturally include 1 to 2 internal links inside contentHtml if relevant.
- Use standard anchor tags like <a href="/blog/example-slug">Article Title</a>.
- Only use links from this list:
${linksText}

Quality requirements:
- Write like an experienced editor.
- Use specific, concrete explanations.
- Give the reader practical takeaways.
- Keep the article around 900 to 1400 words.
`
}

async function generateArticle(
  category: Category,
  topic: string,
  internalLinks: InternalLink[]
): Promise<GeneratedArticle> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  const prompt = buildPrompt(category, topic, internalLinks)

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'system',
          content:
            'You are a precise JSON generator for a finance publishing workflow. Return only valid JSON with no extra commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'text',
        },
      },
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${text}`)
  }

  const data = await response.json()

  const outputText =
    data.output_text ||
    data.output
      ?.flatMap((item: any) => item.content || [])
      ?.map((content: any) => content.text || '')
      ?.join('') ||
    ''

  if (!outputText) {
    throw new Error('OpenAI returned an empty response.')
  }

  const parsed = tryParseJson(outputText) as Partial<GeneratedArticle>

  if (!parsed.title || !parsed.excerpt || !parsed.seoTitle || !parsed.seoDescription || !parsed.contentHtml) {
    throw new Error('OpenAI returned incomplete article fields.')
  }

  return {
    title: parsed.title.trim(),
    excerpt: parsed.excerpt.trim(),
    seoTitle: parsed.seoTitle.trim(),
    seoDescription: parsed.seoDescription.trim(),
    contentHtml: parsed.contentHtml.trim(),
    author: parsed.author?.trim() || AUTHOR_NAME,
  }
}

async function generateCoverImageBase64(title: string, category: Category) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY.')
  }

  const prompt = `
Create a premium editorial blog cover image for a Western personal finance website.

Article title: ${title}
Category: ${category}

Requirements:
- 16:9 horizontal composition
- modern editorial illustration or polished semi-realistic style
- dark, premium, trustworthy feel
- suitable for a finance website aimed at readers in the US, Canada, UK, and Australia
- no visible text, no letters, no watermark, no logo
- no currency symbols floating everywhere
- clean composition with one main focal point
- visually strong for a blog hero image
`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5',
      input: prompt,
      tools: [{ type: 'image_generation' }],
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Cover image request failed: ${response.status} ${text}`)
  }

  const data = await response.json()

  const imageBase64 =
    data.output?.find((item: any) => item.type === 'image_generation_call')?.result || null

  if (!imageBase64) {
    throw new Error('Image generation returned no image data.')
  }

  return imageBase64 as string
}

async function uploadCoverImage(base64Image: string, slug: string) {
  const supabase = createAdminClient()
  const filePath = `generated/${slug}-${Date.now()}.png`
  const buffer = Buffer.from(base64Image, 'base64')

  const { error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload cover image: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(filePath)

  if (!data?.publicUrl) {
    throw new Error('Failed to get public URL for cover image.')
  }

  return data.publicUrl
}

async function createDraftPost(
  article: GeneratedArticle,
  category: Category,
  coverUrl: string | null
) {
  const supabase = createAdminClient()
  const slug = buildSlug(article.title)
  const readTime = readingTime(stripHtml(article.contentHtml)).text

  const payload: Record<string, any> = {
    title: article.title,
    slug,
    excerpt: article.excerpt,
    body: article.contentHtml,
    category,
    author: article.author,
    cover_url: coverUrl,
    seo_title: article.seoTitle,
    seo_description: article.seoDescription,
    published: false,
    read_time: readTime,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET

  if (!expected) {
    return jsonError('Missing CRON_SECRET environment variable.')
  }

  if (authHeader !== `Bearer ${expected}`) {
    return jsonError('Unauthorized', 401)
  }

  try {
    const now = new Date()
    const category = getCategoryForToday(now)
    const topic = pickTopic(category, now)
    const internalLinks = await fetchInternalLinks(category)

    const article = await generateArticle(category, topic, internalLinks)
    const slug = buildSlug(article.title)

    if (await slugExists(slug)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Duplicate slug',
        slug,
        title: article.title,
      })
    }

    if (await hasSimilarRecentTitle(article.title)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Similar title already exists in recent posts',
        slug,
        title: article.title,
      })
    }

    let coverUrl: string | null = null

    try {
      const base64Image = await generateCoverImageBase64(article.title, category)
      coverUrl = await uploadCoverImage(base64Image, slug)
    } catch (imageError) {
      console.error('Cover image generation/upload failed:', imageError)
      coverUrl = null
    }

    const created = await createDraftPost(article, category, coverUrl)

    return NextResponse.json({
      success: true,
      created: true,
      post: {
        id: created.id,
        title: created.title,
        slug: created.slug,
        category: created.category,
        published: created.published,
        cover_url: created.cover_url,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error creating daily draft'

    return jsonError(message, 500)
  }
}