import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase/server'

export default async function HomePage() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  redirect('/predictions')
}
