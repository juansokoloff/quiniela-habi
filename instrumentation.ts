// Server-side Sentry init. Runs once per Next.js server instance.
// If SENTRY_DSN is not set (local dev or preview), Sentry is a no-op.
// See: node_modules/next/dist/docs/01-app/02-guides/instrumentation.md

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? 'development',
      tracesSampleRate: 0.1,
      // Don't capture 404s or validation errors — they clog the free tier
      ignoreErrors: [/NEXT_NOT_FOUND/, /NEXT_REDIRECT/],
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? 'development',
      tracesSampleRate: 0.1,
    })
  }
}

// Forward request errors to Sentry (Next.js 15.3+ hook).
export async function onRequestError(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(...args)
}
