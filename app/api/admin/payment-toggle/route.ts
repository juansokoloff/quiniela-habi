import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createAdminClient()

  // Verify caller is admin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { userId, newStatus } = await request.json()

  if (!userId || !['approved', 'pending'].includes(newStatus)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      payment_status: newStatus,
      payment_validated_at: newStatus === 'approved' ? new Date().toISOString() : null,
      payment_rejection_reason: null,
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, newStatus })
}
