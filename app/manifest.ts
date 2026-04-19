import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quiniela Habi · Mundial 2026',
    short_name: 'Quiniela Habi',
    description: 'Quiniela interna de Habi/Tuhabi para el Mundial 2026.',
    start_url: '/predictions',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0f0d',
    theme_color: '#166534',
    lang: 'es',
    // Icons are generated at request time by app/icon.tsx (192x192) and
    // app/apple-icon.tsx (180x180) via next/og — no binary assets in repo.
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
