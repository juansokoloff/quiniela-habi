// Polymarket Gamma API client for World Cup match odds

const GAMMA_BASE = 'https://gamma-api.polymarket.com'

// FIFA-style country codes used by Polymarket slugs.
// Source: observed Polymarket event slugs (e.g. fifwc-mex-rsa-2026-06-11).
// Codes are inconsistent — some are 3-letter FIFA codes, others are 2-letter ISO.
const TEAM_CODE_MAP: Record<string, string[]> = {
  // Confirmed
  // Verified from live Polymarket event slugs (fifa-world-cup tag).
  Mexico: ['mex'],
  'South Africa': ['rsa'],
  'South Korea': ['kr'],
  Czechia: ['cze'],
  Canada: ['can'],
  'Bosnia-Herzegovina': ['bih'],
  'United States': ['usa'],
  Paraguay: ['par', 'pry'],
  Qatar: ['qat'],
  Switzerland: ['che', 'sui'],
  Australia: ['aus'],
  Turkey: ['tur'],
  Brazil: ['bra'],
  Morocco: ['mar'],
  Haiti: ['hai', 'hti'],
  Scotland: ['sco'],
  Germany: ['ger', 'deu'],
  // Polymarket uses 'kor' for Curaçao (not South Korea — that's 'kr').
  Curaçao: ['kor', 'cuw'],
  Netherlands: ['nld', 'ned'],
  Japan: ['jpn', 'jap'],
  'Ivory Coast': ['civ', 'ivc'],
  Ecuador: ['ecu'],
  Sweden: ['swe'],
  Tunisia: ['tun'],
  Spain: ['esp'],
  'Cape Verde Islands': ['cvi', 'cpv', 'cv'],
  Belgium: ['bel'],
  Egypt: ['egy'],
  'Saudi Arabia': ['ksa', 'sau'],
  Uruguay: ['ury', 'uru'],
  Iran: ['irn'],
  'New Zealand': ['nzl'],
  France: ['fra'],
  Senegal: ['sen'],
  Iraq: ['irq'],
  Norway: ['nor'],
  Argentina: ['arg'],
  Algeria: ['alg', 'dza'],
  Austria: ['aut'],
  Jordan: ['jor'],
  Portugal: ['prt', 'por'],
  'Congo DR': ['cdr', 'cod', 'drc'],
  England: ['eng', 'gbr'],
  Croatia: ['hrv', 'cro'],
  Ghana: ['gha'],
  Panama: ['pan'],
  Uzbekistan: ['uzb'],
  Colombia: ['col'],
}

function shiftDate(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return d.toISOString().substring(0, 10)
}

export function candidateSlugs(homeTeam: string, awayTeam: string, matchDate: string): string[] {
  const baseDate = matchDate.substring(0, 10) // YYYY-MM-DD
  const homeCodes = TEAM_CODE_MAP[homeTeam] ?? []
  const awayCodes = TEAM_CODE_MAP[awayTeam] ?? []

  // Polymarket stores events in local time so dates can drift ±1 day from UTC
  const dates = [baseDate, shiftDate(baseDate, -1), shiftDate(baseDate, 1)]

  const slugs: string[] = []
  for (const date of dates) {
    // Try home-away order first
    for (const h of homeCodes) {
      for (const a of awayCodes) {
        slugs.push(`fifwc-${h}-${a}-${date}`)
      }
    }
    // Fallback to away-home order (Polymarket sometimes reverses)
    for (const a of awayCodes) {
      for (const h of homeCodes) {
        slugs.push(`fifwc-${a}-${h}-${date}`)
      }
    }
  }
  return slugs
}

interface PolymarketMarket {
  question: string
  groupItemTitle: string
  outcomes: string
  outcomePrices: string
  volume: string
}

interface PolymarketEvent {
  id: string
  slug: string
  title: string
  volume: number
  markets: PolymarketMarket[]
}

