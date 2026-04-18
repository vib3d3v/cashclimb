import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CashClimb'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
          color: '#F0EDE8',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#D4AF37',
          }}
        >
          Independent financial education
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02 }}>
            CashClimb
          </div>
          <div style={{ fontSize: 36, lineHeight: 1.35, maxWidth: 980 }}>
            Clear financial guidance that feels credible before it feels clever.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 28,
            color: '#C8C1BC',
          }}
        >
          <div>cashclimb.org</div>
          <div>Investing, debt, retirement, and wealth building</div>
        </div>
      </div>
    ),
    size
  )
}