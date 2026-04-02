'use client'

import { useState, useEffect } from 'react'
import { Match, Prediction } from '@/types'
import { isEditable, phaseLabel, calculatePoints } from '@/lib/scoring'
import { Lock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
}

export default function MatchCard({ match, prediction }: MatchCardProps) {
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
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const hasResult = match.home_score !== null && match.away_score !== null
  const breakdown = hasResult && prediction?.predicted_home !== undefined
    ? calculatePoints(
        prediction.predicted_home,
        prediction.predicted_away!,
        match.home_score!,
        match.away_score!,
        match.phase
      )
    : null

  const hasPrediction = prediction?.predicted_home !== undefined && prediction?.predicted_home !== null

  return (
    <div className={`rounded-xl border shadow-sm p-4 ${
      hasPrediction && !hasResult
        ? 'bg-green-50/60 border-green-300'
        : 'bg-white border-gray-200'
    }`}>
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
          <span className="text-xs text-gray-400">
            {format(new Date(match.match_date), "d MMM · HH:mm", { locale: es })}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex-1 text-right">
          <p className="font-semibold text-gray-900 text-sm">{match.home_team}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Prediction inputs */}
          {editable ? (
            <>
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={home}
                onChange={e => {
                  setHome(e.target.value === '' ? '' : Number(e.target.value))
                  setError(null)
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
                  setAway(e.target.value === '' ? '' : Number(e.target.value))
                  setError(null)
                }}
                className="w-12 h-10 text-center border border-gray-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              />
            </>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              {prediction?.predicted_home !== undefined ? (
                <span className="text-lg font-bold text-gray-700">
                  {prediction.predicted_home} - {prediction.predicted_away}
                </span>
              ) : (
                <span className="text-sm text-gray-400 italic">Sin prediccion</span>
              )}
              <Lock className="w-3.5 h-3.5 ml-1 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 text-sm">{match.away_team}</p>
        </div>
      </div>

      {/* Real result */}
      {hasResult && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Resultado: {match.home_score} - {match.away_score}
            </span>
            {breakdown && (
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${breakdown.total > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                  +{breakdown.total} pts
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save button — only show when there are changes */}
      {editable && (hasChanges || error || saved) && (
        <div className="mt-3 flex items-center gap-2">
          {error && <p className="text-xs text-red-500 flex-1">{error}</p>}
          {saved && (
            <div className="flex items-center gap-1 text-green-600 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Guardado</span>
            </div>
          )}
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
    </div>
  )
}
