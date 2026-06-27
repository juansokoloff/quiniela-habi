'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'

interface PredictionRow {
  name: string
  predictedHome: number
  predictedAway: number
  pointsEarned: number | null
}

export default function MatchPredictions({ matchId, matchStatus, matchDate }: { matchId: string; matchStatus: string; matchDate: string }) {
  const [open, setOpen] = useState(false)
  const [predictions, setPredictions] = useState<PredictionRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  const matchStarted = matchStatus === 'live' || matchStatus === 'finished' || new Date(matchDate).getTime() <= Date.now()
  if (!matchStarted) return null

  async function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    if (!predictions) {
      setLoading(true)
      const res = await fetch(`/api/predictions/match?matchId=${matchId}`)
      if (res.ok) {
        const data = await res.json()
        setPredictions(data.predictions)
      }
      setLoading(false)
    }
    setOpen(true)
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200/60">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition w-full"
      >
        <Users className="w-3.5 h-3.5" />
        <span className="font-medium">Predicciones de todos</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
      </button>

      {open && (
        <div className="mt-2 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-3">Cargando...</p>
          ) : predictions?.length ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-1.5 font-medium">Jugador</th>
                  <th className="text-center py-1.5 font-medium">Predicción</th>
                  {matchStatus === 'finished' && (
                    <th className="text-right py-1.5 font-medium">Pts</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-700">{p.name}</td>
                    <td className="py-1.5 text-center font-mono font-semibold text-gray-800">
                      {p.predictedHome} - {p.predictedAway}
                    </td>
                    {matchStatus === 'finished' && (
                      <td className={`py-1.5 text-right font-bold ${
                        (p.pointsEarned ?? 0) >= 10 ? 'text-yellow-600' :
                        (p.pointsEarned ?? 0) > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {p.pointsEarned ?? 0}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">Nadie predijo este partido</p>
          )}
        </div>
      )}
    </div>
  )
}
