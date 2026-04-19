import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Upstash ratelimit — no-op if env vars are missing (local dev / previews).
// Free tier: 10k commands/day, more than enough for ~800 users.
// Docs: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = url && token ? new Redis({ url, token }) : null

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean; reset: number; remaining: number }>
}

function makeLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h'}`, prefix: string): Limiter {
  if (!redis) {
    // No-op limiter — always allows. Used locally / in previews without Upstash.
    return { limit: async () => ({ success: true, reset: 0, remaining: requests }) }
  }
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix: `quiniela:${prefix}`,
  })
  return { limit: (key: string) => rl.limit(key) }
}

// 75 predictions per minute per user — covers fast bulk editing without abuse.
export const predictionLimiter = makeLimiter(75, '1 m', 'pred')

// 10 uploads per hour per user — plenty for a receipt, blocks flooding.
export const uploadLimiter = makeLimiter(10, '1 h', 'upload')

// 5 payment-validations per hour per user — each one costs an Anthropic call.
export const paymentValidationLimiter = makeLimiter(5, '1 h', 'payval')

export function rateLimitResponse(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return new Response(
    JSON.stringify({
      error: 'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  )
}
