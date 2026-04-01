import { MatchPhase } from '@/types'

const BASE_URL = 'https://api.football-data.org/v4'
const WORLD_CUP_2026_ID = 2000 // FIFA World Cup competition ID

interface ExternalTeam {
  name: string
  shortName: string
  crest: string
}

interface ExternalScore {
  fullTime: { home: number | null; away: number | null }
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

function stageToPhase(stage: string): MatchPhase {
  const map: Record<string, MatchPhase> = {
    GROUP_STAGE: 'group',
    LAST_16: 'round_of_16',
    QUARTER_FINALS: 'quarter_final',
    SEMI_FINALS: 'semi_final',
    FINAL: 'final',
    THIRD_PLACE: 'semi_final',
  }
  return map[stage] || 'group'
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
  return {
    external_id: m.id,
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    home_team_flag: m.homeTeam.crest,
    away_team_flag: m.awayTeam.crest,
    match_date: m.utcDate,
    phase: stageToPhase(m.stage),
    status: statusToInternal(m.status),
    home_score: m.score.fullTime.home,
    away_score: m.score.fullTime.away,
    matchday: m.matchday,
    group_name: m.group,
  }
}
