import { describe, expect, it } from 'vitest'
import { candidateSlugs, normalizeMarket } from './client'

describe('candidateSlugs', () => {
  it('genera slug para la fecha exacta y ±1 dia (UTC drift)', () => {
    const slugs = candidateSlugs('Mexico', 'South Africa', '2026-06-11')
    expect(slugs).toContain('fifwc-mex-rsa-2026-06-11')
    expect(slugs).toContain('fifwc-mex-rsa-2026-06-10')
    expect(slugs).toContain('fifwc-mex-rsa-2026-06-12')
  })

  it('incluye orden invertido away-home como fallback', () => {
    const slugs = candidateSlugs('Mexico', 'South Africa', '2026-06-11')
    expect(slugs).toContain('fifwc-rsa-mex-2026-06-11')
  })

  it('Portugal expande con prt (slug real de Polymarket) y por (fallback)', () => {
    const slugs = candidateSlugs('Colombia', 'Portugal', '2026-06-27')
    expect(slugs).toContain('fifwc-col-prt-2026-06-27')
    expect(slugs).toContain('fifwc-col-por-2026-06-27')
  })

  it('USA vs Paraguay cubre ambas fechas cuando Polymarket usa 2026-06-12 y DB tiene 2026-06-13', () => {
    const slugs = candidateSlugs('United States', 'Paraguay', '2026-06-13')
    expect(slugs).toContain('fifwc-usa-par-2026-06-12')
    expect(slugs).toContain('fifwc-usa-pry-2026-06-12')
  })

  it('acepta timestamps ISO completos y corta a YYYY-MM-DD', () => {
    const slugs = candidateSlugs('Mexico', 'South Africa', '2026-06-11T20:00:00Z')
    expect(slugs).toContain('fifwc-mex-rsa-2026-06-11')
  })

  it('retorna lista vacia cuando los equipos no estan mapeados', () => {
    const slugs = candidateSlugs('Atlantis', 'Wakanda', '2026-06-11')
    expect(slugs).toEqual([])
  })

  it('cruza la frontera de fin de mes correctamente', () => {
    const slugs = candidateSlugs('Mexico', 'South Africa', '2026-06-01')
    expect(slugs).toContain('fifwc-mex-rsa-2026-05-31')
    expect(slugs).toContain('fifwc-mex-rsa-2026-06-02')
  })
})

describe('normalizeMarket', () => {
  it('normaliza un mercado que suma >1 para que sume exactamente 1', () => {
    // Caso real: user reportó 47% + 40% + 44% = 131%
    const r = normalizeMarket(0.47, 0.4, 0.44)
    const sum = r.home + r.draw + r.away
    expect(sum).toBeCloseTo(1, 10)
    expect(r.home).toBeCloseTo(0.47 / 1.31, 5)
    expect(r.draw).toBeCloseTo(0.4 / 1.31, 5)
    expect(r.away).toBeCloseTo(0.44 / 1.31, 5)
  })

  it('mantiene el orden relativo de probabilidades', () => {
    const r = normalizeMarket(0.6, 0.2, 0.3)
    expect(r.home).toBeGreaterThan(r.away)
    expect(r.away).toBeGreaterThan(r.draw)
  })

  it('retorna zeros cuando todo es null/undefined', () => {
    expect(normalizeMarket(null, null, null)).toEqual({ home: 0, draw: 0, away: 0 })
    expect(normalizeMarket(undefined, undefined, undefined)).toEqual({
      home: 0,
      draw: 0,
      away: 0,
    })
  })

  it('trata null como 0 en uno solo de los valores', () => {
    const r = normalizeMarket(0.5, null, 0.5)
    expect(r.draw).toBe(0)
    expect(r.home).toBeCloseTo(0.5, 10)
    expect(r.away).toBeCloseTo(0.5, 10)
  })

  it('un mercado que ya suma 1 queda igual', () => {
    const r = normalizeMarket(0.5, 0.2, 0.3)
    expect(r.home).toBeCloseTo(0.5, 10)
    expect(r.draw).toBeCloseTo(0.2, 10)
    expect(r.away).toBeCloseTo(0.3, 10)
  })
})
