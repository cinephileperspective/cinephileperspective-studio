import { FONTS } from '../brand.js'
import { seg, easeOut, easeBack, mix, text, polaroid, seal, fitSize, watermark, sparkles } from '../lib/draw.js'

// Star of the Day: black-to-gold gradient, script greeting, tilted photo print with a gold seal.
const W = 1080
const H = 1920

export default {
  key: 'birthday',
  label: 'Star of the Day',
  short: 'Birthday',
  emoji: '\u{1F382}',
  kind: 'short',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    line1: 'Happy',
    line2: 'Birthday',
    name: 'Star Name',
    role: 'Actress',
    photo: '',
    photo2: '',
    photoX: 0.5,
    photoY: 0.25,
    photoZoom: 1,
    photo2X: 0.5,
    photo2Y: 0.25,
    accent: '#C48A10',
    seconds: 10,
    watermark: true,
    audio: '',
    musicVol: 0.8,
  }),
  fields: [
    { group: 'Content', key: 'name', label: 'Name', type: 'text' },
    { group: 'Content', key: 'role', label: 'Role (Actress, Director, Composer\u2026)', type: 'text' },
    { group: 'Content', key: 'photo', label: 'Main photo', type: 'image' },
    { group: 'Photo position', key: 'photoX', label: 'Main photo: left \u2194 right', type: 'range', min: 0, max: 1, step: 0.01, seek: 5 },
    { group: 'Photo position', key: 'photoY', label: 'Main photo: top \u2195 bottom (faces are usually near the top)', type: 'range', min: 0, max: 1, step: 0.01, seek: 5 },
    { group: 'Photo position', key: 'photoZoom', label: 'Main photo: zoom', type: 'range', min: 1, max: 2.5, step: 0.01, seek: 5 },
    { group: 'Content', key: 'photo2', label: 'Second photo (optional)', type: 'image' },
    { group: 'Photo position', key: 'photo2X', label: 'Second photo: left \u2194 right', type: 'range', min: 0, max: 1, step: 0.01, seek: 5 },
    { group: 'Photo position', key: 'photo2Y', label: 'Second photo: top \u2195 bottom', type: 'range', min: 0, max: 1, step: 0.01, seek: 5 },
    { group: 'Content', key: 'line1', label: 'Greeting, line 1', type: 'text' },
    { group: 'Content', key: 'line2', label: 'Greeting, line 2', type: 'text' },
    { group: 'Look', key: 'accent', label: 'Gold tone', type: 'color' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'seconds', label: 'Length (seconds)', type: 'number', min: 6, max: 30 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => Math.max(6, +d.seconds || 10),
  thumbTime: () => 5,
  fileName: (d) => d.name,

  draw(ctx, t, d, A) {
    const accent = d.accent || '#C48A10'
    const bg = ctx.createLinearGradient(0, 0, W, 0)
    bg.addColorStop(0, '#070502')
    bg.addColorStop(0.2, mix('#070502', accent, 0.1))
    bg.addColorStop(0.62, mix('#070502', accent, 0.62))
    bg.addColorStop(1, accent)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W * 0.85, H * 0.4, 0, W * 0.85, H * 0.4, 900)
    glow.addColorStop(0, 'rgba(255,230,150,.30)')
    glow.addColorStop(1, 'rgba(255,230,150,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    sparkles(ctx, t, W, H)

    // Greeting: each line is wiped in from the left, like handwriting.
    const greet = (str, start, cx, base, size) => {
      const p = easeOut(seg(t, start, 0.95))
      if (!p) return
      ctx.save()
      ctx.beginPath()
      ctx.rect(40, base - size * 1.05, (W - 80) * p, size * 1.7)
      ctx.clip()
      text(ctx, str, cx, base, { font: `400 ${size}px ${FONTS.script}`, shadow: { color: 'rgba(0,0,0,.35)', y: 6, blur: 16 } })
      ctx.restore()
    }
    greet(d.line1, 0.3, 500, 385, 190)
    greet(d.line2, 1.2, 560, 590, 200)

    // Main print drops in with a little overshoot.
    const pin = seg(t, 0.1, 1.1)
    const e = easeBack(pin)
    const cy = 1085 + (1 - e) * 420
    const rot = -0.05 - (1 - e) * 0.2
    ctx.save()
    ctx.globalAlpha = Math.min(1, pin * 3)
    polaroid(ctx, A.img(d.photo), 540, cy, 780, 800, rot, { fx: d.photoX, fy: d.photoY, zoom: (+d.photoZoom || 1) * (1 + 0.04 * seg(t, 0, 10)) })
    ctx.translate(540, cy)
    ctx.rotate(rot)
    const sp = easeBack(seg(t, 1.2, 0.6))
    if (sp > 0) seal(ctx, 78, -400 + 38, 46, sp)
    ctx.restore()

    if (d.photo2) {
      const p2 = seg(t, 2.1, 0.7)
      if (p2 > 0) {
        ctx.save()
        ctx.globalAlpha = Math.min(1, p2 * 3)
        const s = 0.3 + 0.7 * easeBack(p2)
        ctx.translate(815, 1370)
        ctx.scale(s, s)
        polaroid(ctx, A.img(d.photo2), 0, 0, 290, 300, 0.07, { border: 14, bottom: 30, fx: d.photo2X, fy: d.photo2Y })
        ctx.restore()
      }
    }

    const n = easeOut(seg(t, 2.8, 0.9))
    const name = String(d.name || '').toUpperCase()
    const nameFont = fitSize(ctx, name, (s) => `500 ${s}px ${FONTS.serif}`, 900, 64, 30, 8)
    text(ctx, name, 540, 1640 + (1 - n) * 30, { font: nameFont, color: '#F7F1E3', spacing: 8, alpha: n })
    const r = easeOut(seg(t, 3.4, 0.9))
    text(ctx, String(d.role || '').toUpperCase(), 540, 1716 + (1 - r) * 24, { font: `500 34px ${FONTS.serif}`, color: 'rgba(255,255,255,.78)', spacing: 18, alpha: r })

    if (d.watermark) watermark(ctx, W, H, { y: 1850 })
  },
}
