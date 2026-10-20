// Colour templates for the long (16:9) videos.
//
// The vertical templates each carry their own accent colours, because each one is a single poster.
// A long video runs for minutes across many scenes, so it needs a whole palette that holds
// together: `on` is the text colour used on top of the accent, `mute` is secondary copy.
export const LOOKS = {
  Noir: { bg: '#0D0D12', panel: '#1d1d27', accent: '#D4A63A', ink: '#F4F1EA', mute: '#9a97a6', on: '#0D0D12' },
  Crimson: { bg: '#140608', panel: '#260C11', accent: '#E0314B', ink: '#FFF1F2', mute: '#C08E96', on: '#FFFFFF' },
  Indigo: { bg: '#070B1C', panel: '#121833', accent: '#6E8BFF', ink: '#F2F5FF', mute: '#8E9ABF', on: '#070B1C' },
  Emerald: { bg: '#061612', panel: '#0E261F', accent: '#3FD9A4', ink: '#EEFFF9', mute: '#86B5A5', on: '#061612' },
  Sepia: { bg: '#161008', panel: '#261C0E', accent: '#E0A458', ink: '#FFF6E8', mute: '#B79C7C', on: '#161008' },
  Daylight: { bg: '#F4F1EA', panel: '#FFFFFF', accent: '#A8761C', ink: '#17131A', mute: '#6A6472', on: '#FFFFFF' },
}

export const pal = (d) => LOOKS[d.look] || LOOKS.Noir
export const lookField = () => ({ group: 'Look', key: 'look', label: 'Colour template', type: 'select', options: Object.keys(LOOKS) })