/**
 * Normalize Polymarket probabilities so they sum to 1.
 * Each Polymarket market is an independent Yes/No contract, so the raw "Yes"
 * prices across home/draw/away don't arbitrage to exactly 1 — typically 1.05-1.35.
 * Callers should persist the raw values and normalize only at display time.
 */
export function normalizeMarket(
  home: number | null | undefined,
  draw: number | null | undefined,
  away: number | null | undefined
): { home: number; draw: number; away: number } {
  const h = home ?? 0
  const d = draw ?? 0
  const a = away ?? 0
  const sum = h + d + a
  if (sum === 0) return { home: 0, draw: 0, away: 0 }
  return { home: h / sum, draw: d / sum, away: a / sum }
}

export interface MarketOdds {
  slug: string
  homeProb: number | null
  awayProb: number | null
  drawProb: number | null
  volume: number
}

async function fetchEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  try {
    const res = await fetch(`${GAMMA_BASE}/events?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as PolymarketEvent[]
    return data[0] ?? null
  } catch {
    return null
  }
}

// Team name aliases — maps our DB name to alternate names used by Polymarket
const TEAM_NAME_ALIASES: Record<string, string[]> = {
  'South Korea': ['korea republic', 'korea'],
  'Ivory Coast': ['cote d\'ivoire', 'côte d\'ivoire'],
  Czechia: ['czech republic'],
  'Cape Verde Islands': ['cape verde'],
  'Bosnia-Herzegovina': ['bosnia and herzegovina', 'bosnia'],
  'Congo DR': ['dr congo', 'democratic republic of the congo'],
  Curaçao: ['curacao'],
  England: ['english'],
}

function teamMatches(text: string, team: string): boolean {
  const t = text.toLowerCase()
  const candidates = [team.toLowerCase(), ...(TEAM_NAME_ALIASES[team] ?? [])]
  return candidates.some(c => t.includes(c))
}

/**
 * Extract home/away/draw probabilities from a Polymarket event.
 * Each event has multiple markets (one per outcome). Each market is a binary
 * Yes/No — the "Yes" price is the market-implied probability.
 */
function parseOdds(event: PolymarketEvent, homeTeam: string, awayTeam: string): {
  homeProb: number | null
  awayProb: number | null
  drawProb: number | null
} {
  let homeProb: number | null = null
  let awayProb: number | null = null
  let drawProb: number | null = null

  for (const m of event.markets) {
    const prices = JSON.parse(m.outcomePrices) as string[]
    const yesPrice = parseFloat(prices[0] ?? '0')
    const title = m.groupItemTitle ?? ''
    const question = m.question ?? ''
    const combined = `${title} ${question}`

    const isDraw = title.toLowerCase() === 'draw' || /\bdraw\b/i.test(question)

    if (isDraw) {
      drawProb = yesPrice
    } else if (teamMatches(combined, homeTeam)) {
      homeProb = yesPrice
    } else if (teamMatches(combined, awayTeam)) {
      awayProb = yesPrice
    }
  }

  return { homeProb, awayProb, drawProb }
}

/**
 * Fetch market odds for a match. If no slug is provided, tries auto-discovery
 * based on team names and match date.
 */
export async function fetchOddsForMatch(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  knownSlug?: string | null
): Promise<MarketOdds | null> {
  // Try the known slug first
  if (knownSlug) {
    const event = await fetchEventBySlug(knownSlug)
    if (event) {
      const odds = parseOdds(event, homeTeam, awayTeam)
      return { slug: knownSlug, ...odds, volume: event.volume }
    }
  }

  // Auto-discovery: try candidate slugs
  const candidates = candidateSlugs(homeTeam, awayTeam, matchDate)
  for (const slug of candidates) {
    const event = await fetchEventBySlug(slug)
    if (event) {
      const odds = parseOdds(event, homeTeam, awayTeam)
      return { slug, ...odds, volume: event.volume }
    }
  }

  return null
}
