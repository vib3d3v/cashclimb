export type LinkCleanupOptions = {
  validateExternal?: boolean
  removeInvalid?: boolean
  replaceKnownBad?: boolean
}

const KNOWN_REPLACEMENTS: Record<string, string> = {
  'https://www.consumerfinance.gov/consumer-tools/bankruptcy/':
    'https://www.consumerfinance.gov/consumer-tools/',
  'https://www.fca.org.uk/consumers/credit-scores-checking-and-improving-credit-report':
    'https://www.fca.org.uk/consumers',
  'https://www.irs.gov/newsroom/bonuses-and-other-supplemental-wages':
    'https://www.irs.gov/publications/p15',
  'https://www.moneyhelper.org.uk/en/investing/regular-investing':
    'https://www.moneyhelper.org.uk/en/savings/investing',
}

const INTERNAL_DOMAINS = [
  'cashclimb.org',
  'www.cashclimb.org',
  'https://cashclimb.org',
  'https://www.cashclimb.org',
  'http://cashclimb.org',
  'http://www.cashclimb.org',
]

function safeString(value: unknown) {
  return String(value || '').trim()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripTrailingSlashOnly(value: string) {
  if (value === '/') return value
  return value.replace(/\/+$/, '')
}

export function normalizeHref(href: string) {
  const value = safeString(href)

  if (!value) return ''
  if (value.startsWith('#')) return value
  if (value.startsWith('/')) return value
  if (value.startsWith('mailto:')) return value
  if (value.startsWith('tel:')) return value

  for (const domain of INTERNAL_DOMAINS) {
    if (value === domain) return '/'
    if (value.startsWith(`${domain}/`)) {
      const internalPath = value.replace(domain, '')
      return internalPath.startsWith('/') ? internalPath : `/${internalPath}`
    }
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `https://${value}`
}

function replaceKnownBadUrl(href: string) {
  const direct = KNOWN_REPLACEMENTS[href]
  if (direct) return direct

  const withoutSlash = stripTrailingSlashOnly(href)
  const match = Object.entries(KNOWN_REPLACEMENTS).find(
    ([bad]) => stripTrailingSlashOnly(bad) === withoutSlash
  )

  return match?.[1] || null
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function isValidExternalUrl(url: string) {
  try {
    const head = await fetchWithTimeout(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
    })

    if (head.ok) return true

    const get = await fetchWithTimeout(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    })

    return get.ok
  } catch {
    return false
  }
}

export function normalizeLinksInHtml(html: string) {
  return String(html || '').replace(
    /href=["']([^"']+)["']/gi,
    (_, href) => `href="${normalizeHref(href)}"`
  )
}

export async function normalizeAndValidateLinksInHtml(
  html: string,
  options: LinkCleanupOptions = {}
) {
  const shouldValidate = options.validateExternal ?? true
  const shouldRemoveInvalid = options.removeInvalid ?? true
  const shouldReplaceKnownBad = options.replaceKnownBad ?? true

  let output = normalizeLinksInHtml(html)
  const matches = Array.from(output.matchAll(/href=["']([^"']+)["']/gi))

  for (const match of matches) {
    const href = safeString(match[1])

    if (!href) continue
    if (href.startsWith('/') || href.startsWith('#')) continue
    if (href.startsWith('mailto:') || href.startsWith('tel:')) continue

    if (shouldReplaceKnownBad) {
      const replacement = replaceKnownBadUrl(href)
      if (replacement) {
        output = output.replaceAll(href, replacement)
        continue
      }
    }

    if (!shouldValidate) continue
    if (!href.startsWith('http://') && !href.startsWith('https://')) continue

    const valid = await isValidExternalUrl(href)

    if (!valid && shouldRemoveInvalid) {
      const linkRegex = new RegExp(
        `<a[^>]*href=["']${escapeRegExp(href)}["'][^>]*>(.*?)<\\/a>`,
        'gis'
      )

      output = output.replace(linkRegex, '$1')
    }
  }

  return output
}

export async function cleanupExternalLinks(
  html: string,
  options: LinkCleanupOptions = {}
) {
  return normalizeAndValidateLinksInHtml(html, options)
}
