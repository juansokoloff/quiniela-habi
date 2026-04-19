'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, X } from 'lucide-react'
import Link from 'next/link'

interface Props {
  pendingCount: number
  /** Minutes until the next unpredicted match starts — optional flavor text. */
  nextMatchInMinutes?: number
}

const SESSION_KEY = 'quiniela-pending-shown'

/**
 * One-shot banner shown on app open when the user has upcoming matches
 * without a prediction. Suppressed for the rest of the session after first
 * display (dismiss or not). Re-appears next time the tab is opened fresh.
 *
 * Lives on the predictions page, which is where the user is most likely to
 * act on it. Keeps the notification client-only — SSR just passes the count.
 */
export default function PendingPredictionsBanner({
  pendingCount,
  nextMatchInMinutes,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (pendingCount <= 0) return
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(true)
  }, [pendingCount])

  function dismiss() {
    setVisible(false)
  }

  const urgent =
    typeof nextMatchInMinutes === 'number' && nextMatchInMinutes < 120

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className={`rounded-xl px-4 py-3 flex items-start gap-3 ${
            urgent
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : 'bg-green-50 border border-green-200 text-green-900'
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">
              {pendingCount === 1
                ? 'Tenés 1 partido próximo sin predecir'
                : `Tenés ${pendingCount} partidos próximos sin predecir`}
            </p>
            {urgent && nextMatchInMinutes !== undefined && (
              <p className="text-xs mt-0.5 opacity-90">
                El próximo arranca en {nextMatchInMinutes} min.
              </p>
            )}
            <Link
              href="#matches"
              onClick={dismiss}
              className="inline-block text-xs font-semibold mt-2 underline underline-offset-2"
            >
              Ir a predecir →
            </Link>
          </div>
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            className="opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
