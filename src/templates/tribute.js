import { FONTS } from '../brand.js'
import { seg, easeOut, text, cover, fitSize, richLines, drawRich, watermark, sparkles } from '../lib/draw.js'

// Remembrance: a quiet, dignified card for death anniversaries or passing news.
const W = 1080
const H = 1920
const PX = 140
const PY = 440
const PW = 800
const PH = 870

function candle(ctx, x, y, t, alpha) {
  const fl = 1 + 0.06 * Math.sin(t * 9) + 0.04 * Math.sin(t * 14 + 1)
  ctx.save()
  ctx.globalAlpha *= alpha
  const g = ctx.createRadialGradient(x, y - 40, 4, x, y - 40, 160 * fl)
  g.addColorStop(0, 'rgba(255,200,120,.42)')
  g.addColorStop(1, 'rgba(255,200,120,0)')
  ctx.fillStyle = g
  ctx.fillRect(x - 180, y - 220, 360, 360)
  ctx.fillStyle = '#E9E3D3'
  ctx.beginPath()
  ctx.roundRect(x - 14, y, 28, 78, 6)
  ctx.fill()
  ctx.translate(x + Math.sin(t * 7) * 1.5, y - 8)
  ctx.scale(1, fl)
  const fg = ctx.createLinearGradient(0, -58, 0, 0)
  fg.addColorStop(0, '#FFB347')
  fg.addColorStop(1, '#FFF3C4')
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.moveTo(0, -58)
  ctx.bezierCurveTo(16, -32, 14, -6, 0, 2)
  ctx.bezierCurveTo(-14, -6, -16, -32, 0, -58)
  ctx.fill()
  ctx.restore()
}

