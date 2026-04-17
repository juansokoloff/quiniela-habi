import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { fetchOddsForMatch } from '@/lib/polymarket/client'

interface MatchRow {
  id: string
  home_team: string
  away_team: string
  match_date: string
  polymarket_slug: string | null
  status: string
}

async function syncPolymarket() {
  const supabase = createAdminClient()

  // Only sync matches that haven't finished yet
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, match_date, polymarket_slug, status')
    .neq('status', 'finished')
    .order('match_date', { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (matches ?? []) as MatchRow[]
  let updated = 0
  let discovered = 0
  let missed = 0

  for (const m of rows) {
    const odds = await fetchOddsForMatch(m.home_team, m.away_team, m.match_date, m.polymarket_slug)
    if (!odds) {
      missed++
      continue
    }

    const { error: upErr } = await supabase
      .from('matches')
      .update({
        polymarket_slug: odds.slug,
        polymarket_home_prob: odds.homeProb,
        polymarket_away_prob: odds.awayProb,
        polymarket_draw_prob: odds.drawProb,
        polymarket_volume: odds.volume,
        polymarket_updated_at: new Date().toISOString(),
      })
      .eq('id', m.id)

    if (!upErr) {
      updated++
      if (!m.polymarket_slug) discovered++
    }
  }

  return { total: rows.length, updated, discovered, missed }
}

// POST: manual admin call
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })

  if (authHeader !== `Bearer ${secret}`) {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const supabase = createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncPolymarket()
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET: called by Vercel cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncPolymarket()
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
