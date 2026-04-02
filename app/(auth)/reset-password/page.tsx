'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('No pudimos actualizar tu contraseña. Intenta solicitar un nuevo enlace de recuperación.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 2000)
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
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Quiniela Habi · Mundial 2026</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm font-medium">
                Contraseña actualizada correctamente
              </p>
              <p className="text-green-700 text-xs mt-1">
                Redirigiendo al inicio...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Repite tu contraseña"
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
              {loading ? 'Actualizando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
