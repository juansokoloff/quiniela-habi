import { describe, expect, it } from 'vitest'
import { computeCalibration, type MatchAnalytics } from './stats'

function base(overrides: Partial<MatchAnalytics> = {}): MatchAnalytics {
  return {
    matchId: 'm',
    homeTeam: 'A',
    awayTeam: 'B',
    matchDate: '2026-06-11T12:00:00Z',
    phase: 'group',
    groupName: 'A',
    status: 'finished',
    homeScore: 1,
    awayScore: 0,
    totalPredictions: 10,
    totalPlayers: 10,
    pctWithPrediction: 100,
    pctWithoutPrediction: 0,
    pctHomeWin: 60,
    pctDraw: 20,
    pctAwayWin: 20,
    avgTotalGoals: 2,
    marketHomeProb: 0.6,
    marketDrawProb: 0.25,
    marketAwayProb: 0.15,
    marketSlug: 'x',
    ...overrides,
  }
}

describe('computeCalibration', () => {
  it('returns zeros when there are no finished matches', () => {
    const s = computeCalibration([base({ status: 'scheduled' })])
    expect(s.finishedMatches).toBe(0)
    expect(s.crowdAccuracy).toBe(0)
    expect(s.marketAccuracy).toBe(0)
  })

  it('cuenta aciertos de crowd y mercado cuando ambos eligieron al ganador real', () => {
    const s = computeCalibration([base()]) // home wins 1-0; crowd + market picked home
    expect(s.finishedMatches).toBe(1)
    expect(s.crowdAccuracy).toBe(100)
    expect(s.marketAccuracy).toBe(100)
    expect(s.agreed).toBe(1)
    expect(s.agreedAndRight).toBe(1)
    expect(s.disagreed).toBe(0)
  })

  it('registra desacuerdos y quién tuvo razón', () => {
    // Home wins; crowd picks home, market picks away
    const s = computeCalibration([
      base({
        pctHomeWin: 70, pctDraw: 10, pctAwayWin: 20,
        marketHomeProb: 0.2, marketDrawProb: 0.2, marketAwayProb: 0.6,
      }),
    ])
    expect(s.agreed).toBe(0)
    expect(s.disagreed).toBe(1)
    expect(s.crowdRightDisagreed).toBe(1)
    expect(s.marketRightDisagreed).toBe(0)
  })

  it('ignora partidos sin datos de mercado al medir mercado, pero sí cuenta crowd', () => {
    const s = computeCalibration([
      base({ marketHomeProb: null, marketDrawProb: null, marketAwayProb: null }),
    ])
    expect(s.matchesWithCrowd).toBe(1)
    expect(s.matchesWithMarket).toBe(0)
    expect(s.agreed).toBe(0)
    expect(s.disagreed).toBe(0)
  })

  it('partido sin predicciones (todos 0%) no cuenta como crowd', () => {
    const s = computeCalibration([
      base({ pctHomeWin: 0, pctDraw: 0, pctAwayWin: 0 }),
    ])
    expect(s.matchesWithCrowd).toBe(0)
    expect(s.matchesWithMarket).toBe(1)
  })

  it('empates reales también se evalúan contra el pick', () => {
    const s = computeCalibration([
      base({
        homeScore: 1, awayScore: 1,
        pctHomeWin: 20, pctDraw: 60, pctAwayWin: 20,
        marketHomeProb: 0.4, marketDrawProb: 0.35, marketAwayProb: 0.25,
      }),
    ])
    expect(s.crowdAccuracy).toBe(100) // crowd picked draw, actual was draw
    expect(s.marketAccuracy).toBe(0) // market picked home
    expect(s.disagreed).toBe(1)
    expect(s.crowdRightDisagreed).toBe(1)
  })
})
