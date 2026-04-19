'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLiveScores } from '@/lib/hooks/useLiveScores'
import { teamFlag } from '@/lib/flags'

/**
 * Slim banner that shows the current score of any live match, updated via
 * Supabase Realtime (with a 30s polling fallback). Renders nothing when there
 * are no live matches, so it's safe to mount globally in the dashboard layout.
 */
export default function LiveNowBanner() {
  const { matches, connected } = useLiveScores()

  return (
    <AnimatePresence initial={false}>
      {matches.length > 0 && (
        <motion.div
          key="live-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 overflow-x-auto">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide shrink-0">
              <span
                className={`inline-block w-2 h-2 rounded-full bg-white ${
                  connected ? 'animate-pulse' : 'opacity-60'
                }`}
                aria-hidden
              />
              En vivo
            </span>
            <div className="flex gap-4 items-center text-sm">
              {matches.map(m => (
                <div key={m.id} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span>{teamFlag(m.home_team)}</span>
                  <span className="font-medium">{m.home_team}</span>
                  <motion.span
                    key={`${m.home_score}-${m.away_score}`}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="font-bold tabular-nums"
                  >
                    {m.home_score ?? 0} - {m.away_score ?? 0}
                  </motion.span>
                  <span className="font-medium">{m.away_team}</span>
                  <span>{teamFlag(m.away_team)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
