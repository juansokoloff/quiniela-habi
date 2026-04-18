'use client'

import { MatchPhase } from '@/types'
import { phaseLabel } from '@/lib/scoring'
import { teamFlag } from '@/lib/flags'
import { X } from 'lucide-react'

export type MatchStatusFilter = 'all' | 'upcoming' | 'finished'

export interface MatchFilters {
  phase: MatchPhase | 'all'
  group: string | 'all'
  team: string | 'all'
  status: MatchStatusFilter
}

export const DEFAULT_FILTERS: MatchFilters = {
  phase: 'all',
  group: 'all',
  team: 'all',
  status: 'all',
}

interface MatchFilterBarProps {
  filters: MatchFilters
  onChange: (next: MatchFilters) => void
  availablePhases: MatchPhase[]
  availableGroups: string[]
  availableTeams: string[]
  resultCount: number
  totalCount: number
}

export default function MatchFilterBar({
  filters,
  onChange,
  availablePhases,
  availableGroups,
  availableTeams,
  resultCount,
  totalCount,
}: MatchFilterBarProps) {
  const active = filters !== DEFAULT_FILTERS && (
    filters.phase !== 'all' ||
    filters.group !== 'all' ||
    filters.team !== 'all' ||
    filters.status !== 'all'
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filters.status}
          onChange={e => onChange({ ...filters, status: e.target.value as MatchStatusFilter })}
          className="text-sm border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
        >
          <option value="all">Todos los partidos</option>
          <option value="upcoming">Proximos</option>
          <option value="finished">Finalizados</option>
        </select>

        <select
          value={filters.phase}
          onChange={e => onChange({ ...filters, phase: e.target.value as MatchPhase | 'all' })}
          className="text-sm border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
        >
          <option value="all">Todas las fases</option>
          {availablePhases.map(p => (
            <option key={p} value={p}>{phaseLabel(p)}</option>
          ))}
        </select>

        {availableGroups.length > 0 && (
          <select
            value={filters.group}
            onChange={e => onChange({ ...filters, group: e.target.value })}
            className="text-sm border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
          >
            <option value="all">Todos los grupos</option>
            {availableGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}

        <select
          value={filters.team}
          onChange={e => onChange({ ...filters, team: e.target.value })}
          className="text-sm border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 max-w-[200px]"
        >
          <option value="all">Todos los paises</option>
          {availableTeams.map(t => (
            <option key={t} value={t}>{`${teamFlag(t)} ${t}`.trim()}</option>
          ))}
        </select>

        {active && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {resultCount === totalCount
            ? `${totalCount} partidos`
            : `${resultCount} de ${totalCount} partidos`}
        </span>
      </div>
    </div>
  )
}

export function filterMatches<T extends {
  phase: MatchPhase
  group_name?: string | null
  groupName?: string | null
  home_team?: string
  away_team?: string
  homeTeam?: string
  awayTeam?: string
  status?: string
  home_score?: number | null
  away_score?: number | null
  homeScore?: number | null
  awayScore?: number | null
}>(matches: T[], filters: MatchFilters): T[] {
  return matches.filter(m => {
    if (filters.phase !== 'all' && m.phase !== filters.phase) return false

    const group = m.group_name ?? m.groupName ?? null
    if (filters.group !== 'all' && group !== filters.group) return false

    const home = m.home_team ?? m.homeTeam ?? ''
    const away = m.away_team ?? m.awayTeam ?? ''
    if (filters.team !== 'all' && home !== filters.team && away !== filters.team) return false

    if (filters.status !== 'all') {
      const hs = m.home_score ?? m.homeScore ?? null
      const as = m.away_score ?? m.awayScore ?? null
      const finished = (m.status === 'finished') || (hs !== null && as !== null)
      if (filters.status === 'finished' && !finished) return false
      if (filters.status === 'upcoming' && finished) return false
    }

    return true
  })
}

export function derivePhaseOptions<T extends { phase: MatchPhase }>(matches: T[]): MatchPhase[] {
  const order: MatchPhase[] = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']
  const seen = new Set<MatchPhase>()
  matches.forEach(m => seen.add(m.phase))
  return order.filter(p => seen.has(p))
}

export function deriveGroupOptions<T extends { group_name?: string | null; groupName?: string | null }>(matches: T[]): string[] {
  const set = new Set<string>()
  matches.forEach(m => {
    const g = m.group_name ?? m.groupName
    if (g) set.add(g)
  })
  return Array.from(set).sort()
}

export function deriveTeamOptions<T extends {
  home_team?: string
  away_team?: string
  homeTeam?: string
  awayTeam?: string
}>(matches: T[]): string[] {
  const set = new Set<string>()
  matches.forEach(m => {
    const h = m.home_team ?? m.homeTeam
    const a = m.away_team ?? m.awayTeam
    if (h) set.add(h)
    if (a) set.add(a)
  })
  return Array.from(set).sort()
}
