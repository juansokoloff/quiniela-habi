import { NextRequest, NextResponse } from 'next/server'
import { createClient, getServerUser } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = await createClient()

  const { matchId, predictedHome, predictedAway } = await request.json()

  if (matchId === undefined || predictedHome === undefined || predictedAway === undefined) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
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
