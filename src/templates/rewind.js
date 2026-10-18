import { FONTS } from '../brand.js'
import { seg, lerp, clamp, easeOut, easeBack, easeInOut, text, cover, fitSize, watermark } from '../lib/draw.js'

// Cinema Rewind: a film strip of stills scrolls past, then the poster and "N Years of ..." card.
const W = 1080
const H = 1920
const FX = 110
const FW = 860
const FH = 484
const GAP = 46
const END_FADE = 0.8

const scrollDur = (d) => Math.max(5, (d.stills || []).length * Math.max(0.8, +d.perStill || 1.8))

function strip(ctx, t, d, A, alpha) {
  const ids = (d.stills || []).length ? d.stills : ['', '', '', '']
  const n = ids.length
  const total = n * (FH + GAP) + GAP
  const p = clamp(t / scrollDur(d))
  const y0 = lerp(170, -(total - H + 260), p)
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = '#121212'
  ctx.fillRect(14, 0, W - 28, H)
  ctx.fillStyle = 'rgba(230,226,214,.85)'
  const off = ((y0 % 62) + 62) % 62
  for (let y = off - 62; y < H + 62; y += 62) {
    ctx.beginPath()
    ctx.roundRect(34, y, 22, 34, 6)
    ctx.roundRect(W - 56, y, 22, 34, 6)
    ctx.fill()
  }
  ids.forEach((id, i) => {
    const fy = y0 + GAP + i * (FH + GAP)
    if (fy > H || fy + FH < 0) return
    cover(ctx, A.img(id), FX, fy, FW, FH, { radius: 6, label: 'ADD STILL' })
    const cy = fy + FH / 2
    for (const [x, rot] of [[86, -Math.PI / 2], [W - 86, Math.PI / 2]]) {
      ctx.save()
      ctx.translate(x, cy)
      ctx.rotate(rot)
      text(ctx, 'CINEPHILE PERSPECTIVE  \u25B8  ' + String(i + 1).padStart(2, '0'), 0, 8, { font: `600 22px ${FONTS.body}`, color: 'rgba(212,166,58,.75)', spacing: 5 })
      ctx.restore()
    }
  })
  for (const [y, a, b] of [[0, 'rgba(0,0,0,.9)', 'rgba(0,0,0,0)'], [H - 220, 'rgba(0,0,0,0)', 'rgba(0,0,0,.9)']]) {
    const g = ctx.createLinearGradient(0, y, 0, y + 220)
    g.addColorStop(0, a)
    g.addColorStop(1, b)
    ctx.fillStyle = g
    ctx.fillRect(0, y, W, 220)
  }
  ctx.restore()
}

