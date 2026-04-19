// Client-side Sentry init. Runs after HTML load, before React hydration.
// If SENTRY_DSN is not set, Sentry is a no-op (local dev / previews).
// See: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md

import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    ignoreErrors: [
      // Benign noise from browsers / extensions
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /^NEXT_NOT_FOUND$/,
      /^NEXT_REDIRECT$/,
    ],
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
