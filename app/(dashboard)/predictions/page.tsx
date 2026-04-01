import { redirect } from 'next/navigation'
import { createClient, getServerUser } from '@/lib/supabase/server'
import MatchCard from '@/components/dashboard/MatchCard'
import { Match, Prediction, MatchPhase } from '@/types'
import { phaseLabel } from '@/lib/scoring'

const PHASE_ORDER: MatchPhase[] = ['group', 'round_of_16', 'quarter_final', 'semi_final', 'final']

export default async function PredictionsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') {
    redirect('/payment')
  }

  // Fetch all matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  // Fetch user predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)

  const predMap = new Map<string, Prediction>()
  predictions?.forEach(p => predMap.set(p.match_id, p))

  // Group by phase
  const grouped = new Map<MatchPhase, Match[]>()
  matches?.forEach(m => {
    const phase = m.phase as MatchPhase
    if (!grouped.has(phase)) grouped.set(phase, [])
    grouped.get(phase)!.push(m)
  })

  const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned || 0), 0) ?? 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Predicciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">Mundial 2026</p>
        </div>
        <div className="bg-green-700 text-white rounded-xl px-4 py-2 text-center">
          <p className="text-xs font-medium opacity-80">Mis puntos</p>
          <p className="text-2xl font-bold">{totalPoints}</p>
        </div>
      </div>

      {PHASE_ORDER.filter(phase => grouped.has(phase)).map(phase => (
        <section key={phase}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>{phaseLabel(phase)}</span>
            <span className="text-sm font-normal text-gray-400">
              ({grouped.get(phase)!.length} partidos)
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.get(phase)!.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {!matches?.length && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay partidos cargados aún.</p>
          <p className="text-sm mt-1">Los partidos del Mundial se sincronizarán automáticamente.</p>
        </div>
      )}
    </div>
  )
}
