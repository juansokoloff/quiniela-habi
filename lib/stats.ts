import { SupabaseClient } from '@supabase/supabase-js'
import { MatchPhase } from '@/types'

interface MatchWithPredictions {
  id: string
  home_team: string
  away_team: string
  match_date: string
  phase: MatchPhase
  group_name: string | null
  status: string
  home_score: number | null
  away_score: number | null
}

interface PredictionRow {
  match_id: string
  user_id: string
  predicted_home: number
  predicted_away: number
  points_earned: number | null
}

export interface LeagueStats {
  totalPlayers: number
  // Effectiveness
  leagueEffectiveness: number
  userEffectiveness: number
  // Winner accuracy
  leagueWinnerAccuracy: number
  userWinnerAccuracy: number
  // Goals comparison
  avgRealGoals: number
  avgPredictedGoalsLeague: number
  avgPredictedGoalsUser: number
  // Counts
  finishedMatches: number
  userPredictionsOnFinished: number
}

export interface MatchAnalytics {
  matchId: string
  homeTeam: string
  awayTeam: string
  matchDate: string
  phase: MatchPhase
  groupName: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
  totalPredictions: number
  totalPlayers: number
  pctWithPrediction: number
  pctWithoutPrediction: number
  pctHomeWin: number
  pctDraw: number
  pctAwayWin: number
  avgTotalGoals: number
  // Polymarket odds (null if no market data)
  marketHomeProb: number | null
  marketAwayProb: number | null
  marketDrawProb: number | null
  marketSlug: string | null
}

export async function getLeagueStats(
  supabase: SupabaseClient,
  userId: string
): Promise<LeagueStats> {
  // Get total approved players
  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'approved')

  // Get all finished matches
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('id, phase, home_score, away_score')
    .eq('status', 'finished')

  if (!finishedMatches?.length) {
    return {
      totalPlayers: totalPlayers ?? 0,
      leagueEffectiveness: 0,
      userEffectiveness: 0,
      leagueWinnerAccuracy: 0,
      userWinnerAccuracy: 0,
      avgRealGoals: 0,
      avgPredictedGoalsLeague: 0,
      avgPredictedGoalsUser: 0,
      finishedMatches: 0,
      userPredictionsOnFinished: 0,
    }
  }

  const finishedIds = finishedMatches.map(m => m.id)

  // Get all predictions for finished matches
  const { data: allPreds } = await supabase
    .from('predictions')
    .select('match_id, user_id, predicted_home, predicted_away, points_earned')
    .in('match_id', finishedIds)

  const preds = (allPreds ?? []) as PredictionRow[]
  const userPreds = preds.filter(p => p.user_id === userId)

  // Max points per match
  const maxPointsMap = new Map<string, number>()
  finishedMatches.forEach(m => {
    maxPointsMap.set(m.id, m.phase === 'group' ? 10 : 20)
  })

  // League effectiveness: total points earned / total possible points (only counting predictions that exist)
  const leagueTotalEarned = preds.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const leagueTotalPossible = preds.reduce((s, p) => s + (maxPointsMap.get(p.match_id) ?? 10), 0)
  const leagueEffectiveness = leagueTotalPossible > 0 ? (leagueTotalEarned / leagueTotalPossible) * 100 : 0

  const userTotalEarned = userPreds.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const userTotalPossible = userPreds.reduce((s, p) => s + (maxPointsMap.get(p.match_id) ?? 10), 0)
  const userEffectiveness = userTotalPossible > 0 ? (userTotalEarned / userTotalPossible) * 100 : 0

  // Winner accuracy
  const getWinner = (h: number, a: number) => h > a ? 'home' : h < a ? 'away' : 'draw'

  const matchResultMap = new Map<string, string>()
  finishedMatches.forEach(m => {
    if (m.home_score !== null && m.away_score !== null) {
      matchResultMap.set(m.id, getWinner(m.home_score, m.away_score))
    }
  })

  let leagueCorrectWinners = 0
  let leagueTotalWithPred = 0
  preds.forEach(p => {
    const actual = matchResultMap.get(p.match_id)
    if (actual) {
      leagueTotalWithPred++
      if (getWinner(p.predicted_home, p.predicted_away) === actual) {
        leagueCorrectWinners++
      }
    }
  })
  const leagueWinnerAccuracy = leagueTotalWithPred > 0 ? (leagueCorrectWinners / leagueTotalWithPred) * 100 : 0

  let userCorrectWinners = 0
  let userTotalWithPred = 0
  userPreds.forEach(p => {
    const actual = matchResultMap.get(p.match_id)
    if (actual) {
      userTotalWithPred++
      if (getWinner(p.predicted_home, p.predicted_away) === actual) {
        userCorrectWinners++
      }
    }
  })
  const userWinnerAccuracy = userTotalWithPred > 0 ? (userCorrectWinners / userTotalWithPred) * 100 : 0

  // Goals comparison
  const avgRealGoals = finishedMatches.reduce((s, m) =>
    s + (m.home_score ?? 0) + (m.away_score ?? 0), 0) / finishedMatches.length

  const avgPredictedGoalsLeague = preds.length > 0
    ? preds.reduce((s, p) => s + p.predicted_home + p.predicted_away, 0) / preds.length
    : 0

  const avgPredictedGoalsUser = userPreds.length > 0
    ? userPreds.reduce((s, p) => s + p.predicted_home + p.predicted_away, 0) / userPreds.length
    : 0

  return {
    totalPlayers: totalPlayers ?? 0,
    leagueEffectiveness,
    userEffectiveness,
    leagueWinnerAccuracy,
    userWinnerAccuracy,
    avgRealGoals,
    avgPredictedGoalsLeague,
    avgPredictedGoalsUser,
    finishedMatches: finishedMatches.length,
    userPredictionsOnFinished: userPreds.length,
  }
}

