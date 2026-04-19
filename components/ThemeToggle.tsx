'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  /** Visual variant — defaults to a style that reads well on a dark navbar. */
  variant?: 'onDark' | 'onLight'
}

export default function ThemeToggle({ variant = 'onDark' }: ThemeToggleProps) {
  const { resolved, toggle } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — icon depends on client-side state.
  useEffect(() => setMounted(true), [])

  const cls =
    variant === 'onDark'
      ? 'text-green-100 hover:text-white hover:bg-white/10'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      className={`p-1.5 rounded-lg transition ${cls}`}
    >
      {mounted && resolved === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  )
}
