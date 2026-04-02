import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import Navbar from '@/components/dashboard/Navbar'
import { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const supabase = await createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile as Profile} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="py-4 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Powered by{' '}
          <a href="https://everyweekfantasy.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
            everyweekfantasy.com
          </a>
        </p>
      </footer>
    </div>
  )
}
