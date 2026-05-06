const INTERNAL_HOSTS = new Set(['cashclimb.org', 'www.cashclimb.org'])

const KNOWN_REPLACEMENTS: Record<string, string> = {
  'https://www.consumerfinance.gov/consumer-tools/bankruptcy/':
    'https://www.consumerfinance.gov/consumer-tools/',
  'https://consumerfinance.gov/consumer-tools/bankruptcy/':
    'https://www.consumerfinance.gov/consumer-tools/',
  'https://www.fca.org.uk/consumers/credit-scores-checking-and-improving-credit-report':
    'https://www.fca.org.uk/consumers',
  'https://fca.org.uk/consumers/credit-scores-checking-and-improving-credit-report':
    'https://www.fca.org.uk/consumers',
  'https://www.moneyhelper.org.uk/en/investing/regular-investing':
    'https://www.moneyhelper.org.uk/en/savings/investing',
  'https://moneyhelper.org.uk/en/investing/regular-investing':
    'https://www.moneyhelper.org.uk/en/savings/investing',
  'https://www.irs.gov/newsroom/bonuses-and-other-supplemental-wages':
    'https://www.irs.gov/publications/p15',
}

type CleanupOptions = {
  validateExternal?: boolean
  removeInvalid?: boolean
  timeoutMs?: number
}

export type LinkCleanupResult = {
  html: string
  changed: boolean
  linksChecked: number
  replaced: Array<{ from: string; to: string }>
  removed: string[]
  kept: string[]
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isSpecialLink(value: string) {
  return /^(#|mailto:|tel:|sms:|javascript:)/i.test(value)
}

export function normalizeHref(href: string) {
  const raw = String(href || '').trim()

  if (!raw) return ''
  if (isSpecialLink(raw)) return raw
  if (raw.startsWith('/')) return raw

  const cleaned = safeDecode(raw).replace(/&amp;/g, '&').trim()

  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const url = new URL(cleaned)
      const hostname = url.hostname.toLowerCase()

      if (INTERNAL_HOSTS.has(hostname)) {
        return `${url.pathname}${url.search}${url.hash}` || '/'
      }

      url.protocol = 'https:'
      return url.toString()
    } catch {
      return cleaned
    }
  }

  const withoutProtocol = cleaned.replace(/^\/\//, '')
  const host = withoutProtocol.split('/')[0]?.toLowerCase() || ''

  if (INTERNAL_HOSTS.has(host)) {
    const path = withoutProtocol.slice(host.length)
    return path.startsWith('/') ? path : `/${path}`
  }

  return `https://${withoutProtocol}`
}

function replacementFor(url: string) {
  const normalized = normalizeHref(url)
  return KNOWN_REPLACEMENTS[url] || KNOWN_REPLACEMENTS[normalized] || null
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'user-agent': 'CashClimb-Link-Auditor/1.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(init.headers || {}),
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function isLiveExternalUrl(url: string, timeoutMs = 7000) {
  const normalized = normalizeHref(url)

  if (!/^https?:\/\//i.test(normalized)) return true

  try {
    const head = await fetchWithTimeout(normalized, { method: 'HEAD' }, timeoutMs)

    if (head.status >= 200 && head.status < 400) return true
    if (head.status === 401 || head.status === 403 || head.status === 405 || head.status === 429) return true
    if (head.status === 404 || head.status === 410) return false
  } catch {
    // Some sites block HEAD or bot traffic. Try GET before deciding.
  }

  try {
    const get = await fetchWithTimeout(normalized, { method: 'GET' }, timeoutMs)

    if (get.status >= 200 && get.status < 400) return true
    if (get.status === 401 || get.status === 403 || get.status === 429) return true
    if (get.status === 404 || get.status === 410) return false

    // Avoid deleting links because of temporary 5xx/network weirdness.
    return true
  } catch {
    // If the request completely fails, keep the link rather than deleting a possibly valid source.
    return true
  }
}

function unwrapLink(html: string, href: string) {
  const escaped = escapeRegExp(href)
  const anchor = new RegExp(`<a\\b([^>]*?)href=["']${escaped}["']([^>]*)>([\\s\\S]*?)<\\/a>`, 'gi')
  return html.replace(anchor, '$3')
}

export function normalizeLinksInHtml(html: string) {
  return String(html || '').replace(/href=(['"])(.*?)\1/gi, (_match, quote, href) => {
    const normalized = normalizeHref(href)
    return `href=${quote}${normalized}${quote}`
  })
}

export async function cleanupLinksInHtml(
  html: string,
  options: CleanupOptions = {}
): Promise<LinkCleanupResult> {
  const validateExternal = options.validateExternal ?? true
  const removeInvalid = options.removeInvalid ?? true
  const timeoutMs = options.timeoutMs ?? 7000

  let cleaned = normalizeLinksInHtml(String(html || ''))
  const matches = Array.from(cleaned.matchAll(/href=(['"])(.*?)\1/gi))
  const uniqueLinks = Array.from(new Set(matches.map((match) => match[2]).filter(Boolean)))

  const result: LinkCleanupResult = {
    html: cleaned,
    changed: cleaned !== String(html || ''),
    linksChecked: 0,
    replaced: [],
    removed: [],
    kept: [],
  }

  for (const href of uniqueLinks) {
    if (!/^https?:\/\//i.test(href)) continue

    const replacement = replacementFor(href)
    if (replacement) {
      const safeReplacement = normalizeHref(replacement)
      cleaned = cleaned.split(href).join(safeReplacement)
      result.replaced.push({ from: href, to: safeReplacement })
      result.changed = true
      continue
    }

    if (!validateExternal) continue

    result.linksChecked += 1
    const live = await isLiveExternalUrl(href, timeoutMs)

    if (!live && removeInvalid) {
      cleaned = unwrapLink(cleaned, href)
      result.removed.push(href)
      result.changed = true
    } else {
      result.kept.push(href)
    }
  }

  result.html = cleaned
  return result
}

export async function cleanupExternalLinks(html: string, options?: CleanupOptions) {
  const result = await cleanupLinksInHtml(html, options)
  return result.html
}
