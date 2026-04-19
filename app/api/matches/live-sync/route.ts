import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchWorldCupMatches, transformMatch } from '@/lib/football-api/client'
import { calculatePoints } from '@/lib/scoring'
import { MatchPhase } from '@/types'

// Lean, frequently-runnable sync. Intended to be hit by an external cron
// (e.g. cron-job.org — free, 1-minute resolution) every minute during match
// windows. Bails out immediately when there are no matches "near live" so we
// don't burn the football-data.org 10 req/min quota on idle days.
//
// "Near live" window: any match within [-10min, +180min] of now, i.e. starting
// soon or currently in play/recently-finished but not yet reconciled.

const LIVE_WINDOW_BEFORE_MS = 10 * 60 * 1000
const LIVE_WINDOW_AFTER_MS = 3 * 60 * 60 * 1000

async function hasMatchesInLiveWindow(): Promise<boolean> {
  const supabase = createAdminClient()
  const now = Date.now()
  const from = new Date(now - LIVE_WINDOW_AFTER_MS).toISOString()
  const to = new Date(now + LIVE_WINDOW_BEFORE_MS).toISOString()

  const { data, error } = await supabase
    .from('matches')
    .select('id, status', { count: 'exact' })
    .gte('match_date', from)
    .lte('match_date', to)
    .in('status', ['scheduled', 'live'])
    .limit(1)

  if (error) return false
  return (data?.length ?? 0) > 0
}

async function liveSync() {
  const supabase = createAdminClient()

  const matches = await fetchWorldCupMatches()
  const transformed = matches
    .map(transformMatch)
    .filter((m): m is NonNullable<typeof m> => m !== null)

  // Only upsert matches that are currently live OR just transitioned to
  // finished — skip scheduled rows (those are already correct from the daily
  // sync). Keeps update volume tiny so Realtime fan-out is cheap.
  const live = transformed.filter(m => m.status === 'live' || m.status === 'finished')
  if (!live.length) return { updated: 0, pointsUpdated: 0, reason: 'no-live-or-finished' }

  const { error: upsertError } = await supabase
    .from('matches')
    .upsert(live, { onConflict: 'external_id' })
  if (upsertError) throw new Error(upsertError.message)

  // Recalculate points for matches that just finished. Scheduled→live has no
  // final score yet, so nothing to score.
  const finished = live.filter(
    m => m.status === 'finished' && m.home_score !== null && m.away_score !== null
  )

  let pointsUpdated = 0
  for (const m of finished) {
    const { data: dbMatch } = await supabase
      .from('matches')
      .select('id, phase')
      .eq('external_id', m.external_id)
      .single()
    if (!dbMatch) continue

    const { data: preds } = await supabase
      .from('predictions')
      .select('id, predicted_home, predicted_away, points_earned')
      .eq('match_id', dbMatch.id)
    if (!preds?.length) continue

    for (const pred of preds) {
      const breakdown = calculatePoints(
        pred.predicted_home,
        pred.predicted_away,
        m.home_score!,
        m.away_score!,
        dbMatch.phase as MatchPhase
      )
      // Avoid no-op writes — skip if points_earned is already correct.
      if (pred.points_earned === breakdown.total) continue
      await supabase
        .from('predictions')
        .update({ points_earned: breakdown.total })
        .eq('id', pred.id)
      pointsUpdated++
    }
  }

  return { updated: live.length, pointsUpdated }
}

async function authorize(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return null
}

async function handle(request: NextRequest) {
  const unauthorized = await authorize(request)
  if (unauthorized) return unauthorized

  try {
    if (!(await hasMatchesInLiveWindow())) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no-matches-in-window' })
    }
    const result = await liveSync()
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
