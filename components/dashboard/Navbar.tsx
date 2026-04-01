'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/predictions', label: 'Predicciones' },
    { href: '/standings', label: 'Posiciones' },
  ]

  if (profile.role === 'admin') {
    links.push({ href: '/admin', label: 'Admin' })
  }

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">⚽ Quiniela Habi</span>
            <div className="hidden sm:flex gap-4">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-2 py-1 rounded transition ${
                    pathname === link.href
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
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
