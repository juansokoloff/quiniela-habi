// Map DB team names to ISO 3166-1 alpha-2 country codes so we can render
// emoji flags without bundling image assets. Emoji flags are composed of two
// regional indicator symbols — the renderer picks them up automatically on
// every modern OS (except Windows, which shows the letters instead).

const TEAM_ISO_MAP: Record<string, string> = {
  Mexico: 'MX',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Czechia: 'CZ',
  Canada: 'CA',
  'Bosnia-Herzegovina': 'BA',
  'United States': 'US',
  Paraguay: 'PY',
  Qatar: 'QA',
  Switzerland: 'CH',
  Australia: 'AU',
  Turkey: 'TR',
  Brazil: 'BR',
  Morocco: 'MA',
  Haiti: 'HT',
  Scotland: 'GB-SCT', // handled specially below
  Germany: 'DE',
  Curaçao: 'CW',
  Netherlands: 'NL',
  Japan: 'JP',
  'Ivory Coast': 'CI',
  Ecuador: 'EC',
  Sweden: 'SE',
  Tunisia: 'TN',
  Spain: 'ES',
  'Cape Verde Islands': 'CV',
  Belgium: 'BE',
  Egypt: 'EG',
  'Saudi Arabia': 'SA',
  Uruguay: 'UY',
  Iran: 'IR',
  'New Zealand': 'NZ',
  France: 'FR',
  Senegal: 'SN',
  Iraq: 'IQ',
  Norway: 'NO',
  Argentina: 'AR',
  Algeria: 'DZ',
  Austria: 'AT',
  Jordan: 'JO',
  Portugal: 'PT',
  'Congo DR': 'CD',
  England: 'GB-ENG', // handled specially below
  Croatia: 'HR',
  Ghana: 'GH',
  Panama: 'PA',
  Uzbekistan: 'UZ',
  Colombia: 'CO',
}

// UK subdivision flags (Scotland, England, Wales) live in the "tag sequence"
// unicode range and render reliably only on Apple platforms.
const SUBDIVISION_FLAGS: Record<string, string> = {
  'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'GB-SCT': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
}

export function teamFlag(teamName: string): string {
  const code = TEAM_ISO_MAP[teamName]
  if (!code) return ''
  if (code in SUBDIVISION_FLAGS) return SUBDIVISION_FLAGS[code]
  // Convert "US" -> regional indicator pair 🇺🇸
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}
