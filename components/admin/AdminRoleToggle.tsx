'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdminRoleToggleProps {
  userId: string
  currentRole: string
}

export default function AdminRoleToggle({ userId, currentRole }: AdminRoleToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const supabase = createClient()
    const newRole = currentRole === 'admin' ? 'user' : 'admin'

    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-lg font-medium transition disabled:opacity-50 ${
        currentRole === 'admin'
          ? 'bg-red-100 hover:bg-red-200 text-red-700'
          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
      }`}
    >
      {loading ? '...' : currentRole === 'admin' ? 'Quitar admin' : 'Hacer admin'}
    </button>
  )
}
