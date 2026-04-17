import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function StandingsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') redirect('/payment')

  const { data: standings } = await supabase
    .from('standings')
    .select('*')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tabla de Posiciones</h1>
        <p className="text-gray-500 text-sm mt-0.5">Mundial 2026 · Quiniela Habi</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white text-left">
                <th className="px-4 py-3 font-semibold w-10">#</th>
                <th className="px-4 py-3 font-semibold">Jugador</th>
                <th className="px-4 py-3 font-semibold text-center">Pts</th>
                <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">Perfectos</th>
                <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">7 pts</th>
                <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">6 pts</th>
                <th className="px-4 py-3 font-semibold text-center hidden lg:table-cell">5 pts</th>
                <th className="px-4 py-3 font-semibold text-center hidden lg:table-cell">Predichos</th>
                <th className="px-4 py-3 font-semibold text-center hidden xl:table-cell">Registro</th>
              </tr>
            </thead>
            <tbody>
              {standings?.map((row, i) => (
                <tr
                  key={row.user_id}
                  className={`border-t border-gray-100 ${
                    row.user_id === user.id ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-500">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.full_name}
                    {row.user_id === user.id && (
                      <span className="ml-2 text-xs text-green-600 font-normal">(tú)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-green-700 text-base">
                    {row.total_points}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                    {row.perfect_scores}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 hidden md:table-cell">
                    {row.partial_scores_7}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 hidden md:table-cell">
                    {row.partial_scores_6}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 hidden lg:table-cell">
                    {row.partial_scores_5}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 hidden lg:table-cell">
                    {row.matches_predicted}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs hidden xl:table-cell">
                    {format(new Date(row.registration_date), 'd MMM', { locale: es })}
                  </td>
                </tr>
              ))}
              {!standings?.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Aún no hay posiciones disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Desempate: puntos totales → partidos perfectos → 7 pts → 6 pts → 5 pts → fecha de registro
      </p>
    </div>
  )
}
