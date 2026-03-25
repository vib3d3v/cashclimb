import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#0D0D0D',
          2: '#141414',
          3: '#1A1A1A',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F0C94A',
        },
        accent: '#4A9B8E',
        border: '#2A2A2A',
      },
    },
  },
  plugins: [],
}
export default config
