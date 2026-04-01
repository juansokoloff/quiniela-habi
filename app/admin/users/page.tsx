import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminRoleToggle from '@/components/admin/AdminRoleToggle'
import PaymentToggle from '@/components/admin/PaymentToggle'

export default async function AdminUsersPage() {
  const user = await getServerUser()
  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  const approvedCount = users?.filter(u => u.payment_status === 'approved').length ?? 0
  const pendingCount = users?.filter(u => u.payment_status !== 'approved').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users?.length ?? 0} registrados</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-center">
            <p className="text-lg font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs text-green-600">Pagados</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5 text-center">
            <p className="text-lg font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs text-yellow-600">Sin pago</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white text-left">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3 text-center">Pago validado</th>
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
                  <td className="px-4 py-3 text-center">
                    <PaymentToggle userId={u.id} currentStatus={u.payment_status} />
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

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {role === 'admin' ? 'Admin' : 'Usuario'}
    </span>
  )
}
