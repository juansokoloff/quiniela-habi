import { Users, TrendingUp, Handshake, GitCompare } from 'lucide-react'
import { CalibrationStats } from '@/lib/stats'

/**
 * Renders the head-to-head between the quiniela's crowd consensus and the
 * Polymarket market consensus across all finished matches. Answers: "is the
 * quiniela calibrated? are we better or worse than the market?".
 */
export default function CalibrationPanel({ stats }: { stats: CalibrationStats }) {
  if (stats.finishedMatches === 0) {
    return null
  }

  const crowdWinsHead = stats.crowdRightDisagreed > stats.marketRightDisagreed
  const marketWinsHead = stats.marketRightDisagreed > stats.crowdRightDisagreed

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Quiniela vs. mercado</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Qué tanto le atinamos comparado con Polymarket, sobre{' '}
          {stats.finishedMatches} partidos jugados.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card
          icon={<Users className="w-4 h-4" />}
          label="Aciertos de la quiniela"
          value={`${Math.round(stats.crowdAccuracy)}%`}
          subtitle={`${stats.matchesWithCrowd} partidos con votos`}
          tone="green"
        />
        <Card
          icon={<TrendingUp className="w-4 h-4" />}
          label="Aciertos del mercado"
          value={`${Math.round(stats.marketAccuracy)}%`}
          subtitle={`${stats.matchesWithMarket} partidos con odds`}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card
          icon={<Handshake className="w-4 h-4" />}
          label="Coincidieron"
          value={`${stats.agreed}`}
          subtitle={
            stats.agreed > 0
              ? `${stats.agreedAndRight} aciertos (${Math.round(
                  (stats.agreedAndRight / stats.agreed) * 100
                )}%)`
              : 'sin datos'
          }
          tone="gray"
        />
        <Card
          icon={<GitCompare className="w-4 h-4" />}
          label="Opinaron distinto"
          value={`${stats.disagreed}`}
          subtitle={
            stats.disagreed > 0
              ? `quiniela ${stats.crowdRightDisagreed} · mercado ${stats.marketRightDisagreed}`
              : 'sin datos'
          }
          tone="gray"
        />
      </div>

      {stats.disagreed > 0 && (
        <p
          className={`text-sm font-medium rounded-lg px-3 py-2 ${
            crowdWinsHead
              ? 'bg-green-50 text-green-800'
              : marketWinsHead
              ? 'bg-blue-50 text-blue-800'
              : 'bg-gray-50 text-gray-700'
          }`}
        >
          {crowdWinsHead
            ? `Cuando opinamos distinto al mercado, la quiniela gana ${stats.crowdRightDisagreed}–${stats.marketRightDisagreed}. 🏆`
            : marketWinsHead
            ? `Cuando opinamos distinto al mercado, el mercado gana ${stats.marketRightDisagreed}–${stats.crowdRightDisagreed}.`
            : `Empate en los desacuerdos: ${stats.crowdRightDisagreed}–${stats.marketRightDisagreed}.`}
        </p>
      )}
    </section>
  )
}

function Card({
  icon,
  label,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle: string
  tone: 'green' | 'blue' | 'gray'
}) {
  const toneCls = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-50 text-gray-700',
  }[tone]

  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${toneCls}`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
    </div>
  )
}
