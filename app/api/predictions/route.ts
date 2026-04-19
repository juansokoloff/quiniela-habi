import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { predictionLimiter, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { success, reset } = await predictionLimiter.limit(user.id)
  if (!success) return rateLimitResponse(reset)

  const supabase = await createAdminClient()

  const { matchId, predictedHome, predictedAway } = await request.json()

  if (matchId === undefined || predictedHome === undefined || predictedAway === undefined) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (!Number.isInteger(predictedHome) || predictedHome < 0 ||
      !Number.isInteger(predictedAway) || predictedAway < 0) {
    return NextResponse.json({ error: 'Solo se aceptan goles positivos y sin fracciones' }, { status: 400 })
  }

  // Verify user has approved payment
  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') {
    return NextResponse.json({ error: 'Pago no aprobado' }, { status: 403 })
  }

  // Verify match is still editable (10 min cutoff)
  const { data: match } = await supabase
    .from('matches')
    .select('match_date, status')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  if (match.status !== 'scheduled') {
    return NextResponse.json({ error: 'El partido ya no permite predicciones' }, { status: 400 })
  }

  const cutoff = new Date(match.match_date).getTime() - 10 * 60 * 1000
  if (Date.now() >= cutoff) {
    return NextResponse.json({ error: 'El tiempo para predecir este partido ha terminado' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home: predictedHome,
        predicted_away: predictedAway,
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ prediction: data })
}
