'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L4 20H10V38H38V20H44L24 4Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="24" cy="26" r="9" fill="white" />
              <path d="M24 19.5L26.5 21.5L25.5 24.5H22.5L21.5 21.5L24 19.5Z" fill="#15803d" />
              <path d="M29.5 23L33 25L32 28.5L28.5 28L27.5 24.5L29.5 23Z" fill="#15803d" />
              <path d="M18.5 23L15 25L16 28.5L19.5 28L20.5 24.5L18.5 23Z" fill="#15803d" />
              <path d="M21 30.5L19 34L22 35L24 33L26 35L29 34L27 30.5L24 30L21 30.5Z" fill="#15803d" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quiniela Habi</h1>
          <p className="text-gray-500 text-sm mt-1">Mundial 2026</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="tu@habi.co"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Link href="/forgot-password" className="text-xs text-green-700 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-green-700 font-medium hover:underline">
            Registrate aqui
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by{' '}
          <a href="https://everyweekfantasy.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
            everyweekfantasy.com
          </a>
        </p>
      </div>
    </div>
  )
}
