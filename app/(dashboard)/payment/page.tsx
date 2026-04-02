import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import PaymentUpload from '@/components/dashboard/PaymentUpload'

export default async function PaymentPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const supabase = createAdminClient()

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
          Sube tu comprobante de pago para participar en la quiniela.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-800">El comprobante debe mostrar:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><strong>Colombia:</strong> Pago a Nequi, llave BreB [REDACTED-NEQUI] por $20,000 COP</li>
          <li><strong>Mexico:</strong> Transferencia a CLABE [REDACTED-CLABE] por $100 MXN</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">Formatos aceptados: JPG, PNG, WEBP o PDF (max. 10MB)</p>
      </div>

      {profile.payment_status === 'rejected' && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-medium text-sm">Pago rechazado</p>
          <p className="text-red-600 text-sm mt-1">
            {profile.payment_rejection_reason || 'El comprobante no fue valido. Intenta nuevamente.'}
          </p>
        </div>
      )}

      <PaymentUpload userId={user.id} />
    </div>
  )
}
