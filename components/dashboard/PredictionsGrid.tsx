'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import MatchCard from './MatchCard'
import MatchFilterBar, {
  DEFAULT_FILTERS,
  MatchFilters,
  filterMatches,
  derivePhaseOptions,
  deriveGroupOptions,
  deriveTeamOptions,
} from './MatchFilterBar'
import { Match, Prediction, MatchPhase } from '@/types'
import { phaseLabel } from '@/lib/scoring'
import { Save, Loader2, CheckCircle } from 'lucide-react'

const PHASE_ORDER: MatchPhase[] = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final']

interface PendingChange {
  matchId: string
  predictedHome: number
  predictedAway: number
}

interface PredictionsGridProps {
  matches: Match[]
  predictions: Prediction[]
}

export default function PredictionsGrid({ matches, predictions }: PredictionsGridProps) {
  const router = useRouter()
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<string | null>(null)
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_FILTERS)

  const predMap = new Map<string, Prediction>()
  predictions.forEach(p => predMap.set(p.match_id, p))

  const filterOptions = useMemo(() => ({
    phases: derivePhaseOptions(matches),
    groups: deriveGroupOptions(matches),
    teams: deriveTeamOptions(matches),
  }), [matches])

  const filteredMatches = useMemo(() => filterMatches(matches, filters), [matches, filters])

  // Group by phase
  const grouped = new Map<MatchPhase, Match[]>()
  filteredMatches.forEach(m => {
    const phase = m.phase as MatchPhase
    if (!grouped.has(phase)) grouped.set(phase, [])
    grouped.get(phase)!.push(m)
  })

  const handlePredictionChange = useCallback((matchId: string, home: number | '', away: number | '') => {
    setPendingChanges(prev => {
      const next = new Map(prev)
      if (home === '' || away === '') {
        next.delete(matchId)
      } else {
        next.set(matchId, { matchId, predictedHome: home, predictedAway: away })
      }
      return next
    })
    setSaveResult(null)
  }, [])

  const handleSingleSaved = useCallback((matchId: string) => {
    setPendingChanges(prev => {
      const next = new Map(prev)
      next.delete(matchId)
      return next
    })
  }, [])

  async function handleSaveAll() {
    if (pendingChanges.size === 0) return
    setSaving(true)
    setSaveResult(null)

    const preds = Array.from(pendingChanges.values())

    const res = await fetch('/api/predictions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictions: preds }),
    })

    const data = await res.json()

    if (res.ok) {
      setSaveResult(`${data.saved} predicciones guardadas${data.skipped > 0 ? ` (${data.skipped} omitidas por tiempo)` : ''}`)
      setPendingChanges(new Map())
      setTimeout(() => {
        setSaveResult(null)
        router.refresh()
      }, 2000)
    } else {
      setSaveResult(data.error || 'Error al guardar')
    }
    setSaving(false)
  }

  const changesCount = pendingChanges.size

  return (
    <>
      {matches.length > 0 && (
        <MatchFilterBar
          filters={filters}
          onChange={setFilters}
          availablePhases={filterOptions.phases}
          availableGroups={filterOptions.groups}
          availableTeams={filterOptions.teams}
          resultCount={filteredMatches.length}
          totalCount={matches.length}
        />
      )}
      {filteredMatches.length === 0 && matches.length > 0 && (
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
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
                onPredictionChange={handlePredictionChange}
                onSingleSaved={handleSingleSaved}
              />
            ))}
          </div>
        </section>
      ))}

      {!matches.length && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay partidos cargados aun.</p>
          <p className="text-sm mt-1">Los partidos del Mundial se sincronizaran automaticamente.</p>
        </div>
      )}

      {/* Floating save all bar */}
      {(changesCount > 0 || saveResult) && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="bg-green-800 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center justify-between gap-4">
              {saveResult ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">{saveResult}</span>
                </div>
              ) : (
                <span className="text-sm">
                  <strong>{changesCount}</strong> {changesCount === 1 ? 'prediccion sin guardar' : 'predicciones sin guardar'}
                </span>
              )}
              {changesCount > 0 && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex items-center gap-2 bg-white text-green-800 font-semibold px-5 py-2 rounded-lg hover:bg-green-50 transition disabled:opacity-60 text-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Guardando...' : 'Guardar todo'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
