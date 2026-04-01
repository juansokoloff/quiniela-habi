import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentUpload from '@/components/dashboard/PaymentUpload'

export default async function PaymentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.payment_status === 'approved') redirect('/predictions')

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comprobante de pago</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Para participar en la quiniela debes pagar la cuota y subir el comprobante.
          Claude verificará automáticamente tu pago.
        </p>
      </div>

      {profile.payment_status === 'rejected' && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-medium text-sm">Pago rechazado</p>
          <p className="text-red-600 text-sm mt-1">
            {profile.payment_rejection_reason || 'El comprobante no fue válido. Intenta nuevamente.'}
          </p>
        </div>
      )}

      <PaymentUpload userId={user.id} />
    </div>
  )
}
