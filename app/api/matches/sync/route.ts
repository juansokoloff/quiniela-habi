import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { fetchWorldCupMatches, transformMatch } from '@/lib/football-api/client'
import { calculatePoints } from '@/lib/scoring'
import { MatchPhase } from '@/types'

async function syncMatches() {
  const supabase = createAdminClient()

  const matches = await fetchWorldCupMatches()
  const transformed = matches.map(transformMatch).filter((m): m is NonNullable<typeof m> => m !== null)

  const { error: upsertError } = await supabase
    .from('matches')
    .upsert(transformed, { onConflict: 'external_id' })

  if (upsertError) throw new Error(upsertError.message)

  // Update points for finished matches
  const finished = transformed.filter(
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
      .select('id, predicted_home, predicted_away')
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

      await supabase
        .from('predictions')
        .update({ points_earned: breakdown.total })
        .eq('id', pred.id)

      pointsUpdated++
    }
  }

  return { matchesSynced: transformed.length, pointsUpdated }
}

// POST: called manually by admin
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
    const result = await syncMatches()
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
    const result = await syncMatches()
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
