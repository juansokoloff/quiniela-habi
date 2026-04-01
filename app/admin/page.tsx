import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createAdminClient()

  const [
    { count: totalUsers },
    { count: pendingPayments },
    { count: totalMatches },
    { count: finishedMatches },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('payment_receipts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
  ])

  const stats = [
    { label: 'Usuarios registrados', value: totalUsers ?? 0, href: '/admin/users', color: 'blue' },
    { label: 'Comprobantes pendientes', value: pendingPayments ?? 0, href: '/admin/payments', color: 'yellow', alert: (pendingPayments ?? 0) > 0 },
    { label: 'Partidos totales', value: totalMatches ?? 0, href: '/admin/matches', color: 'green' },
    { label: 'Partidos finalizados', value: finishedMatches ?? 0, href: '/admin/matches', color: 'gray' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quiniela Habi · Mundial 2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition ${
              stat.alert ? 'border-yellow-300' : 'border-gray-200'
            }`}
          >
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            {stat.alert && (
              <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                Requiere atención
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <SyncButton />
          <Link
            href="/admin/payments"
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition"
          >
            Revisar comprobantes
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition"
          >
            Gestionar usuarios
          </Link>
        </div>
      </div>
    </div>
  )
}

function SyncButton() {
  return (
    <form action="/api/matches/sync-action" method="POST">
      <button
        type="submit"
        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition"
      >
        Sincronizar partidos
      </button>
    </form>
  )
}
