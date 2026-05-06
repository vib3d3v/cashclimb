const INTERNAL_HOSTS = new Set(['cashclimb.org', 'www.cashclimb.org'])

const KNOWN_URL_REPLACEMENTS: Record<string, string> = {
  'https://www.consumerfinance.gov/consumer-tools/bankruptcy/':
    'https://www.consumerfinance.gov/ask-cfpb/how-long-does-a-bankruptcy-appear-on-credit-reports-en-325/',
  'https://consumerfinance.gov/consumer-tools/bankruptcy/':
    'https://www.consumerfinance.gov/ask-cfpb/how-long-does-a-bankruptcy-appear-on-credit-reports-en-325/',
  'https://www.fca.org.uk/consumers/credit-scores-checking-and-improving-credit-report':
    'https://www.fca.org.uk/consumers',
  'https://fca.org.uk/consumers/credit-scores-checking-and-improving-credit-report':
    'https://www.fca.org.uk/consumers',
  'https://www.irs.gov/newsroom/bonuses-and-other-supplemental-wages':
    'https://www.irs.gov/publications/p15',
  'https://irs.gov/newsroom/bonuses-and-other-supplemental-wages':
    'https://www.irs.gov/publications/p15',
  'https://www.moneyhelper.org.uk/en/investing/regular-investing':
    'https://www.moneyhelper.org.uk/en/savings/investing/investing-beginners-guide',
  'https://moneyhelper.org.uk/en/investing/regular-investing':
    'https://www.moneyhelper.org.uk/en/savings/investing/investing-beginners-guide',
}

const TRUSTED_FALLBACKS_BY_HOST: Record<string, string> = {
  'consumerfinance.gov': 'https://www.consumerfinance.gov/consumer-tools/',
  'www.consumerfinance.gov': 'https://www.consumerfinance.gov/consumer-tools/',
  'fca.org.uk': 'https://www.fca.org.uk/consumers',
  'www.fca.org.uk': 'https://www.fca.org.uk/consumers',
  'irs.gov': 'https://www.irs.gov/publications/p15',
  'www.irs.gov': 'https://www.irs.gov/publications/p15',
  'moneyhelper.org.uk': 'https://www.moneyhelper.org.uk/en/savings/investing',
  'www.moneyhelper.org.uk': 'https://www.moneyhelper.org.uk/en/savings/investing',
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function canonicalizeForLookup(value: string) {
  return String(value || '')
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/#.*$/, '')
    .replace(/\?$/, '')
}

export function knownReplacementForHref(href: string) {
  const normalized = normalizeHref(href)
  const key = canonicalizeForLookup(normalized)
  return KNOWN_URL_REPLACEMENTS[key] || KNOWN_URL_REPLACEMENTS[`${key}/`] || null
}

export function normalizeHref(href: string) {
  const raw = String(href || '').trim()

  if (!raw) return ''
  if (raw.startsWith('#')) return raw
  if (raw.startsWith('/')) return raw
  if (/^(mailto|tel|sms):/i.test(raw)) return raw

  const cleaned = raw.replace(/&amp;/g, '&')

  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const url = new URL(cleaned)
      if (INTERNAL_HOSTS.has(url.hostname.toLowerCase())) {
        return `${url.pathname}${url.search}${url.hash}` || '/'
      }
      url.protocol = 'https:'
      const normalized = url.toString()
      return KNOWN_URL_REPLACEMENTS[canonicalizeForLookup(normalized)] || normalized
    } catch {
      return cleaned
    }
  }

  const withoutProtocol = cleaned.replace(/^\/\//, '')
  const firstPart = withoutProtocol.split('/')[0]?.toLowerCase() || ''

  if (INTERNAL_HOSTS.has(firstPart)) {
    const path = withoutProtocol.slice(firstPart.length)
    return path.startsWith('/') ? path : `/${path}`
  }

  const normalized = `https://${withoutProtocol}`
  return KNOWN_URL_REPLACEMENTS[canonicalizeForLookup(normalized)] || normalized
}

function isExternalHttpUrl(href: string) {
  return /^https?:\/\//i.test(href)
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 7000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'user-agent': 'CashClimb-LinkChecker/1.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(init.headers || {}),
      },
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function isLiveExternalUrl(href: string) {
  const url = normalizeHref(href)

  if (!isExternalHttpUrl(url)) return true

  try {
    let response = await fetchWithTimeout(url, { method: 'HEAD' })

    if (response.status === 405 || response.status === 403) {
      response = await fetchWithTimeout(url, { method: 'GET' })
    }

    return response.status >= 200 && response.status < 400
  } catch {
    return false
  }
}

export async function validateAndNormalizeHref(href: string) {
  const normalized = normalizeHref(safeDecode(href))
  const knownReplacement = knownReplacementForHref(normalized)
  const candidate = knownReplacement || normalized

  if (!candidate || !isExternalHttpUrl(candidate)) {
    return candidate
  }

  if (await isLiveExternalUrl(candidate)) {
    return candidate
  }

  try {
    const host = new URL(candidate).hostname.toLowerCase()
    const fallback = TRUSTED_FALLBACKS_BY_HOST[host]

    if (fallback && fallback !== candidate && (await isLiveExternalUrl(fallback))) {
      return fallback
    }
  } catch {
    // fall through and remove the bad link
  }

  return ''
}

export function normalizeLinksInHtml(html: string) {
  return String(html || '').replace(
    /href=(['"])(.*?)\1/gi,
    (_match, quote, href) => `href=${quote}${normalizeHref(safeDecode(href))}${quote}`
  )
}

export async function normalizeAndValidateLinksInHtml(html: string) {
  let output = String(html || '')

  const anchorPattern = /<a\b([^>]*?)href=(['"])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi
  const anchors = Array.from(output.matchAll(anchorPattern))

  for (const match of anchors) {
    const [full, beforeHref, quote, href, afterHref, innerHtml] = match
    const normalized = await validateAndNormalizeHref(href)

    if (!normalized) {
      output = output.replace(full, innerHtml)
      continue
    }

    const safeAttrs = `${beforeHref}${afterHref}`
      .replace(/\s+/g, ' ')
      .replace(/\s(target|rel)=(["']).*?\2/gi, '')
      .trim()

    const externalAttrs = isExternalHttpUrl(normalized)
      ? ' target="_blank" rel="noopener noreferrer"'
      : ''

    const attrs = safeAttrs ? ` ${safeAttrs}` : ''
    output = output.replace(
      full,
      `<a${attrs} href=${quote}${normalized}${quote}${externalAttrs}>${innerHtml}</a>`
    )
  }

  const hrefPattern = /href=(['"])(.*?)\1/gi
  const hrefs = Array.from(output.matchAll(hrefPattern))

  for (const match of hrefs) {
    const [full, quote, href] = match
    const normalized = await validateAndNormalizeHref(href)

    if (!normalized) {
      output = output.replace(full, '')
      continue
    }

    output = output.replace(full, `href=${quote}${normalized}${quote}`)
  }

  return output
}
