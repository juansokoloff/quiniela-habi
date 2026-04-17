import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const supabase = createAdminClient()

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { action, receiptId, userId, reason } = await request.json()

  // Verify receipt belongs to the stated userId
  const { data: receipt } = await supabase
    .from('payment_receipts')
    .select('user_id')
    .eq('id', receiptId)
    .single()

  if (!receipt || receipt.user_id !== userId) {
    return NextResponse.json({ error: 'El comprobante no corresponde a ese usuario' }, { status: 400 })
  }

  if (action === 'approve') {
    const [r1, r2] = await Promise.all([
      supabase
        .from('payment_receipts')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', receiptId),
      supabase
        .from('profiles')
        .update({ payment_status: 'approved', payment_validated_at: new Date().toISOString() })
        .eq('id', userId),
    ])

    if (r1.error || r2.error) {
      return NextResponse.json({ error: r1.error?.message || r2.error?.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Razón requerida' }, { status: 400 })
    }

    const [r1, r2] = await Promise.all([
      supabase
        .from('payment_receipts')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', receiptId),
      supabase
        .from('profiles')
        .update({ payment_status: 'rejected', payment_rejection_reason: reason })
        .eq('id', userId),
    ])

    if (r1.error || r2.error) {
      return NextResponse.json({ error: r1.error?.message || r2.error?.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
