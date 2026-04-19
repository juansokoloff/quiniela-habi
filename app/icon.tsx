import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

// Generates the 192x192 PWA icon at request time — no binary assets in the
// repo. The trophy emoji is used as a minimal, on-brand glyph.
export default function Icon() {
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
          borderRadius: 32,
          fontSize: 120,
        }}
      >
        🏆
      </div>
    ),
    { ...size }
  )
}