export interface CalibrationStats {
  finishedMatches: number
  matchesWithCrowd: number
  matchesWithMarket: number
  crowdAccuracy: number // pct of finished matches where crowd majority picked the actual winner
  marketAccuracy: number // pct where market favorite was the actual winner
  agreed: number // both picked the same winner
  agreedAndRight: number // and were right
  disagreed: number // picked different winners
  crowdRightDisagreed: number // when they disagreed, crowd was right
  marketRightDisagreed: number // when they disagreed, market was right
}

type WinnerPick = 'home' | 'draw' | 'away'

function pickWinner(home: number, draw: number, away: number): WinnerPick | null {
  const m = Math.max(home, draw, away)
  if (m === 0) return null
  if (m === home) return 'home'
  if (m === away) return 'away'
  return 'draw'
}

export function computeCalibration(analytics: MatchAnalytics[]): CalibrationStats {
  const finished = analytics.filter(
    a => a.status === 'finished' && a.homeScore !== null && a.awayScore !== null
  )

  let matchesWithCrowd = 0
  let matchesWithMarket = 0
  let crowdRight = 0
  let marketRight = 0
  let agreed = 0
  let agreedAndRight = 0
  let disagreed = 0
  let crowdRightDisagreed = 0
  let marketRightDisagreed = 0

  for (const m of finished) {
    const actualWinner: WinnerPick =
      m.homeScore! > m.awayScore! ? 'home'
      : m.homeScore! < m.awayScore! ? 'away'
      : 'draw'

    const crowdPick = pickWinner(m.pctHomeWin, m.pctDraw, m.pctAwayWin)
    const hasMarket = m.marketHomeProb !== null && m.marketAwayProb !== null && m.marketDrawProb !== null
    const marketPick = hasMarket
      ? pickWinner(m.marketHomeProb!, m.marketDrawProb!, m.marketAwayProb!)
      : null

    if (crowdPick) {
      matchesWithCrowd++
      if (crowdPick === actualWinner) crowdRight++
    }
    if (marketPick) {
      matchesWithMarket++
      if (marketPick === actualWinner) marketRight++
    }

    if (crowdPick && marketPick) {
      if (crowdPick === marketPick) {
        agreed++
        if (crowdPick === actualWinner) agreedAndRight++
      } else {
        disagreed++
        if (crowdPick === actualWinner) crowdRightDisagreed++
        if (marketPick === actualWinner) marketRightDisagreed++
      }
    }
  }

  return {
    finishedMatches: finished.length,
    matchesWithCrowd,
    matchesWithMarket,
    crowdAccuracy: matchesWithCrowd ? (crowdRight / matchesWithCrowd) * 100 : 0,
    marketAccuracy: matchesWithMarket ? (marketRight / matchesWithMarket) * 100 : 0,
    agreed,
    agreedAndRight,
    disagreed,
    crowdRightDisagreed,
    marketRightDisagreed,
  }
}

export async function getMatchAnalytics(
  supabase: SupabaseClient
): Promise<MatchAnalytics[]> {
  // Total approved players
  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'approved')

  const total = totalPlayers ?? 0

  // All matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  if (!matches?.length) return []

  // All predictions
  const { data: allPreds } = await supabase
    .from('predictions')
    .select('match_id, predicted_home, predicted_away')

  const preds = (allPreds ?? []) as { match_id: string; predicted_home: number; predicted_away: number }[]

  // Group predictions by match
  const predsByMatch = new Map<string, typeof preds>()
  preds.forEach(p => {
    if (!predsByMatch.has(p.match_id)) predsByMatch.set(p.match_id, [])
    predsByMatch.get(p.match_id)!.push(p)
  })

  return matches.map(m => {
    const matchPreds = predsByMatch.get(m.id) ?? []
    const count = matchPreds.length

    let pctHomeWin = 0, pctDraw = 0, pctAwayWin = 0, avgTotalGoals = 0

    if (count > 0) {
      let homeWins = 0, draws = 0, awayWins = 0, totalGoals = 0
      matchPreds.forEach(p => {
        if (p.predicted_home > p.predicted_away) homeWins++
        else if (p.predicted_home === p.predicted_away) draws++
        else awayWins++
        totalGoals += p.predicted_home + p.predicted_away
      })
      pctHomeWin = (homeWins / count) * 100
      pctDraw = (draws / count) * 100
      pctAwayWin = (awayWins / count) * 100
      avgTotalGoals = totalGoals / count
    }

    return {
      matchId: m.id,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      matchDate: m.match_date,
      phase: m.phase as MatchPhase,
      groupName: m.group_name,
      status: m.status,
      homeScore: m.home_score,
      awayScore: m.away_score,
      totalPredictions: count,
      totalPlayers: total,
      pctWithPrediction: total > 0 ? (count / total) * 100 : 0,
      pctWithoutPrediction: total > 0 ? ((total - count) / total) * 100 : 0,
      pctHomeWin,
      pctDraw,
      pctAwayWin,
      avgTotalGoals,
      marketHomeProb: m.polymarket_home_prob !== null && m.polymarket_home_prob !== undefined ? Number(m.polymarket_home_prob) : null,
      marketAwayProb: m.polymarket_away_prob !== null && m.polymarket_away_prob !== undefined ? Number(m.polymarket_away_prob) : null,
      marketDrawProb: m.polymarket_draw_prob !== null && m.polymarket_draw_prob !== undefined ? Number(m.polymarket_draw_prob) : null,
      marketSlug: m.polymarket_slug ?? null,
    }
  })
}
