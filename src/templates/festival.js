import { BRAND, FONTS } from '../brand.js'
import { seg, clamp, easeOut, easeBack, text, cover, fitSize, richLines, mix, watermark } from '../lib/draw.js'

// Festival Wishes: a vertical greeting poster (4-30 s). An occasion palette, a glowing emblem, the
// greeting, a wish line and a from line.
//
// This file depends only on brand.js and lib/draw.js, so it is byte-identical in every studio that
// uses it; the channel name and fonts come from the brand.
const W = 1080
const H = 1920

export const OCCASIONS = {
  Diwali: { emoji: '\u{1FA94}', bg: '#1A0B2E', panel: '#2A1448', accent: '#FFB627', ink: '#FFF6E0', mute: '#C9A8E8', on: '#1A0B2E', star: '#FFE08A' },
  Pongal: { emoji: '\u{1F33E}', bg: '#0F2A14', panel: '#17401F', accent: '#FFD23F', ink: '#FFF9E3', mute: '#9FC9A0', on: '#0F2A14', star: '#FFF2A8' },
  'New Year': { emoji: '\u{1F386}', bg: '#0A1030', panel: '#141E4A', accent: '#F5C84C', ink: '#F5F7FA', mute: '#98A4D8', on: '#0A1030', star: '#FFFFFF' },
  Christmas: { emoji: '\u{1F384}', bg: '#10241B', panel: '#1B3A2C', accent: '#FF5A5F', ink: '#F5F7FA', mute: '#9CC3AE', on: '#FFFFFF', star: '#FFE9A8' },
  Eid: { emoji: '\u{1F319}', bg: '#07242A', panel: '#0E3A43', accent: '#E8C468', ink: '#F5F7FA', mute: '#8FBCC4', on: '#07242A', star: '#FFF1BF' },
  Holi: { emoji: '\u{1F3A8}', bg: '#25082B', panel: '#3A1042', accent: '#FF4FA3', ink: '#FFF5FB', mute: '#D9A0D2', on: '#FFFFFF', star: '#7CF0FF' },
  'Independence Day': { emoji: '\u{1F1EE}\u{1F1F3}', bg: '#0B1B33', panel: '#13294A', accent: '#FF9933', ink: '#F5F7FA', mute: '#8FA4C4', on: '#0B1B33', star: '#7BE495' },
  'Republic Day': { emoji: '\u{1F1EE}\u{1F1F3}', bg: '#0B1B33', panel: '#13294A', accent: '#FF9933', ink: '#F5F7FA', mute: '#8FA4C4', on: '#0B1B33', star: '#7BE495' },
  'Ayudha Pooja': { emoji: '\u{1F6E0}️', bg: '#2A0E10', panel: '#431A1C', accent: '#FFAE1A', ink: '#FFF4DC', mute: '#D8A98A', on: '#2A0E10', star: '#FFD66B' },
  Dussehra: { emoji: '\u{1F3F9}', bg: '#2B0F0A', panel: '#451B12', accent: '#FF7A1A', ink: '#FFF3E0', mute: '#D9A58A', on: '#2B0F0A', star: '#FFD27A' },
  Navaratri: { emoji: '\u{1F54A}️', bg: '#2A0A2E', panel: '#40154A', accent: '#FF5EA8', ink: '#FFF5FB', mute: '#D9A0D2', on: '#FFFFFF', star: '#FFD66B' },
  Onam: { emoji: '\u{1F338}', bg: '#0F2A1A', panel: '#17402A', accent: '#FFC53D', ink: '#FFF9E3', mute: '#9FC9A8', on: '#0F2A1A', star: '#FFFFFF' },
  Ugadi: { emoji: '\u{1F96D}', bg: '#10281A', panel: '#193E29', accent: '#9BE15D', ink: '#F7FFE9', mute: '#A6C9A8', on: '#10281A', star: '#FFE45C' },
  'Ganesh Chaturthi': { emoji: '\u{1F418}', bg: '#2B1208', panel: '#46200F', accent: '#FF8A3D', ink: '#FFF3E6', mute: '#D9AE92', on: '#2B1208', star: '#FFD66B' },
  Vishu: { emoji: '\u{1F31E}', bg: '#132A10', panel: '#1E411A', accent: '#FFD23F', ink: '#FFFBE6', mute: '#A8C99A', on: '#132A10', star: '#FFF2A8' },
  Ramzan: { emoji: '\u{1F54C}', bg: '#071E2A', panel: '#0E3243', accent: '#6FD4C4', ink: '#F0FBFF', mute: '#8FB8C4', on: '#071E2A', star: '#CFF6EE' },
  Birthday: { emoji: '\u{1F382}', bg: '#1B0F2A', panel: '#2C1845', accent: '#FF6FB5', ink: '#FFF4FB', mute: '#C0A4D8', on: '#1B0F2A', star: '#FFE08A' },
  Anniversary: { emoji: '\u{1F49B}', bg: '#2A1208', panel: '#431E10', accent: '#FFC24B', ink: '#FFF6E6', mute: '#D8B092', on: '#2A1208', star: '#FFE9A8' },
  Celebration: { emoji: '\u{1F389}', bg: '#0D0D12', panel: '#1d1d27', accent: '#D4A63A', ink: '#F4F1EA', mute: '#9a97a6', on: '#0D0D12', star: '#FFE9A0' },
}
export const CUSTOM = 'Custom'
export const BACKDROPS = ['Rays', 'Glow', 'Sparkle', 'Confetti', 'Bokeh', 'Plain']

