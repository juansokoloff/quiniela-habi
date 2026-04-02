import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import MatchCard from '@/components/dashboard/MatchCard'
import { Match, Prediction, MatchPhase } from '@/types'
import { phaseLabel } from '@/lib/scoring'
import { getLeagueStats } from '@/lib/stats'

const PHASE_ORDER: MatchPhase[] = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']

export default async function PredictionsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') {
    redirect('/payment')
  }

  // Fetch data in parallel
  const [
    { data: matches },
    { data: predictions },
    stats,
  ] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    getLeagueStats(supabase, user.id),
  ])

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
      {/* Stats header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Predicciones</h1>
            <p className="text-gray-500 text-sm mt-0.5">Mundial 2026</p>
          </div>
          <div className="bg-green-700 text-white rounded-xl px-5 py-3 text-center">
            <p className="text-xs font-medium opacity-80">Mis puntos</p>
            <p className="text-3xl font-bold">{totalPoints}</p>
          </div>
        </div>

        {stats.finishedMatches > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Jugadores"
              value={String(stats.totalPlayers)}
              sub={`${stats.finishedMatches} partidos finalizados`}
            />
            <StatCompare
              label="Efectividad"
              userVal={stats.userEffectiveness}
              leagueVal={stats.leagueEffectiveness}
              suffix="%"
            />
            <StatCompare
              label="Ganadores acertados"
              userVal={stats.userWinnerAccuracy}
              leagueVal={stats.leagueWinnerAccuracy}
              suffix="%"
            />
            <StatCompare
              label="Prom. goles predichos"
              userVal={stats.avgPredictedGoalsUser}
              leagueVal={stats.avgPredictedGoalsLeague}
              suffix=""
              decimals={1}
              realVal={stats.avgRealGoals}
            />
          </div>
        )}
      </div>

      {/* Matches by phase */}
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
          <p className="text-lg">No hay partidos cargados aun.</p>
          <p className="text-sm mt-1">Los partidos del Mundial se sincronizaran automaticamente.</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function StatCompare({
  label,
  userVal,
  leagueVal,
  suffix,
  decimals = 0,
  realVal,
}: {
  label: string
  userVal: number
  leagueVal: number
  suffix: string
  decimals?: number
  realVal?: number
}) {
  const userBetter = userVal > leagueVal
  const same = Math.abs(userVal - leagueVal) < 0.5
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-2xl font-bold ${userBetter ? 'text-green-700' : same ? 'text-gray-900' : 'text-gray-900'}`}>
          {userVal.toFixed(decimals)}{suffix}
        </span>
        {userBetter && !same && (
          <span className="text-xs text-green-600 font-medium">mejor</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
        <span>Liga: {leagueVal.toFixed(decimals)}{suffix}</span>
        {realVal !== undefined && (
          <span>· Real: {realVal.toFixed(decimals)}</span>
        )}
      </div>
    </div>
  )
}
