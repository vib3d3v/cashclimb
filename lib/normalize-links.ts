const SITE_HOSTS = new Set(['cashclimb.org', 'www.cashclimb.org'])

function cleanHref(value: string) {
  return String(value || '').trim()
}

export function normalizeHref(href: string) {
  const value = cleanHref(href)

  if (!value) return ''
  if (value.startsWith('#')) return value
  if (value.startsWith('/')) return value
  if (/^(mailto:|tel:|sms:|javascript:)/i.test(value)) return value

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(withProtocol)

    if (SITE_HOSTS.has(url.hostname.toLowerCase())) {
      return `${url.pathname}${url.search}${url.hash}` || '/'
    }

    url.protocol = 'https:'
    return url.toString()
  } catch {
    return value
  }
}

export function normalizeLinksInHtml(html: string) {
  return String(html || '').replace(/href=(['"])(.*?)\1/gi, (_match, quote, href) => {
    return `href=${quote}${normalizeHref(href)}${quote}`
  })
}