// Custom: two colours and an emoji; the other shades are derived from them.
const custom = (d) => {
  const bg = /^#[0-9a-f]{6}$/i.test(d.customBg) ? d.customBg : '#101428'
  const accent = /^#[0-9a-f]{6}$/i.test(d.customAccent) ? d.customAccent : '#FFB627'
  return { emoji: '✨', bg, panel: mix(bg, '#ffffff', 0.08), accent, ink: '#F5F7FA', mute: mix(bg, '#ffffff', 0.55), on: bg, star: mix(accent, '#ffffff', 0.5) }
}
const pal = (d) => {
  const P = d.occasion === CUSTOM ? custom(d) : OCCASIONS[d.occasion] || OCCASIONS.Celebration
  const e = String(d.emoji || '').trim()
  return e ? { ...P, emoji: e } : P
}

const rnd = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const circle = (ctx, x, y, r, c) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 7)
  ctx.fillStyle = c
  ctx.fill()
}
const glow = (ctx, P, x, y, r, al = '33') => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, P.accent + al)
  g.addColorStop(1, P.accent + '00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}
// A four-pointed sparkle.
const sparkle = (ctx, x, y, r, c, al) => {
  ctx.save()
  ctx.globalAlpha = al
  ctx.fillStyle = c
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.fill()
  ctx.restore()
}

function backdrop(ctx, P, style, t) {
  ctx.fillStyle = P.bg
  ctx.fillRect(0, 0, W, H)
  if (style === 'Plain') return
  if (style === 'Rays') {
    ctx.fillStyle = P.accent + '14'
    for (let i = 0; i < 24; i += 2) {
      const a0 = (i / 24) * Math.PI * 2
      const a1 = ((i + 1) / 24) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(540, 620)
      ctx.lineTo(540 + Math.cos(a0) * 2600, 620 + Math.sin(a0) * 2600)
      ctx.lineTo(540 + Math.cos(a1) * 2600, 620 + Math.sin(a1) * 2600)
      ctx.fill()
    }
    glow(ctx, P, 540, 620, 760)
    return
  }
  if (style === 'Glow') return glow(ctx, P, 540, 560, 950, '3A')
  if (style === 'Bokeh') {
    glow(ctx, P, 540, 500, 900, '1E')
    for (let i = 0; i < 26; i++) {
      const r = 30 + rnd(i, 1) * 90
      const span = H + 300
      const y = (((rnd(i, 2) * span - t * (10 + rnd(i, 3) * 22)) % span) + span) % span - 150
      circle(ctx, rnd(i, 4) * W, y, r, P.accent + (rnd(i, 5) > 0.5 ? '14' : '0C'))
    }
    return
  }
  if (style === 'Confetti') {
    glow(ctx, P, 540, 500, 900, '22')
    for (let i = 0; i < 46; i++) {
      const span = H + 240
      const x = rnd(i, 1) * W
      const y = (((rnd(i, 2) * span + t * (60 + rnd(i, 3) * 120)) % span) + span) % span - 120
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(t * (1 + rnd(i, 4) * 2) + i)
      ctx.globalAlpha = 0.5
      ctx.fillStyle = i % 3 === 0 ? P.accent : i % 3 === 1 ? P.star : P.ink
      ctx.fillRect(-9, -16, 18, 32)
      ctx.restore()
    }
    return
  }
  // Sparkle
  glow(ctx, P, 540, 560, 900, '2A')
  for (let i = 0; i < 30; i++) {
    const x = (((i * 137) % 100) / 100) * W
    const y = 120 + (((i * 61) % 100) / 100) * (H - 240)
    sparkle(ctx, x, y, 10 + (i % 4) * 7, i % 3 ? P.star : P.accent, 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)))
  }
}

