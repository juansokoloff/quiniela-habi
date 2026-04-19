'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'quiniela-pwa-dismissed-at'
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 1 week

/**
 * Registers the service worker and renders a dismissible "install" chip when
 * the browser fires `beforeinstallprompt`. Respects a 1-week dismiss cooldown.
 * Silent on iOS (Safari doesn't fire the event) — users install via Share →
 * Add to Home Screen there.
 */
export default function PWAPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[pwa] sw registration failed', err)
      })
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-green-700 text-white flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Instalá Quiniela Habi
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Accedé más rápido y recibí el marcador en vivo como una app.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleInstall}
                className="text-xs font-semibold bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
