import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/dashboard/Navbar'
import { Profile } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/payments', label: 'Comprobantes' },
    { href: '/admin/users', label: 'Usuarios' },
    { href: '/admin/matches', label: 'Partidos' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile as Profile} />
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto py-2">
            {adminLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-white whitespace-nowrap py-1 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
