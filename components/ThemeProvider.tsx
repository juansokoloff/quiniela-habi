'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolved: Resolved
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'quiniela-theme'

function resolveTheme(t: Theme): Resolved {
  if (t === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return t
}

function applyClass(resolved: Resolved) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<Resolved>('light')

  // Load saved theme + subscribe to system preference changes.
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
    setThemeState(saved)
    const r = resolveTheme(saved)
    setResolved(r)
    applyClass(r)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme | null) === 'system') {
        const r2 = resolveTheme('system')
        setResolved(r2)
        applyClass(r2)
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  function setTheme(t: Theme) {
    localStorage.setItem(STORAGE_KEY, t)
    setThemeState(t)
    const r = resolveTheme(t)
    setResolved(r)
    applyClass(r)
  }

  function toggle() {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

/**
 * Inline script that runs before React hydration to set the dark class on
 * <html>, avoiding a flash of light content. Render as
 * `<Script strategy="beforeInteractive">` or directly inside <head>.
 */
export const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = saved === 'dark' || (saved === 'system' && prefersDark);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (_) {}
})();
`
