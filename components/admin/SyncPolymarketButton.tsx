'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'

export default function SyncPolymarketButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/polymarket/sync', { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setResult(`✓ ${data.updated}/${data.total} actualizados · ${data.discovered} descubiertos · ${data.missed} sin match`)
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
        className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
      >
        <TrendingUp className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? 'Sincronizando...' : 'Sync Polymarket'}
      </button>
    </div>
  )
}
