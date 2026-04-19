import { NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'

// Read-only endpoint: returns the current state of live matches straight from
// the DB. Used as a polling fallback for clients without a Realtime connection
// (flaky network, browser without websockets, etc.).

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, status, match_date')
    .eq('status', 'live')
    .order('match_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    { matches: data ?? [] },
    {
      headers: {
        // Short edge cache so a stampede of pollers doesn't flood the DB.
        'Cache-Control': 's-maxage=15, stale-while-revalidate=45',
      },
    }
  )
}
