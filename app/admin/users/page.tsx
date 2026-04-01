import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminRoleToggle from '@/components/admin/AdminRoleToggle'

export default async function AdminUsersPage() {
  const user = await getServerUser()
  const supabase = await createAdminClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500 text-sm mt-0.5">{users?.length ?? 0} usuarios registrados</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white text-left">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Estado pago</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u, i) => (
                <tr key={u.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={u.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {format(new Date(u.created_at), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user?.id && (
                      <AdminRoleToggle userId={u.id} currentRole={u.role} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600'

  const labels = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }[status] || status

  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>{labels}</span>
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {role === 'admin' ? 'Admin' : 'Usuario'}
    </span>
  )
}
