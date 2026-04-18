import { createAdminClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { phaseLabel } from '@/lib/scoring'
import { MatchPhase } from '@/types'
import SyncMatchesButton from '@/components/admin/SyncMatchesButton'
import SyncPolymarketButton from '@/components/admin/SyncPolymarketButton'

export default async function AdminMatchesPage() {
  const supabase = createAdminClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  const withOdds = matches?.filter(m => m.polymarket_slug).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {matches?.length ?? 0} partidos · {withOdds} con odds de Polymarket
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SyncPolymarketButton />
          <SyncMatchesButton />
        </div>
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
                <th className="px-4 py-3">Polymarket</th>
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
                  <td className="px-4 py-3 text-xs">
                    {m.polymarket_slug ? (
                      (() => {
                        const n = normalize(m.polymarket_home_prob, m.polymarket_draw_prob, m.polymarket_away_prob)
                        return (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-gray-700 font-medium">
                              <span className="text-blue-600">{pct(n.home)}</span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-500">{pct(n.draw)}</span>
                              <span className="text-gray-400">·</span>
                              <span className="text-red-600">{pct(n.away)}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]" title={m.polymarket_slug}>
                              {m.polymarket_slug}
                            </p>
                          </div>
                        )
                      })()
                    ) : (
                      <span className="text-gray-300 italic">sin odds</span>
                    )}
                  </td>
                </tr>
              ))}
              {!matches?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
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

function pct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-'
  return `${Math.round(Number(v) * 100)}%`
}

// Polymarket exposes each outcome as a separate binary Yes/No market, so the
// raw "Yes" prices can sum to 105-135%. Normalize to 100% for display.
function normalize(
  home: number | null | undefined,
  draw: number | null | undefined,
  away: number | null | undefined
): { home: number; draw: number; away: number } {
  const h = Number(home ?? 0)
  const d = Number(draw ?? 0)
  const a = Number(away ?? 0)
  const sum = h + d + a
  if (sum === 0) return { home: 0, draw: 0, away: 0 }
  return { home: h / sum, draw: d / sum, away: a / sum }
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