export default {
  key: 'tribute',
  label: 'Remembrance',
  short: 'Tribute',
  emoji: '\u{1F56F}\uFE0F',
  kind: 'short',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    heading: 'In Loving Memory',
    name: 'Name',
    role: 'Actor',
    dates: '1950 \u2013 2020',
    occasion: 'Death Anniversary',
    message: '',
    photo: '',
    photoX: 0.5,
    photoY: 0.25,
    photoZoom: 1,
    blackAndWhite: true,
    candle: true,
    accent: '#E8E2D0',
    watermark: true,
    seconds: 10,
    audio: '',
    musicVol: 0.7,
  }),
  fields: [
    { group: 'Content', key: 'heading', label: 'Heading (In Loving Memory, Rest in Peace\u2026)', type: 'text' },
    { group: 'Content', key: 'name', label: 'Name', type: 'text' },
    { group: 'Content', key: 'role', label: 'Role (Actor, Director, Singer\u2026)', type: 'text' },
    { group: 'Content', key: 'dates', label: 'Years or dates (1950 \u2013 2020)', type: 'text' },
    { group: 'Content', key: 'occasion', label: 'Occasion (5th Death Anniversary, Passes Away\u2026)', type: 'text' },
    { group: 'Content', key: 'message', label: 'Short tribute line (optional)', type: 'textarea' },
    { group: 'Content', key: 'photo', label: 'Photo', type: 'image' },
    { group: 'Photo position', key: 'photoX', label: 'Photo: left \u2194 right', type: 'range', min: 0, max: 1, step: 0.01, seek: 4 },
    { group: 'Photo position', key: 'photoY', label: 'Photo: top \u2195 bottom', type: 'range', min: 0, max: 1, step: 0.01, seek: 4 },
    { group: 'Photo position', key: 'photoZoom', label: 'Photo: zoom', type: 'range', min: 1, max: 2.5, step: 0.01, seek: 4 },
    { group: 'Look', key: 'blackAndWhite', label: 'Black and white photo', type: 'checkbox' },
    { group: 'Look', key: 'candle', label: 'Show candle', type: 'checkbox' },
    { group: 'Look', key: 'accent', label: 'Text tone', type: 'color' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'seconds', label: 'Length (seconds)', type: 'number', min: 6, max: 30 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => Math.max(6, +d.seconds || 10),
  thumbTime: () => 5,
  fileName: (d) => d.name,

  draw(ctx, t, d, A) {
    const acc = d.accent || '#E8E2D0'
    const bg = ctx.createRadialGradient(540, 700, 100, 540, 900, 1400)
    bg.addColorStop(0, '#1c1c22')
    bg.addColorStop(1, '#050507')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    sparkles(ctx, t, W, H, { count: 14, color: '235,225,205' })

    if (d.candle) candle(ctx, 540, 150, t, easeOut(seg(t, 0.2, 1)))
    const hd = easeOut(seg(t, 0.8, 1))
    text(ctx, d.heading || '', 540, 350 + (1 - hd) * 20, { font: fitSize(ctx, d.heading || '', (s) => `400 ${s}px ${FONTS.script}`, 900, 100, 50), color: '#F4F1EA', alpha: hd })

    const pa = easeOut(seg(t, 0, 1.4))
    ctx.save()
    ctx.globalAlpha = pa
    ctx.shadowColor = 'rgba(0,0,0,.7)'
    ctx.shadowBlur = 50
    ctx.shadowOffsetY = 20
    ctx.fillStyle = '#0a0a0c'
    ctx.beginPath()
    ctx.roundRect(PX, PY, PW, PH, 22)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    const photo = d.blackAndWhite && A.gray ? A.gray(d.photo) : A.img(d.photo)
    cover(ctx, photo, PX, PY, PW, PH, { radius: 22, fx: d.photoX, fy: d.photoY, zoom: (+d.photoZoom || 1) * (1 + 0.05 * seg(t, 0, 10)) })
    const fade = ctx.createLinearGradient(0, PY + PH - 280, 0, PY + PH)
    fade.addColorStop(0, 'rgba(5,5,7,0)')
    fade.addColorStop(1, 'rgba(5,5,7,.9)')
    ctx.fillStyle = fade
    ctx.beginPath()
    ctx.roundRect(PX, PY + PH - 280, PW, 280, [0, 0, 22, 22])
    ctx.fill()
    ctx.strokeStyle = 'rgba(232,226,208,.5)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(PX, PY, PW, PH, 22)
    ctx.stroke()
    ctx.restore()

    const rise = (start) => easeOut(seg(t, start, 0.9))
    const name = String(d.name || '').toUpperCase()
    const n = rise(1.8)
    text(ctx, name, 540, 1432 + (1 - n) * 26, { font: fitSize(ctx, name, (s) => `600 ${s}px ${FONTS.serif}`, 940, 72, 34, 6), color: '#F7F1E3', spacing: 6, alpha: n })
    const r = rise(2.3)
    text(ctx, String(d.role || '').toUpperCase(), 540, 1490 + (1 - r) * 20, { font: `500 30px ${FONTS.serif}`, color: acc, spacing: 14, alpha: r * 0.8 })
    const y = rise(2.8)
    text(ctx, d.dates || '', 540, 1565 + (1 - y) * 20, { font: `500 40px ${FONTS.body}`, color: acc, spacing: 8, alpha: y })
    const o = rise(3.4)
    const occ = String(d.occasion || '').toUpperCase()
    text(ctx, occ, 540, 1640 + (1 - o) * 20, { font: fitSize(ctx, occ, (s) => `600 ${s}px ${FONTS.serif}`, 940, 46, 24, 8), color: '#fff', spacing: 8, alpha: o })
    if (String(d.message || '').trim()) {
      const fontFor = () => `400 32px ${FONTS.body}`
      const lines = richLines(ctx, d.message, 820, fontFor).slice(0, 3)
      const m = rise(4.2)
      ctx.save()
      ctx.globalAlpha = m
      drawRich(ctx, lines, 540, 1712 + (1 - m) * 16, 48, fontFor, 'rgba(255,255,255,.75)', '#fff')
      ctx.restore()
    }
    if (d.watermark) watermark(ctx, W, H, { y: 1862, color: 'rgba(232,226,208,.5)' })
  },
}
