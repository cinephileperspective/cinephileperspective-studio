import { FONTS, BRAND } from '../brand.js'
import { seg, easeOut, easeBack, mix, text, cover, richLines, watermark } from '../lib/draw.js'

// Cinema Update (Cinema Buzz): image on top, crimson label, status tag, big headline, summary, source, ticker.
const W = 1080
const H = 1920
const IMG_H = 1180
const STATUS = { Official: '#1FA66A', Reported: '#E0A020', Rumour: '#7C7C8E' }

export default {
  key: 'buzz',
  label: 'Cinema Update',
  short: 'Update',
  emoji: '\u{1F4F0}',
  kind: 'short',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    label: 'Cinema Buzz',
    status: 'Official',
    date: '',
    headline: 'Headline in a few strong words',
    summary: 'One or two lines that explain what happened and why it matters.',
    source: 'Source: ',
    image: '',
    imageX: 0.5,
    imageY: 0.35,
    imageZoom: 1,
    accent: '#D7263D',
    ticker: true,
    watermark: true,
    seconds: 10,
    audio: '',
    musicVol: 0.7,
  }),
  fields: [
    { group: 'Content', key: 'headline', label: 'Headline', type: 'textarea' },
    { group: 'Content', key: 'summary', label: 'Summary (1\u20132 lines)', type: 'textarea' },
    { group: 'Content', key: 'status', label: 'Status tag', type: 'select', options: ['Official', 'Reported', 'Rumour'] },
    { group: 'Content', key: 'source', label: 'Source line', type: 'text' },
    { group: 'Content', key: 'date', label: 'Date (optional, e.g. 18 OCT 2026)', type: 'text' },
    { group: 'Content', key: 'image', label: 'Poster / still / first look', type: 'image' },
    { group: 'Photo position', key: 'imageX', label: 'Image: left \u2194 right', type: 'range', min: 0, max: 1, step: 0.01, seek: 4 },
    { group: 'Photo position', key: 'imageY', label: 'Image: top \u2195 bottom', type: 'range', min: 0, max: 1, step: 0.01, seek: 4 },
    { group: 'Photo position', key: 'imageZoom', label: 'Image: zoom', type: 'range', min: 1, max: 2.5, step: 0.01, seek: 4 },
    { group: 'Look', key: 'label', label: 'Label strip', type: 'text' },
    { group: 'Look', key: 'accent', label: 'Accent colour', type: 'color' },
    { group: 'Look', key: 'ticker', label: 'Show scrolling ticker', type: 'checkbox' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'seconds', label: 'Length (seconds)', type: 'number', min: 5, max: 30 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => Math.max(5, +d.seconds || 10),
  thumbTime: () => 4,
  fileName: (d) => d.headline,

  draw(ctx, t, d, A) {
    const acc = d.accent || '#D7263D'
    const total = this.duration(d)
    ctx.fillStyle = '#0B0B10'
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.globalAlpha = easeOut(seg(t, 0, 0.8))
    cover(ctx, A.img(d.image), 0, 0, W, IMG_H, { fx: d.imageX, fy: d.imageY, zoom: (+d.imageZoom || 1) * (1 + 0.07 * seg(t, 0, total)), label: 'ADD IMAGE' })
    const fade = ctx.createLinearGradient(0, 640, 0, IMG_H)
    fade.addColorStop(0, 'rgba(11,11,16,0)')
    fade.addColorStop(1, 'rgba(11,11,16,1)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 640, W, IMG_H - 640)
    const top = ctx.createLinearGradient(0, 0, 0, 380)
    top.addColorStop(0, 'rgba(0,0,0,.65)')
    top.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, W, 380)
    ctx.restore()

    // Label strip slides in from the left.
    const sw = 120 + 520 * easeOut(seg(t, 0.2, 0.6))
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 150, sw, 84)
    ctx.clip()
    ctx.fillStyle = acc
    ctx.fillRect(0, 150, 600, 84)
    text(ctx, String(d.label || '').toUpperCase(), 56, 214, { font: `400 64px ${FONTS.display}`, color: '#fff', align: 'left', spacing: 4 })
    ctx.restore()
    if (d.date) text(ctx, d.date, 58, 280, { font: `500 28px ${FONTS.body}`, color: 'rgba(255,255,255,.85)', align: 'left', spacing: 3, alpha: easeOut(seg(t, 0.7, 0.5)) })

    // Status tag: green official, amber reported, grey rumour.
    const tag = String(d.status || 'Official')
    const label = tag.toUpperCase()
    ctx.save()
    ctx.font = `700 30px ${FONTS.body}`
    ctx.letterSpacing = '3px'
    const pw = ctx.measureText(label).width + 64
    ctx.restore()
    const pop = easeBack(seg(t, 0.6, 0.5))
    if (pop > 0) {
      ctx.save()
      ctx.translate(W - 56 - pw / 2, 192)
      ctx.scale(pop, pop)
      ctx.fillStyle = STATUS[tag] || STATUS.Official
      ctx.beginPath()
      ctx.roundRect(-pw / 2, -36, pw, 72, 36)
      ctx.fill()
      text(ctx, label, 0, 11, { font: `700 30px ${FONTS.body}`, color: '#fff', spacing: 3 })
      ctx.restore()
    }

    // Headline: as large as fits in at most four lines, each line rising in.
    const head = String(d.headline || '').toUpperCase().replace(/\s*\n\s*/g, ' ')
    let size = 150
    let lines
    let font
    for (; size >= 64; size -= 6) {
      font = `400 ${size}px ${FONTS.display}`
      lines = richLines(ctx, head, W - 160, () => font)
      if (lines.length <= 4) break
    }
    const lh = size * 1.02
    const y0 = 1420 - (lines.length - 1) * lh
    const barA = easeOut(seg(t, 1, 0.6))
    ctx.fillStyle = acc
    ctx.fillRect(50, y0 - size * 0.82, 12, (lines.length - 1) * lh + size * 0.95 * barA)
    lines.forEach((ln, i) => {
      const p = easeOut(seg(t, 1 + i * 0.25, 0.55))
      text(ctx, ln.words.map((w) => w.w).join(' '), 90, y0 + i * lh + (1 - p) * 40, { font, color: '#fff', align: 'left', alpha: p, shadow: { color: 'rgba(0,0,0,.5)', blur: 14, y: 4 } })
    })

    const sumFont = `400 38px ${FONTS.body}`
    const sum = richLines(ctx, d.summary || '', 900, () => sumFont).slice(0, 4)
    const sp = easeOut(seg(t, 2.2, 0.8))
    sum.forEach((ln, i) => text(ctx, ln.words.map((w) => w.w).join(' '), 90, 1512 + i * 56 + (1 - sp) * 24, { font: sumFont, color: 'rgba(244,241,234,.86)', align: 'left', alpha: sp }))

    if (String(d.source || '').trim()) {
      const sa = easeOut(seg(t, 2.8, 0.6))
      ctx.fillStyle = `rgba(255,255,255,${0.22 * sa})`
      ctx.fillRect(90, 1712, 900, 2)
      text(ctx, d.source, 90, 1758, { font: `500 28px ${FONTS.body}`, color: mix('#ffffff', acc, 0.35), align: 'left', spacing: 1, alpha: sa })
    }

    if (d.ticker) {
      ctx.fillStyle = acc
      ctx.fillRect(0, 1792, W, 70)
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 1792, W, 70)
      ctx.clip()
      const str = `${BRAND.name.toUpperCase()}   \u2022   ${BRAND.tagline.toUpperCase()}   \u2022   `
      ctx.font = `600 30px ${FONTS.body}`
      ctx.letterSpacing = '3px'
      const cw = Math.max(200, ctx.measureText(str).width)
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      for (let x = -((t * 140) % cw); x < W; x += cw) ctx.fillText(str, x, 1838)
      ctx.restore()
    }
    if (d.watermark) watermark(ctx, W, H, { y: 1896, color: 'rgba(255,255,255,.4)' })
  },
}
