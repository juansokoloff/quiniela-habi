import { MatchPhase } from '@/types'

const BASE_URL = 'https://api.football-data.org/v4'
const WORLD_CUP_2026_ID = 2000 // FIFA World Cup competition ID

interface ExternalTeam {
  name: string
  shortName: string
  crest: string
}

interface ExternalScore {
  winner?: string | null
  duration?: string | null
  fullTime: { home: number | null; away: number | null }
  extraTime?: { home: number | null; away: number | null }
  penalties?: { home: number | null; away: number | null }
}

interface ExternalMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  matchday: number | null
  homeTeam: ExternalTeam
  awayTeam: ExternalTeam
  score: ExternalScore
}

function stageToPhase(stage: string): MatchPhase | null {
  const map: Record<string, MatchPhase> = {
    GROUP_STAGE: 'group',
    LAST_32: 'round_of_32',
    LAST_16: 'round_of_16',
    QUARTER_FINALS: 'quarter_final',
    SEMI_FINALS: 'semi_final',
    FINAL: 'final',
    THIRD_PLACE: 'final',
  }
  return map[stage] || null
}

function statusToInternal(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'scheduled',
    TIMED: 'scheduled',
    IN_PLAY: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
    CANCELLED: 'cancelled',
    POSTPONED: 'cancelled',
  }
  return map[status] || 'scheduled'
}

export async function fetchWorldCupMatches(): Promise<ExternalMatch[]> {
  const res = await fetch(`${BASE_URL}/competitions/${WORLD_CUP_2026_ID}/matches`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`Football API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.matches || []
}

export function transformMatch(m: ExternalMatch) {
  const phase = stageToPhase(m.stage)
  // Skip matches with unknown teams (elimination TBD) or unmapped stages
  if (!m.homeTeam.name || !m.awayTeam.name || !phase) return null

  // Knockout scoring: our quiniela scores on the 120-min result (regulation +
  // extra time, but NOT penalties). football-data.org v4's `fullTime` is
  // historically the final score at the end of the match before any penalty
  // shootout, so it already reflects 120 min when ET was played. We log a
  // warning when a knockout match resolves via ET/penalties so we can spot
  // any provider inconsistency during the tournament and fix it fast.
  const { home: homeScore, away: awayScore } = m.score.fullTime
  if (
    phase !== 'group' &&
    m.status === 'FINISHED' &&
    (m.score.duration === 'EXTRA_TIME' || m.score.duration === 'PENALTY_SHOOTOUT')
  ) {
    console.info(
      `[sync] knockout ${m.homeTeam.name} vs ${m.awayTeam.name} finished ${m.score.duration}. ` +
        `fullTime=${homeScore}-${awayScore} extraTime=${m.score.extraTime?.home ?? 'null'}-${m.score.extraTime?.away ?? 'null'} penalties=${m.score.penalties?.home ?? 'null'}-${m.score.penalties?.away ?? 'null'}`
    )
  }

  return {
    external_id: m.id,
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    home_team_flag: m.homeTeam.crest || '',
    away_team_flag: m.awayTeam.crest || '',
    match_date: m.utcDate,
    phase,
    status: statusToInternal(m.status),
    home_score: homeScore,
    away_score: awayScore,
    matchday: m.matchday,
    group_name: m.group,
  }
}
