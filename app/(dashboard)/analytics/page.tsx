import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { getMatchAnalytics } from '@/lib/stats'
import { phaseLabel } from '@/lib/scoring'
import { MatchPhase } from '@/types'

const PHASE_ORDER: MatchPhase[] = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']

export default async function AnalyticsPage() {
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

  const analytics = await getMatchAnalytics(supabase)

  // Group by phase
  const grouped = new Map<MatchPhase, typeof analytics>()
  analytics.forEach(m => {
    if (!grouped.has(m.phase)) grouped.set(m.phase, [])
    grouped.get(m.phase)!.push(m)
  })

  // Global summary
  const withPreds = analytics.filter(m => m.totalPredictions > 0)
  const avgParticipation = withPreds.length > 0
    ? withPreds.reduce((s, m) => s + m.pctWithPrediction, 0) / withPreds.length
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Datos agregados de todas las predicciones · {analytics[0]?.totalPlayers ?? 0} jugadores
        </p>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard
          label="Partidos disponibles"
          value={String(analytics.length)}
        />
        <SummaryCard
          label="Participacion promedio"
          value={`${avgParticipation.toFixed(0)}%`}
          sub="de jugadores con prediccion"
        />
        <SummaryCard
          label="Total predicciones"
          value={String(analytics.reduce((s, m) => s + m.totalPredictions, 0))}
        />
      </div>

      {/* Per-match analytics by phase */}
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
              <MatchAnalyticsCard key={match.matchId} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function MatchAnalyticsCard({ match }: { match: Awaited<ReturnType<typeof getMatchAnalytics>>[number] }) {
  const hasResult = match.homeScore !== null && match.awayScore !== null
  const noPreds = match.totalPredictions === 0

  return (
    <div className={`rounded-xl border shadow-sm p-4 ${hasResult ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          {match.groupName ?? phaseLabel(match.phase)}
        </span>
        {hasResult && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {match.homeScore} - {match.awayScore}
          </span>
        )}
      </div>

      {/* Teams */}
      <p className="font-semibold text-gray-900 text-sm mb-3">
        {match.homeTeam} vs {match.awayTeam}
      </p>

      {noPreds ? (
        <p className="text-xs text-gray-400 italic text-center py-2">Sin predicciones aun</p>
      ) : (
        <div className="space-y-2.5">
          {/* Participation */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">{match.totalPredictions} predicciones</span>
              <span className="text-gray-500">{match.pctWithPrediction.toFixed(0)}% participacion</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(match.pctWithPrediction, 100)}%` }}
              />
            </div>
          </div>

          {/* Winner distribution */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Distribucion de predicciones</p>
            <div className="flex gap-1 h-5 rounded-lg overflow-hidden">
              {match.pctHomeWin > 0 && (
                <div
                  className="bg-blue-500 flex items-center justify-center"
                  style={{ width: `${match.pctHomeWin}%` }}
                  title={`${match.homeTeam}: ${match.pctHomeWin.toFixed(0)}%`}
                >
                  {match.pctHomeWin >= 15 && (
                    <span className="text-white text-[10px] font-bold">{match.pctHomeWin.toFixed(0)}%</span>
                  )}
                </div>
              )}
              {match.pctDraw > 0 && (
                <div
                  className="bg-gray-400 flex items-center justify-center"
                  style={{ width: `${match.pctDraw}%` }}
                  title={`Empate: ${match.pctDraw.toFixed(0)}%`}
                >
                  {match.pctDraw >= 15 && (
                    <span className="text-white text-[10px] font-bold">{match.pctDraw.toFixed(0)}%</span>
                  )}
                </div>
              )}
              {match.pctAwayWin > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center"
                  style={{ width: `${match.pctAwayWin}%` }}
                  title={`${match.awayTeam}: ${match.pctAwayWin.toFixed(0)}%`}
                >
                  {match.pctAwayWin >= 15 && (
                    <span className="text-white text-[10px] font-bold">{match.pctAwayWin.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span className="text-blue-600">{match.homeTeam.split(' ')[0]}</span>
              <span className="text-gray-500">Empate</span>
              <span className="text-red-600">{match.awayTeam.split(' ')[0]}</span>
            </div>
          </div>

          {/* Avg goals */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Prom. goles estimados</span>
            <span className="font-bold text-gray-700">{match.avgTotalGoals.toFixed(1)}</span>
          </div>

          {/* Polymarket favorite */}
          {match.marketSlug && (match.marketHomeProb !== null || match.marketAwayProb !== null || match.marketDrawProb !== null) && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17l6-6 4 4 8-8v4h2V4h-7v2h4l-7 7-4-4-7 7z"/></svg>
                  Mercado
                </span>
                <MarketFavorite match={match} />
              </div>
              <div className="flex gap-1 h-4 rounded-md overflow-hidden bg-gray-100">
                {(match.marketHomeProb ?? 0) > 0 && (
                  <div className="bg-blue-400" style={{ width: `${(match.marketHomeProb ?? 0) * 100}%` }} title={`${match.homeTeam}: ${pctMarket(match.marketHomeProb)}`} />
                )}
                {(match.marketDrawProb ?? 0) > 0 && (
                  <div className="bg-gray-400" style={{ width: `${(match.marketDrawProb ?? 0) * 100}%` }} title={`Empate: ${pctMarket(match.marketDrawProb)}`} />
                )}
                {(match.marketAwayProb ?? 0) > 0 && (
                  <div className="bg-red-400" style={{ width: `${(match.marketAwayProb ?? 0) * 100}%` }} title={`${match.awayTeam}: ${pctMarket(match.marketAwayProb)}`} />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>{pctMarket(match.marketHomeProb)}</span>
                <span>{pctMarket(match.marketDrawProb)}</span>
                <span>{pctMarket(match.marketAwayProb)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function pctMarket(v: number | null): string {
  if (v === null) return '-'
  return `${Math.round(v * 100)}%`
}

function MarketFavorite({ match }: { match: Awaited<ReturnType<typeof getMatchAnalytics>>[number] }) {
  const home = match.marketHomeProb ?? 0
  const draw = match.marketDrawProb ?? 0
  const away = match.marketAwayProb ?? 0
  const max = Math.max(home, draw, away)
  if (max === 0) return <span className="text-gray-400">sin datos</span>

  let label = ''
  let color = 'text-gray-600'
  if (max === home) { label = match.homeTeam; color = 'text-blue-600' }
  else if (max === away) { label = match.awayTeam; color = 'text-red-600' }
  else { label = 'Empate'; color = 'text-gray-600' }

  return (
    <span className={`font-semibold ${color}`}>
      {label} {Math.round(max * 100)}%
    </span>
  )
}
