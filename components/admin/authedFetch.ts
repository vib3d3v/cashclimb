export async function authedFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  const payload = await response.json().catch(() => null)

  if (response.status === 401) {
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed')
  }

  return payload
}