function card(ctx, lt, d, A) {
  const g = ctx.createRadialGradient(540, 900, 50, 540, 900, 1100)
  g.addColorStop(0, '#1b1710')
  g.addColorStop(1, '#050505')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const a = easeOut(seg(lt, 0, 0.6))
  // Icon + "Rewind" heading, centred as a group whatever the icon is (symbol text or an uploaded image).
  const icon = String(d.icon || '')
  const iconImg = d.iconImage ? A.img(d.iconImage) : null
  const ICON_FONT = `600 70px ${FONTS.body}`
  const HEAD_FONT = `400 130px ${FONTS.script}`
  ctx.save()
  ctx.font = ICON_FONT
  const iw = iconImg ? 76 : icon ? ctx.measureText(icon).width : 0
  ctx.font = HEAD_FONT
  const hw = ctx.measureText('Rewind').width
  ctx.restore()
  const gap = iw ? 16 : 0
  const x0 = 540 - (iw + gap + hw) / 2
  if (iconImg) {
    const k = Math.min(76 / iconImg.width, 76 / iconImg.height)
    ctx.save()
    ctx.globalAlpha *= a
    ctx.drawImage(iconImg, x0 + (76 - iconImg.width * k) / 2, 168 - (iconImg.height * k) / 2, iconImg.width * k, iconImg.height * k)
    ctx.restore()
  } else if (icon) text(ctx, icon, x0, 198, { font: ICON_FONT, color: '#F4F1EA', align: 'left', alpha: a })
  text(ctx, 'Rewind', x0 + iw + gap, 205, { font: HEAD_FONT, color: '#F4F1EA', align: 'left', alpha: a, shadow: { color: 'rgba(212,166,58,.35)', blur: 24 } })

  const pe = easeBack(seg(lt, 0.2, 0.9))
  ctx.save()
  ctx.translate(540, 925)
  ctx.scale(0.6 + 0.4 * pe, 0.6 + 0.4 * pe)
  ctx.globalAlpha *= clamp(pe * 2)
  ctx.shadowColor = 'rgba(0,0,0,.7)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 20
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(-390, -565, 780, 1130, 14)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  cover(ctx, A.img(d.poster), -390, -565, 780, 1130, { radius: 14, label: 'ADD POSTER' })
  ctx.restore()

  const l = easeOut(seg(lt, 0.9, 0.7))
  text(ctx, String(d.label || ''), 540, 1640 + (1 - l) * 24, { font: `500 52px ${FONTS.serif}`, color: '#F4F1EA', spacing: 10, alpha: l })
  const title = String(d.title || '').toUpperCase()
  const t2 = easeOut(seg(lt, 1.2, 0.7))
  text(ctx, title, 540, 1730 + (1 - t2) * 24, { font: fitSize(ctx, title, (s) => `600 ${s}px ${FONTS.serif}`, 940, 84, 36, 8), color: '#F4F1EA', spacing: 8, alpha: t2 })
  if (d.subtitle) text(ctx, d.subtitle, 540, 1785, { font: `400 28px ${FONTS.body}`, color: 'rgba(244,241,234,.6)', spacing: 3, alpha: t2 })
  if (d.watermark) watermark(ctx, W, H, { y: 1862, color: 'rgba(212,166,58,.7)' })
}

export default {
  key: 'rewind',
  label: 'Cinema Rewind',
  short: 'Rewind',
  emoji: '\u23EA',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    title: 'Movie Title',
    label: '1 Year of',
    subtitle: '',
    icon: '\u00AB',
    iconImage: '',
    poster: '',
    stills: [],
    perStill: 1.8,
    endSec: 6,
    watermark: true,
    audio: '',
    musicVol: 0.8,
  }),
  fields: [
    { group: 'Content', key: 'title', label: 'Movie title', type: 'text' },
    { group: 'Content', key: 'label', label: 'Anniversary line (e.g. 1 Year of)', type: 'text' },
    { group: 'Content', key: 'subtitle', label: 'Small line (e.g. Released 29 June 2023)', type: 'text' },
    { group: 'Content', key: 'poster', label: 'Poster', type: 'image' },
    { group: 'Content', key: 'stills', label: 'Stills for the film strip (16:9 works best)', type: 'images' },
    { group: 'Look', key: 'icon', label: 'Icon before "Rewind" (any symbol or emoji, blank for none)', type: 'text' },
    { group: 'Look', key: 'iconImage', label: 'Or use an image as the icon (overrides the symbol)', type: 'image' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'perStill', label: 'Seconds per still', type: 'number', min: 0.8, max: 6, step: 0.1 },
    { group: 'Timing & sound', key: 'endSec', label: 'Poster card (s)', type: 'number', min: 3, max: 20 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => scrollDur(d) + Math.max(3, +d.endSec || 6),
  thumbTime: (d) => scrollDur(d) + 2.5,
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    const sd = scrollDur(d)
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, W, H)
    if (t < sd + END_FADE) {
      const out = t < sd ? 1 : 1 - easeInOut(seg(t, sd, END_FADE))
      strip(ctx, t, d, A, out)
    }
    if (t >= sd) {
      ctx.save()
      ctx.globalAlpha = easeInOut(seg(t, sd, END_FADE))
      card(ctx, t - sd, d, A)
      ctx.restore()
    }
  },
}
