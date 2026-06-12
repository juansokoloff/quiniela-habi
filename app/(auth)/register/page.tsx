'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ALLOWED_DOMAINS = ['habi.co', 'tuhabi.mx', 'pulppo.com', 'pulppo.mx', 'habicredit.co']

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      setError('Solo se permiten correos corporativos @habi.co, @tuhabi.mx, @pulppo.com, @pulppo.mx o @habicredit.co')
      return
    }

    if (password !== confirm) {
      setError('Las contrasenas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    if (!termsAccepted) {
      setError('Debes aceptar los terminos y condiciones para crear tu cuenta')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const acceptedAt = new Date().toISOString()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          terms_accepted_at: acceptedAt,
          terms_version: '2026-04-18',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setShowVerification(true)
  }

  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
          <p className="text-gray-600 text-sm mb-4">
            Enviamos un enlace de verificacion a <strong>{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Si no lo encuentras, revisa tu carpeta de spam.
          </p>
          <Link
            href="/login"
            className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            Ir a iniciar sesion
          </Link>
        </div>
      </div>
    )
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
          <p className="text-gray-500 text-sm mt-1">Crear cuenta · Mundial 2026</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="Juan Perez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="tu@habi.co"
            />
            <p className="text-xs text-gray-400 mt-1">Solo correos corporativos</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contrasena
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500 accent-green-700 shrink-0"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              He leído y acepto los{' '}
              <Link
                href="/terms"
                target="_blank"
                className="text-green-700 hover:underline font-medium"
              >
                términos y condiciones
              </Link>
              {' '}de Quiniela Habi.
            </span>
          </label>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-green-700 font-medium hover:underline">
            Ingresar
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-4 space-x-2">
          <Link href="/terms" className="hover:text-gray-600 hover:underline">
            Términos y condiciones
          </Link>
          <span>·</span>
          <span>
            Powered by{' '}
            <a href="https://everyweekfantasy.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
              everyweekfantasy.com
            </a>
          </span>
        </p>
      </div>
    </div>
  )
}
