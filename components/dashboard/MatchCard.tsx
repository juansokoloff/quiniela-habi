'use client'

import { useState, useEffect } from 'react'
import { Match, Prediction } from '@/types'
import { isEditable, phaseLabel, calculatePoints } from '@/lib/scoring'
import { teamFlag } from '@/lib/flags'
import { Lock, CheckCircle, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import MatchPredictions from './MatchPredictions'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onPredictionChange?: (matchId: string, home: number | '', away: number | '') => void
  onSingleSaved?: (matchId: string) => void
}

export default function MatchCard({ match, prediction, onPredictionChange, onSingleSaved }: MatchCardProps) {
  const [home, setHome] = useState(prediction?.predicted_home ?? '')
  const [away, setAway] = useState(prediction?.predicted_away ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editable, setEditable] = useState(isEditable(match.match_date))

  useEffect(() => {
    const interval = setInterval(() => {
      setEditable(isEditable(match.match_date))
    }, 30000)
    return () => clearInterval(interval)
  }, [match.match_date])

  const savedHome = prediction?.predicted_home ?? ''
  const savedAway = prediction?.predicted_away ?? ''
  const hasChanges = String(home) !== String(savedHome) || String(away) !== String(savedAway)

  function validateGoals(value: string | number): string | null {
    if (value === '') return null
    const num = Number(value)
    if (!Number.isInteger(num) || num < 0) {
      return 'Solo se aceptan goles positivos y sin fracciones'
    }
    return null
  }

  async function handleSave() {
    if (home === '' || away === '') return
    const homeError = validateGoals(home)
    const awayError = validateGoals(away)
    if (homeError || awayError) {
      setError(homeError || awayError)
      return
    }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: match.id,
        predictedHome: Number(home),
        predictedAway: Number(away),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al guardar')
    } else {
      setSaved(true)
      onSingleSaved?.(match.id)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const hasResult = match.home_score !== null && match.away_score !== null
  const hasPrediction = prediction?.predicted_home !== undefined && prediction?.predicted_home !== null

  const breakdown = hasResult && hasPrediction
    ? calculatePoints(
        prediction!.predicted_home,
        prediction!.predicted_away!,
        match.home_score!,
        match.away_score!,
        match.phase
      )
    : null

  const isPerfect = breakdown?.total === (match.phase === 'group' ? 10 : 20)

  // Card background
  let cardClass = 'bg-white border-gray-200'
  if (hasResult && breakdown) {
    if (isPerfect) {
      cardClass = 'bg-yellow-50 border-yellow-300'
    } else if (breakdown.total > 0) {
      cardClass = 'bg-green-50/40 border-green-200'
    } else {
      cardClass = 'bg-gray-50 border-gray-200'
    }
  } else if (hasPrediction && !hasResult) {
    cardClass = 'bg-green-50/60 border-green-300'
  }

  return (
    <div className={`rounded-xl border shadow-sm p-4 ${cardClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          {phaseLabel(match.phase)}
          {match.group_name ? ` · ${match.group_name}` : ''}
        </span>
        <div className="flex items-center gap-2">
          {hasPrediction && !hasResult && !hasChanges && (
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              Guardado
            </span>
          )}
          {hasResult && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Finalizado
            </span>
          )}
          <span className="text-xs text-gray-400">
            {format(new Date(match.match_date), "d MMM · HH:mm", { locale: es })}
          </span>
        </div>
      </div>

      {/* Teams and prediction */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex-1 text-right">
          <p className="font-semibold text-gray-900 text-sm flex items-center justify-end gap-1.5">
            <span>{match.home_team}</span>
            <span className="text-lg leading-none" aria-hidden>{teamFlag(match.home_team)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editable ? (
            <>
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={home}
                onChange={e => {
                  const val = e.target.value === '' ? '' as const : Number(e.target.value)
                  setHome(val)
                  setError(null)
                  const otherVal = typeof away === 'number' ? away : '' as const
                  onPredictionChange?.(match.id, val, otherVal)
                }}
                className="w-12 h-10 text-center border border-gray-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={away}
                onChange={e => {
                  const val = e.target.value === '' ? '' as const : Number(e.target.value)
                  setAway(val)
                  setError(null)
                  const otherVal = typeof home === 'number' ? home : '' as const
                  onPredictionChange?.(match.id, otherVal, val)
                }}
                className="w-12 h-10 text-center border border-gray-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
            </>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              {hasPrediction ? (
                <span className="text-lg font-bold text-gray-700">
                  {prediction!.predicted_home} - {prediction!.predicted_away}
                </span>
              ) : (
                <span className="text-sm text-gray-400 italic">Sin prediccion</span>
              )}
              <Lock className="w-3.5 h-3.5 ml-1 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
            <span className="text-lg leading-none" aria-hidden>{teamFlag(match.away_team)}</span>
            <span>{match.away_team}</span>
          </p>
        </div>
      </div>

      {/* Result + points breakdown */}
      {hasResult && (
        <div className="mt-3 pt-3 border-t border-gray-200/60">
          {/* Real score */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Resultado</span>
            <span className="text-xl font-black text-gray-900">
              {match.home_score} - {match.away_score}
            </span>
          </div>

          {/* Points breakdown */}
          {breakdown && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  <PointBadge label="Ganador" value={breakdown.result} phase={match.phase} />
                  <PointBadge label="Local" value={breakdown.home_goals} phase={match.phase} />
                  <PointBadge label="Visita" value={breakdown.away_goals} phase={match.phase} />
                  <PointBadge label="Dif." value={breakdown.goal_diff} phase={match.phase} />
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                  isPerfect
                    ? 'bg-yellow-200 text-yellow-800'
                    : breakdown.total > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {isPerfect && <Trophy className="w-3.5 h-3.5" />}
                  <span className="text-sm font-bold">+{breakdown.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* No prediction message */}
          {!hasPrediction && (
            <p className="text-center text-xs text-gray-400 italic">Sin prediccion registrada</p>
          )}
        </div>
      )}

      {/* Save button */}
      {editable && (hasChanges || error || saved) && (
        <div className="mt-3 flex items-center gap-2">
          {error && <p className="text-xs text-red-500 flex-1">{error}</p>}
          <AnimatePresence>
            {saved && (
              <motion.div
                key="saved-indicator"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1 text-green-600 flex-1"
              >
                <motion.span
                  initial={{ scale: 0.4, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  <CheckCircle className="w-4 h-4" />
                </motion.span>
                <span className="text-xs font-medium">Guardado</span>
              </motion.div>
            )}
          </AnimatePresence>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving || home === '' || away === ''}
              className="ml-auto text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50 font-medium"
            >
              {saving ? 'Guardando...' : prediction ? 'Actualizar' : 'Guardar'}
            </button>
          )}
        </div>
      )}

      <MatchPredictions matchId={match.id} matchStatus={match.status} />
    </div>
  )
}

function PointBadge({ label, value, phase }: { label: string; value: number; phase: string }) {
  const got = value > 0
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${
      got ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-400'
    }`}>
      {label} {got ? `+${value}` : '0'}
    </span>
  )
}
