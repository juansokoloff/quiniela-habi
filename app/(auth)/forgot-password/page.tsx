'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError('No pudimos enviar el correo. Verifica tu dirección e intenta de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Quiniela Habi · Mundial 2026</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm font-medium">
                Revisa tu correo electrónico
              </p>
              <p className="text-green-700 text-xs mt-1">
                Enviamos un enlace de recuperación a <strong>{email}</strong>.
                Haz clic en el enlace para restablecer tu contraseña.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              ¿No lo ves? Revisa tu carpeta de spam.
            </p>
            <Link href="/login" className="inline-block text-sm text-green-700 font-medium hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/login" className="text-green-700 font-medium hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
