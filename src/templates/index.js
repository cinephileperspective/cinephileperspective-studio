import buzz from './buzz.js'
import birthday from './birthday.js'
import tribute from './tribute.js'
import review from './review.js'
import rewind from './rewind.js'
import spotlight from './spotlight.js'
import festival from './festival.js'
import countdown from './countdown.js'
import buzzlong from './buzzlong.js'
import birthdaylong from './birthdaylong.js'
import tributelong from './tributelong.js'
import rewindlong from './rewindlong.js'
import reviewlong from './reviewlong.js'
import spotlightlong from './spotlightlong.js'

// Every Shorts template except Festival Wishes has a long-form counterpart, listed in the same
// order so the two tabs read alike. Cinema Countdown is the extra, generic ranked list.
export const TEMPLATES = [
  buzz, birthday, tribute, rewind, review, spotlight, festival,
  buzzlong, birthdaylong, tributelong, rewindlong, reviewlong, spotlightlong, countdown,
]
// The studio groups its templates by what they make: vertical Shorts, or a 16:9 long video.
export const KINDS = [
  { key: 'short', label: 'Shorts', hint: '1080\u00d71920 \u00b7 vertical' },
  { key: 'long', label: 'Long video', hint: '1920\u00d71080 \u00b7 horizontal' },
]
export const kindOf = (tpl) => (tpl && tpl.kind === 'long' ? 'long' : 'short')
export const templatesOfKind = (kind) => TEMPLATES.filter((t) => kindOf(t) === kind)
export const getTemplate = (key) => TEMPLATES.find((t) => t.key === key) || TEMPLATES[0]

// Merges saved data over fresh defaults so fields added later still get a value.
export function normalizeData(tpl, saved) {
  const base = tpl.defaults()
  if (!saved || typeof saved !== 'object') return base
  const out = { ...base }
  for (const k of Object.keys(base)) {
    if (saved[k] === undefined || typeof saved[k] !== typeof base[k]) continue
    // typeof [] is 'object', so an array field handed an object would pass and then break duration().
    if (Array.isArray(base[k]) !== Array.isArray(saved[k])) continue
    out[k] = saved[k]
  }
  return out
}

// Which of a saved file's keys this template cannot use. Loading a file whose fields belong to a
// different template used to look like success — the unusable keys were dropped and the defaults
// shown instead — so the loader reports these to the user.
export function unusedKeys(tpl, saved) {
  const base = tpl.defaults()
  const unknown = []
  const wrongType = []
  for (const k of Object.keys(saved || {})) {
    if (saved[k] === undefined) continue
    if (!(k in base)) unknown.push(k)
    else if (typeof saved[k] !== typeof base[k] || Array.isArray(base[k]) !== Array.isArray(saved[k])) wrongType.push(k)
  }
  return { unknown, wrongType }
}

// A sentence describing what a load threw away, or '' when everything was used.
export function loadWarning(tpl, saved) {
  const { unknown, wrongType } = unusedKeys(tpl, saved)
  const parts = []
  if (unknown.length) parts.push(`"${tpl.label}" has no ${unknown.length === 1 ? 'field' : 'fields'} ${unknown.join(', ')}`)
  if (wrongType.length) parts.push(`${wrongType.join(', ')} had the wrong type`)
  return parts.length ? `Ignored: ${parts.join('; ')}. Those kept their defaults.` : ''
}

// Every asset id a project uses (images, videos, audio), found through the field definitions.
export function collectIds(tpl, data) {
  const ids = new Set()
  const walk = (fields, obj) => {
    for (const f of fields) {
      const v = obj?.[f.key]
      if (['image', 'video', 'audio'].includes(f.type) && v) ids.add(v)
      else if (f.type === 'images' && Array.isArray(v)) v.forEach((x) => x && ids.add(x))
      else if (f.type === 'list' && Array.isArray(v)) v.forEach((item) => walk(f.fields, item))
    }
  }
  walk(tpl.fields, data)
  return [...ids]
}

// Sound for the whole video: the music track plus anything the template adds (clip sound).
export function audioPlan(tpl, d, total) {
  const plan = []
  if (d.audio) plan.push({ id: d.audio, start: 0, dur: total, loop: false, gain: +d.musicVol >= 0 ? +d.musicVol : 0.8, fadeOut: 1, music: true })
  if (tpl.audio) plan.push(...tpl.audio(d, total))
  return plan
}