// Wrapped centred text that shrinks to fit instead of overflowing.
function vpara(ctx, str, x, cy, { px = 54, weight = 500, font = FONTS.body, color = '#fff', maxW = 880, max = 3, alpha = 1, rise = 0 } = {}) {
  const mk = (s) => `${weight} ${s}px ${font}`
  const min = Math.max(20, Math.round(px * 0.55))
  let size = px
  let ls = richLines(ctx, String(str ?? ''), maxW, () => mk(size))
  while (size > min && (ls.length > max || ls.some((l) => l.width > maxW))) {
    size -= 3
    ls = richLines(ctx, String(str ?? ''), maxW, () => mk(size))
  }
  ls = ls.slice(0, max)
  const step = size * 1.24
  const y0 = cy - ((ls.length - 1) * step) / 2 + size * 0.35
  ls.forEach((l, i) => text(ctx, l.words.map((q) => q.w).join(' '), x, y0 + i * step + rise, { font: mk(size), color, alpha }))
}

export default {
  key: 'festival',
  label: 'Festival Wishes',
  short: 'Wishes',
  emoji: '\u{1F389}',
  kind: 'short',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    occasion: 'Diwali',
    emoji: '',
    customBg: '#101428',
    customAccent: '#FFB627',
    bgStyle: 'Rays',
    greeting: 'Happy Diwali',
    wish: 'Wishing you light, joy and a year of great stories.',
    from: 'from ' + BRAND.name,
    emblem: '',
    emblemZoom: 1,
    seconds: 8,
    watermark: true,
    audio: '',
    musicVol: 0.7,
  }),
  fields: [
    { group: 'Content', key: 'greeting', label: 'Greeting', type: 'text' },
    { group: 'Content', key: 'wish', label: 'Wish line', type: 'textarea' },
    { group: 'Content', key: 'from', label: 'From line', type: 'text' },
    { group: 'Content', key: 'emblem', label: 'Emblem image (optional, replaces the emoji)', type: 'image' },
    { group: 'Look', key: 'occasion', label: 'Festival / occasion colours', type: 'select', options: [...Object.keys(OCCASIONS), CUSTOM] },
    { group: 'Look', key: 'emoji', label: 'Emblem emoji (empty = occasion default)', type: 'text' },
    { group: 'Look', key: 'bgStyle', label: 'Background template', type: 'select', options: BACKDROPS },
    { group: 'Look', key: 'customBg', label: 'Custom: background colour', type: 'color' },
    { group: 'Look', key: 'customAccent', label: 'Custom: accent colour', type: 'color' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Photo position', key: 'emblemZoom', label: 'Emblem zoom', type: 'range', min: 1, max: 2.5, step: 0.05, seek: 3 },
    { group: 'Timing & sound', key: 'seconds', label: 'Length (seconds)', type: 'number', min: 4, max: 30 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => Math.min(30, Math.max(4, +d.seconds || 8)),
  thumbTime: (d) => Math.min(2.6, Math.max(1, (+d.seconds || 8) / 3)),
  fileName: (d) => d.greeting || d.occasion,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const pop = easeBack(seg(t, 0.2, 0.9))
    const a1 = easeOut(seg(t, 0.9, 0.6))
    const a2 = easeOut(seg(t, 1.4, 0.6))
    const a3 = easeOut(seg(t, 1.9, 0.6))
    backdrop(ctx, P, BACKDROPS.includes(d.bgStyle) ? d.bgStyle : 'Rays', t)

    // Emblem: a glowing ring holding the emoji or an uploaded image.
    ctx.save()
    ctx.translate(540, 620)
    ctx.scale(0.5 + 0.5 * pop, 0.5 + 0.5 * pop)
    ctx.translate(-540, -620)
    glow(ctx, P, 540, 620, 330, '55')
    circle(ctx, 540, 620, 220, P.panel)
    ctx.lineWidth = 8
    ctx.strokeStyle = P.accent
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.strokeStyle = P.accent + '66'
    ctx.beginPath()
    ctx.arc(540, 620, 250 + 6 * Math.sin(t * 2), 0, 7)
    ctx.stroke()
    const img = A.img(d.emblem)
    if (img) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(540, 620, 200, 0, 7)
      ctx.clip()
      cover(ctx, img, 340, 420, 400, 400, { zoom: Math.max(1, +d.emblemZoom || 1), label: '' })
      ctx.restore()
    } else {
      text(ctx, P.emoji, 540, 630 + 6 * Math.sin(t * 2.4), {
        font: `200px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`,
        color: P.ink,
        baseline: 'middle',
      })
    }
    ctx.restore()

    // Greeting, accent bar, wish line, from line.
    const big = String(d.greeting || '').trim() || 'Best wishes'
    const gf = fitSize(ctx, big, (s) => `700 ${s}px ${FONTS.display}`, 900, 128, 56, 2)
    text(ctx, big, 540, 1040, { font: gf, color: P.accent, spacing: 2, alpha: a1 })
    ctx.save()
    ctx.globalAlpha = a2
    ctx.fillStyle = P.accent
    ctx.beginPath()
    ctx.roundRect(540 - 90 * a2, 1150, 180 * a2, 8, 4)
    ctx.fill()
    ctx.restore()
    vpara(ctx, d.wish, 540, 1270, { px: 52, color: P.ink, maxW: 860, max: 3, alpha: a2, rise: (1 - a2) * 30 })

    const from = String(d.from || '').trim()
    if (from) {
      ctx.save()
      let px = 40
      for (; px > 24; px -= 2) {
        ctx.font = `700 ${px}px ${FONTS.body}`
        if (ctx.measureText(from).width + 80 <= 900) break
      }
      ctx.font = `700 ${px}px ${FONTS.body}`
      const w = ctx.measureText(from).width + 80
      ctx.restore()
      ctx.save()
      ctx.globalAlpha = a3
      ctx.fillStyle = P.accent
      ctx.beginPath()
      ctx.roundRect(540 - w / 2, 1420 - px, w, px * 2, px)
      ctx.fill()
      text(ctx, from, 540, 1420 + px * 0.35, { font: `700 ${px}px ${FONTS.body}`, color: P.on })
      ctx.restore()
    }
    if (d.watermark) watermark(ctx, W, H, { y: 1870, color: P.mute })
  },
}
