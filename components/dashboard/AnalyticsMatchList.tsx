'use client'

import { useMemo, useState } from 'react'
import { MatchPhase } from '@/types'
import { phaseLabel } from '@/lib/scoring'
import { teamFlag } from '@/lib/flags'
import { MatchAnalytics } from '@/lib/stats'
import { normalizeMarket } from '@/lib/polymarket/client'
import MatchFilterBar, {
  DEFAULT_FILTERS,
  MatchFilters,
  filterMatches,
  derivePhaseOptions,
  deriveGroupOptions,
  deriveTeamOptions,
} from './MatchFilterBar'

const PHASE_ORDER: MatchPhase[] = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']

interface AnalyticsMatchListProps {
  analytics: MatchAnalytics[]
}

export default function AnalyticsMatchList({ analytics }: AnalyticsMatchListProps) {
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_FILTERS)

  const filterOptions = useMemo(() => ({
    phases: derivePhaseOptions(analytics),
    groups: deriveGroupOptions(analytics),
    teams: deriveTeamOptions(analytics),
  }), [analytics])

  const filtered = useMemo(() => filterMatches(analytics, filters), [analytics, filters])

  const grouped = new Map<MatchPhase, MatchAnalytics[]>()
  filtered.forEach(m => {
    if (!grouped.has(m.phase)) grouped.set(m.phase, [])
    grouped.get(m.phase)!.push(m)
  })

  return (
    <div className="space-y-6">
      <MatchFilterBar
        filters={filters}
        onChange={setFilters}
        availablePhases={filterOptions.phases}
        availableGroups={filterOptions.groups}
        availableTeams={filterOptions.teams}
        resultCount={filtered.length}
        totalCount={analytics.length}
      />

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No hay partidos que coincidan con los filtros.</p>
        </div>
      )}

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

function MatchAnalyticsCard({ match }: { match: MatchAnalytics }) {
  const hasResult = match.homeScore !== null && match.awayScore !== null
  const noPreds = match.totalPredictions === 0

  return (
    <div className={`rounded-xl border shadow-sm p-4 ${hasResult ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
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

      <p className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-1.5 flex-wrap">
        <span className="text-base leading-none" aria-hidden>{teamFlag(match.homeTeam)}</span>
        <span>{match.homeTeam}</span>
        <span className="text-gray-400 font-normal">vs</span>
        <span className="text-base leading-none" aria-hidden>{teamFlag(match.awayTeam)}</span>
        <span>{match.awayTeam}</span>
      </p>

      {noPreds ? (
        <p className="text-xs text-gray-400 italic text-center py-2">Sin predicciones aun</p>
      ) : (
        <div className="space-y-2.5">
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

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <p className="text-gray-500">Distribucion de predicciones</p>
              <span className="text-[10px] text-gray-400 italic">jugadores</span>
            </div>
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

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Prom. goles estimados</span>
            <span className="font-bold text-gray-700">{match.avgTotalGoals.toFixed(1)}</span>
          </div>

          {match.marketSlug && (match.marketHomeProb !== null || match.marketAwayProb !== null || match.marketDrawProb !== null) && (() => {
            const norm = normalizeMarket(match.marketHomeProb, match.marketDrawProb, match.marketAwayProb)
            return (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17l6-6 4 4 8-8v4h2V4h-7v2h4l-7 7-4-4-7 7z"/></svg>
                    Probabilidad de mercado
                  </span>
                  <span className="text-[10px] text-gray-400 italic">Polymarket</span>
                </div>
                <div className="flex items-center justify-end text-xs mb-1">
                  <MarketFavorite match={match} normalized={norm} />
                </div>
                <div className="flex gap-1 h-4 rounded-md overflow-hidden bg-gray-100">
                  {norm.home > 0 && (
                    <div className="bg-blue-400" style={{ width: `${norm.home * 100}%` }} title={`${match.homeTeam}: ${pct(norm.home)}`} />
                  )}
                  {norm.draw > 0 && (
                    <div className="bg-gray-400" style={{ width: `${norm.draw * 100}%` }} title={`Empate: ${pct(norm.draw)}`} />
                  )}
                  {norm.away > 0 && (
                    <div className="bg-red-400" style={{ width: `${norm.away * 100}%` }} title={`${match.awayTeam}: ${pct(norm.away)}`} />
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>{pct(norm.home)}</span>
                  <span>{pct(norm.draw)}</span>
                  <span>{pct(norm.away)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

function MarketFavorite({
  match,
  normalized,
}: {
  match: MatchAnalytics
  normalized: { home: number; draw: number; away: number }
}) {
  const { home, draw, away } = normalized
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
