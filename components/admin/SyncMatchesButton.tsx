'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export default function SyncMatchesButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/matches/sync', { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult(`✓ ${data.matchesSynced} partidos · ${data.pointsUpdated} puntos actualizados`)
      router.refresh()
    } else {
      setResult(`Error: ${data.error}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {result && <p className="text-sm text-gray-500">{result}</p>}
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Sincronizando...' : 'Sincronizar partidos'}
      </button>
    </div>
  )
}
