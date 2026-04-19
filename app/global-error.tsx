'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Tuvimos un problema cargando esta página. Ya fuimos notificados y
              lo estamos revisando.
            </p>
            <button
              onClick={reset}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 px-6 rounded-lg transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
