import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// iOS home-screen icon. No `border-radius` — iOS masks the icon itself.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #166534 0%, #052e16 100%)',
          fontSize: 110,
        }}
      >
        🏆
      </div>
    ),
    { ...size }
  )
}
