import { createAdminClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PaymentActions from '@/components/admin/PaymentActions'

export default async function AdminPaymentsPage() {
  const supabase = createAdminClient()

  // Fetch receipts and profiles separately to avoid join issues
  const { data: receipts, error: receiptsError } = await supabase
    .from('payment_receipts')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  const profileMap = new Map<string, { full_name: string; email: string }>()
  profiles?.forEach(p => profileMap.set(p.id, { full_name: p.full_name, email: p.email }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comprobantes de Pago</h1>
        <p className="text-gray-500 text-sm mt-0.5">{receipts?.length ?? 0} comprobantes</p>
      </div>

      <div className="space-y-3">
        {receipts?.map(receipt => (
          <div key={receipt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">
                  {profileMap.get(receipt.user_id)?.full_name ?? 'Usuario desconocido'}
                </p>
                <p className="text-sm text-gray-500">
                  {profileMap.get(receipt.user_id)?.email ?? ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(receipt.created_at), "d MMM yyyy · HH:mm", { locale: es })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={receipt.status} />
                <a
                  href={`/api/admin/receipt?id=${receipt.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver comprobante
                </a>
              </div>
            </div>

            {receipt.claude_analysis && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <span className="font-medium">Análisis Claude: </span>
                {receipt.claude_analysis}
              </div>
            )}

            <PaymentActions
              receiptId={receipt.id}
              userId={receipt.user_id}
              currentStatus={receipt.status}
            />
          </div>
        ))}

        {!receipts?.length && (
          <div className="text-center py-12 text-gray-400">
            No hay comprobantes registrados.
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-700'

  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }[status] || status

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles}`}>
      {labels}
    </span>
  )
}
