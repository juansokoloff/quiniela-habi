import { MatchPhase, ScoreBreakdown } from '@/types'

const MULTIPLIER: Record<MatchPhase, number> = {
  group: 1,
  round_of_32: 2,
  round_of_16: 2,
  quarter_final: 2,
  semi_final: 2,
  final: 2,
}

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  phase: MatchPhase
): ScoreBreakdown {
  const m = MULTIPLIER[phase]

  const predDiff = predictedHome - predictedAway
  const actualDiff = actualHome - actualAway

  const getWinner = (diff: number) => (diff > 0 ? 'home' : diff < 0 ? 'away' : 'draw')

  const result = getWinner(predDiff) === getWinner(actualDiff) ? 5 * m : 0
  const homeGoals = predictedHome === actualHome ? 2 * m : 0
  const awayGoals = predictedAway === actualAway ? 2 * m : 0
  const goalDiff = predDiff === actualDiff ? 1 * m : 0

  return {
    result,
    home_goals: homeGoals,
    away_goals: awayGoals,
    goal_diff: goalDiff,
    total: result + homeGoals + awayGoals + goalDiff,
  }
}

export function isEditable(matchDate: string): boolean {
  const cutoff = new Date(matchDate).getTime() - 10 * 60 * 1000
  return Date.now() < cutoff
}

export function phaseLabel(phase: MatchPhase): string {
  const labels: Record<MatchPhase, string> = {
    group: 'Fase de Grupos',
    round_of_32: 'Dieciseisavos de Final',
    round_of_16: 'Octavos de Final',
    quarter_final: 'Cuartos de Final',
    semi_final: 'Semifinal',
    final: 'Final',
  }
  return labels[phase]
}
