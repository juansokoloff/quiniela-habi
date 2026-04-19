'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LiveMatch {
  id: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  match_date: string
}

type Options = {
  /**
   * Poll /api/scores/live as a fallback when the Realtime channel isn't
   * subscribed (cold start, websocket blocked, etc.). Default 30s.
   * Set to 0 to disable polling entirely.
   */
  pollIntervalMs?: number
}

/**
 * Subscribes to live score updates for the matches table via Supabase
 * Realtime, with a polling fallback. Returns the current set of live matches.
 *
 * The Realtime channel covers the "fast path": the live-sync cron updates
 * `matches`, Postgres emits the change, clients receive it in ~1s.
 * The polling fallback covers the case where the websocket can't connect.
 */
export function useLiveScores({ pollIntervalMs = 30_000 }: Options = {}) {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [connected, setConnected] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    const supabase = supabaseRef.current
    let cancelled = false

    async function loadFromApi() {
      try {
        const res = await fetch('/api/scores/live', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as { matches: LiveMatch[] }
        if (!cancelled) setMatches(json.matches)
      } catch {
        // Network error — next tick will retry.
      }
    }

    // Seed from API so we don't render empty before the first Realtime event.
    loadFromApi()

    const channel = supabase
      .channel('live-scores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        payload => {
          const row = payload.new as LiveMatch | null
          if (!row) return
          setMatches(prev => {
            const others = prev.filter(m => m.id !== row.id)
            // Drop rows that are no longer live.
            return row.status === 'live' ? [...others, row] : others
          })
        }
      )
      .subscribe(status => {
        setConnected(status === 'SUBSCRIBED')
      })

    // Polling fallback — only ticks when the websocket isn't connected.
    const interval =
      pollIntervalMs > 0
        ? setInterval(() => {
            if (!cancelled && !connected) loadFromApi()
          }, pollIntervalMs)
        : null

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      if (interval) clearInterval(interval)
    }
    // We intentionally don't re-run on `connected` change to avoid re-subscribing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIntervalMs])

  return { matches, connected }
}
