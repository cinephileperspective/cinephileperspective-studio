// Everything brand-specific lives here, so a rebrand never touches the templates.
export const BRAND = {
  name: 'Cinephile Perspective',
  studio: 'Cinephile Perspective Studio',
  tagline: 'Beyond the Screen. Into the Story.',
  watermark: 'Cinephile Perspective \u2122',
  storeKey: 'cinephile-studio-v1',
  fileApp: 'cinephile-studio',
  // The IndexedDB store holding uploaded media. Renaming it orphans anything already uploaded.
  assetDb: 'cinephile-studio',
}

export const COLORS = { midnight: '#0D0D12', gold: '#D4A63A', ivory: '#F4F1EA' }

// Indic fallbacks let Malayalam / Tamil / Telugu / Kannada / Hindi titles render when the system has a font.
const INDIC = '"Noto Sans Malayalam","Noto Sans Tamil","Noto Sans Telugu","Noto Sans Kannada","Noto Sans Devanagari"'
export const FONTS = {
  script: `"Great Vibes", cursive`,
  serif: `"Cinzel", Georgia, serif`,
  display: `"Bebas Neue", Impact, ${INDIC}, sans-serif`,
  body: `"Poppins", ${INDIC}, system-ui, sans-serif`,
  fun: `"Lilita One", "Poppins", ${INDIC}, sans-serif`,
}

// Canvas text only uses a web font once it has been loaded.
export const FONT_LOADS = [
  '400 64px "Great Vibes"',
  '500 40px "Cinzel"',
  '600 40px "Cinzel"',
  '400 64px "Bebas Neue"',
  '400 30px "Poppins"',
  '500 30px "Poppins"',
  '600 30px "Poppins"',
  '700 30px "Poppins"',
  '400 64px "Lilita One"',
]
