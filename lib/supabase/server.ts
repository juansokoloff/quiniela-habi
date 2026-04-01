import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Service role client — bypasses RLS, no cookies needed
// Safe because the proxy already validates the JWT before any server component runs
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Read user from request headers injected by the proxy
// The proxy validates the JWT — server components just trust the header
export async function getServerUser() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')
  if (!userId) return null
  return { id: userId, email: userEmail ?? '' }
}
