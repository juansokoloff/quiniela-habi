import { redirect } from 'next/navigation'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { getMatchAnalytics, computeCalibration } from '@/lib/stats'
import AnalyticsMatchList from '@/components/dashboard/AnalyticsMatchList'
import CalibrationPanel from '@/components/dashboard/CalibrationPanel'

export default async function AnalyticsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_status')
    .eq('id', user.id)
    .single()

  if (profile?.payment_status !== 'approved') {
    redirect('/payment')
  }

  const analytics = await getMatchAnalytics(supabase)
  const calibration = computeCalibration(analytics)

  // Global summary
  const withPreds = analytics.filter(m => m.totalPredictions > 0)
  const avgParticipation = withPreds.length > 0
    ? withPreds.reduce((s, m) => s + m.pctWithPrediction, 0) / withPreds.length
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Datos agregados de todas las predicciones · {analytics[0]?.totalPlayers ?? 0} jugadores
        </p>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard
          label="Partidos disponibles"
          value={String(analytics.length)}
        />
        <SummaryCard
          label="Participacion promedio"
          value={`${avgParticipation.toFixed(0)}%`}
          sub="de jugadores con prediccion"
        />
        <SummaryCard
          label="Total predicciones"
          value={String(analytics.reduce((s, m) => s + m.totalPredictions, 0))}
        />
      </div>

      {/* Crowd vs market calibration */}
      <CalibrationPanel stats={calibration} />

      {/* Per-match analytics with filters */}
      <AnalyticsMatchList analytics={analytics} />
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
