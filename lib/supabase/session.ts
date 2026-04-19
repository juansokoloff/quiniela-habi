import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/terms', '/api/auth/callback', '/api/matches/sync', '/api/matches/live-sync']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // For unauthenticated public routes, strip any attacker-supplied x-user-* headers
  if (!user) {
    const cleanHeaders = new Headers(request.headers)
    cleanHeaders.delete('x-user-id')
    cleanHeaders.delete('x-user-email')
    supabaseResponse = NextResponse.next({ request: { headers: cleanHeaders } })
    request.cookies.getAll().forEach(({ name, value }) => {
      supabaseResponse.cookies.set(name, value)
    })
    return supabaseResponse
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Always strip incoming x-user-* headers — callers must never be able to forge them.
  // We only set them below when the user is authenticated.
  if (user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('x-user-id')
    requestHeaders.delete('x-user-email')
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email ?? '')

    supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

    // Re-apply Supabase cookies onto the new response
    request.cookies.getAll().forEach(({ name, value }) => {
      supabaseResponse.cookies.set(name, value)
    })

    // Admin-only routes — use service role client to bypass RLS
    if (pathname.startsWith('/admin')) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
