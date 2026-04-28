'use client'

export function useCookies(name: string): string {
  if (typeof document === 'undefined') return ''
  
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=')
      if (key === name) {
        return decodeURIComponent(value)
      }
    }
  } catch {
    return ''
  }
  
  return ''
}