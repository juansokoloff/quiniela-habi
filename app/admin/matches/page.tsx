import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { phaseLabel } from '@/lib/scoring'
import { MatchPhase } from '@/types'
import SyncMatchesButton from '@/components/admin/SyncMatchesButton'

export default async function AdminMatchesPage() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{matches?.length ?? 0} partidos</p>
        </div>
        <SyncMatchesButton />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white text-left">
                <th className="px-4 py-3">Partido</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {matches?.map((m, i) => (
                <tr key={m.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.home_team} vs {m.away_team}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {phaseLabel(m.phase as MatchPhase)}
                    {m.group_name ? ` · ${m.group_name}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {format(new Date(m.match_date), "d MMM · HH:mm", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono">
                    {m.home_score !== null ? `${m.home_score} - ${m.away_score}` : '-'}
                  </td>
                </tr>
              ))}
              {!matches?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No hay partidos. Usa el botón "Sincronizar" para cargar los partidos del Mundial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    scheduled: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700 animate-pulse',
    finished: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }[status] || 'bg-gray-100 text-gray-600'

  const labels = {
    scheduled: 'Programado',
    live: 'En vivo',
    finished: 'Finalizado',
    cancelled: 'Cancelado',
  }[status] || status

  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>{labels}</span>
}
