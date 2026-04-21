import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { calculatePoints, isEditable } from './scoring'

describe('calculatePoints', () => {
  describe('fase de grupos (multiplicador 1x)', () => {
    it('marcador exacto da 5 + 2 + 2 + 1 = 10 puntos', () => {
      const r = calculatePoints(2, 1, 2, 1, 'group')
      expect(r).toEqual({
        result: 5,
        home_goals: 2,
        away_goals: 2,
        goal_diff: 1,
        total: 10,
      })
    })

    it('ganador correcto + diferencia de gol correcta, goles incorrectos = 5 + 1 = 6', () => {
      const r = calculatePoints(3, 1, 2, 0, 'group')
      expect(r.result).toBe(5)
      expect(r.home_goals).toBe(0)
      expect(r.away_goals).toBe(0)
      expect(r.goal_diff).toBe(1)
      expect(r.total).toBe(6)
    })

    it('ganador correcto pero distinta diferencia = 5', () => {
      const r = calculatePoints(3, 0, 2, 1, 'group')
      expect(r.result).toBe(5)
      expect(r.goal_diff).toBe(0)
      expect(r.total).toBe(5)
    })

    it('ganador incorrecto pero un marcador acertado sigue dando puntos', () => {
      const r = calculatePoints(2, 1, 0, 1, 'group')
      expect(r.result).toBe(0)
      expect(r.away_goals).toBe(2)
      expect(r.total).toBe(2)
    })

    it('empate predicho y empate real (mismos goles) = 10', () => {
      const r = calculatePoints(1, 1, 1, 1, 'group')
      expect(r.total).toBe(10)
    })

    it('empate predicho correcto con distinto marcador = 5 + 1 = 6', () => {
      const r = calculatePoints(1, 1, 2, 2, 'group')
      expect(r.result).toBe(5)
      expect(r.goal_diff).toBe(1)
      expect(r.total).toBe(6)
    })

    it('prediccion completamente errada = 0', () => {
      const r = calculatePoints(3, 0, 0, 2, 'group')
      expect(r.total).toBe(0)
    })

    it('0-0 predicho y 0-0 real da 10 puntos', () => {
      const r = calculatePoints(0, 0, 0, 0, 'group')
      expect(r.total).toBe(10)
    })

    it('goleada imprevista: 1-0 predicho vs 5-0 real acierta ganador, home y diff errados', () => {
      const r = calculatePoints(1, 0, 5, 0, 'group')
      expect(r.result).toBe(5)
      expect(r.away_goals).toBe(2)
      expect(r.home_goals).toBe(0)
      expect(r.goal_diff).toBe(0)
      expect(r.total).toBe(7)
    })

    it('batacazo (ganador errado) sin goles acertados = 0', () => {
      const r = calculatePoints(3, 1, 0, 2, 'group')
      expect(r.total).toBe(0)
    })
  })

  describe('fases eliminatorias (multiplicador 2x)', () => {
    it('round_of_32 tambien aplica multiplicador 2x', () => {
      const r = calculatePoints(2, 1, 2, 1, 'round_of_32')
      expect(r.total).toBe(20)
    })

    it('marcador exacto en octavos da 20 puntos', () => {
      const r = calculatePoints(2, 1, 2, 1, 'round_of_16')
      expect(r.total).toBe(20)
    })

    it('marcador exacto en la final da 20 puntos', () => {
      const r = calculatePoints(1, 0, 1, 0, 'final')
      expect(r.total).toBe(20)
    })

    it('solo ganador correcto en cuartos = 10', () => {
      const r = calculatePoints(3, 0, 2, 1, 'quarter_final')
      expect(r.result).toBe(10)
      expect(r.goal_diff).toBe(0)
      expect(r.total).toBe(10)
    })

    it('semifinal con ganador y diferencia correcta pero goles distintos = 10 + 2 = 12', () => {
      const r = calculatePoints(2, 0, 3, 1, 'semi_final')
      expect(r.result).toBe(10)
      expect(r.goal_diff).toBe(2)
      expect(r.total).toBe(12)
    })
  })
})

describe('isEditable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('es editable hasta 10 minutos antes del partido', () => {
    vi.setSystemTime(new Date('2026-06-11T12:00:00Z'))
    expect(isEditable('2026-06-11T12:11:00Z')).toBe(true)
  })

  it('no es editable 10 minutos o menos antes', () => {
    vi.setSystemTime(new Date('2026-06-11T12:00:00Z'))
    expect(isEditable('2026-06-11T12:10:00Z')).toBe(false)
    expect(isEditable('2026-06-11T12:05:00Z')).toBe(false)
  })

  it('no es editable despues del inicio', () => {
    vi.setSystemTime(new Date('2026-06-11T13:00:00Z'))
    expect(isEditable('2026-06-11T12:00:00Z')).toBe(false)
  })
})
