'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/Logo'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/predictions', label: 'Predicciones' },
    { href: '/standings', label: 'Posiciones' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/rules', label: 'Reglas' },
  ]

  if (profile.role === 'admin') {
    links.push({ href: '/admin', label: 'Admin' })
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href))
  }

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/predictions" className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-bold text-lg">Quiniela Habi</span>
            </Link>
            <div className="hidden sm:flex gap-4">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-2 py-1 rounded transition ${
                    isActive(link.href)
                      ? 'bg-white/20 text-white'
                      : 'text-green-100 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-100 hidden sm:block">
              {profile.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition hidden sm:block"
            >
              Salir
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-green-700">
          <div className="px-4 py-3 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-green-100 hover:bg-white/10 transition"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
