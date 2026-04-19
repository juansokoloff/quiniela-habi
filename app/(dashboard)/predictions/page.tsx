import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import PredictionsGrid from '@/components/dashboard/PredictionsGrid'
import PendingPredictionsBanner from '@/components/dashboard/PendingPredictionsBanner'
import { Match, Prediction } from '@/types'
import { getLeagueStats } from '@/lib/stats'

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

  const totalPoints = predictions?.reduce((sum, p) => sum + (p.points_earned || 0), 0) ?? 0

  // Count upcoming editable matches (scheduled, >10 min away) without a prediction
  const predictedIds = new Set(predictions?.map(p => p.match_id) ?? [])
  const now = Date.now()
  const upcoming = (matches ?? []).filter(m => {
    if (m.status !== 'scheduled') return false
    const cutoff = new Date(m.match_date).getTime() - 10 * 60 * 1000
    return now < cutoff
  })
  const pending = upcoming.filter(m => !predictedIds.has(m.id))
  const pendingCount = pending.length
  const nextPending = pending[0]
  const nextMatchInMinutes = nextPending
    ? Math.max(
        0,
        Math.round((new Date(nextPending.match_date).getTime() - now) / 60000)
      )
    : undefined

  return (
    <div className="space-y-8">
      <PendingPredictionsBanner
        pendingCount={pendingCount}
        nextMatchInMinutes={nextMatchInMinutes}
      />
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

      {/* Matches grid with save all */}
      <PredictionsGrid
        matches={(matches ?? []) as Match[]}
        predictions={(predictions ?? []) as Prediction[]}
      />
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
