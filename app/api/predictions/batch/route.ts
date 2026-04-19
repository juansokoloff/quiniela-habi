import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { predictionLimiter, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Count a batch as one op — same 30/min budget as single predictions.
  const { success, reset } = await predictionLimiter.limit(user.id)
  if (!success) return rateLimitResponse(reset)

  const supabase = createAdminClient()

  // Verify payment
  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') {
    return NextResponse.json({ error: 'Pago no aprobado' }, { status: 403 })
  }

  const { predictions } = await request.json() as {
    predictions: { matchId: string; predictedHome: number; predictedAway: number }[]
  }

  if (!predictions?.length) {
    return NextResponse.json({ error: 'No hay predicciones' }, { status: 400 })
  }

  // Validate all inputs
  for (const p of predictions) {
    if (!Number.isInteger(p.predictedHome) || p.predictedHome < 0 ||
        !Number.isInteger(p.predictedAway) || p.predictedAway < 0) {
      return NextResponse.json({ error: 'Solo se aceptan goles positivos y sin fracciones' }, { status: 400 })
    }
  }

  // Get match dates to verify editability
  const matchIds = predictions.map(p => p.matchId)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_date, status')
    .in('id', matchIds)

  const now = Date.now()
  const validMatchIds = new Set<string>()
  matches?.forEach(m => {
    const cutoff = new Date(m.match_date).getTime() - 10 * 60 * 1000
    if (now < cutoff && m.status === 'scheduled') {
      validMatchIds.add(m.id)
    }
  })

  const validPredictions = predictions.filter(p => validMatchIds.has(p.matchId))

  if (!validPredictions.length) {
    return NextResponse.json({ error: 'Ninguno de los partidos permite predicciones en este momento' }, { status: 400 })
  }

  // Upsert all predictions
  const rows = validPredictions.map(p => ({
    user_id: user.id,
    match_id: p.matchId,
    predicted_home: p.predictedHome,
    predicted_away: p.predictedAway,
  }))

  const { error } = await supabase
    .from('predictions')
    .upsert(rows, { onConflict: 'user_id,match_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: validPredictions.length, skipped: predictions.length - validPredictions.length })
}
