import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const matchId = request.nextUrl.searchParams.get('matchId')
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })

  const supabase = createAdminClient()

  // Verify user has approved payment
  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') {
    return NextResponse.json({ error: 'Pago no aprobado' }, { status: 403 })
  }

  // Only reveal predictions for live or finished matches
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  if (match.status !== 'live' && match.status !== 'finished') {
    return NextResponse.json({ error: 'Las predicciones se revelan cuando el partido comienza' }, { status: 403 })
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('predicted_home, predicted_away, points_earned, profiles!inner(full_name)')
    .eq('match_id', matchId)
    .order('points_earned', { ascending: false, nullsFirst: false })

  const rows = (predictions ?? []).map((p: Record<string, unknown>) => ({
    name: (p.profiles as Record<string, unknown>)?.full_name ?? '',
    predictedHome: p.predicted_home as number,
    predictedAway: p.predicted_away as number,
    pointsEarned: p.points_earned as number | null,
  }))

  return NextResponse.json({ predictions: rows })
}
