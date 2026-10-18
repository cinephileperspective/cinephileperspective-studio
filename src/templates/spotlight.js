import { FONTS } from '../brand.js'
import { seg, clamp, easeOut, easeBack, easeInOut, text, cover, fitSize, watermark } from '../lib/draw.js'

// Weekend Watch: a cover-flow carousel of posters, one caption per film.
const W = 1080
const H = 1920
const PW = 760
const PH = 1050
const PY = 945
const INTRO = 1.2

const timing = (d) => {
  const hold = Math.max(1.5, +d.hold || 3.4)
  return { hold, tr: Math.min(0.7, hold / 3) }
}
const count = (d) => Math.max(1, (d.movies || []).length)

function position(d, t) {
  const n = count(d)
  const { hold, tr } = timing(d)
  const u = Math.max(0, (t - INTRO) / hold)
  const i = Math.min(Math.floor(u), n - 1)
  const f = (u - i) * hold
  return i < n - 1 ? i + easeInOut(seg(f, hold - tr, tr)) : n - 1
}

export default {
  key: 'spotlight',
  label: 'Weekend Watch',
  short: 'Weekend',
  emoji: '\u{1F37F}',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    kicker: 'Weekend',
    title: 'Watch',
    movies: [
      { poster: '', title: 'Movie One', cast: 'Actor One, Actor Two', director: 'Director Name', date: 'In theatres' },
      { poster: '', title: 'Movie Two', cast: 'Actor Three, Actor Four', director: 'Director Name', date: 'Streaming' },
    ],
    skyTop: '#63D3FF',
    skyBottom: '#DDF3FF',
    arc: '#F8B63A',
    titleColor: '#FF4B4B',
    hold: 3.4,
    watermark: true,
    audio: '',
    musicVol: 0.8,
  }),
  fields: [
    { group: 'Content', key: 'kicker', label: 'Small heading', type: 'text' },
    { group: 'Content', key: 'title', label: 'Big heading', type: 'text' },
    {
      group: 'Content',
      key: 'movies',
      label: 'Films',
      type: 'list',
      itemLabel: 'Film',
      newItem: { poster: '', title: '', cast: '', director: '', date: '' },
      fields: [
        { key: 'poster', label: 'Poster', type: 'image' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'cast', label: 'Cast (comma separated)', type: 'text' },
        { key: 'director', label: 'Director', type: 'text' },
        { key: 'date', label: 'Release line (optional)', type: 'text' },
      ],
    },
    { group: 'Look', key: 'skyTop', label: 'Sky, top', type: 'color' },
    { group: 'Look', key: 'skyBottom', label: 'Sky, bottom', type: 'color' },
    { group: 'Look', key: 'arc', label: 'Arc colour', type: 'color' },
    { group: 'Look', key: 'titleColor', label: 'Heading colour', type: 'color' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'hold', label: 'Seconds per film', type: 'number', min: 1.5, max: 10, step: 0.1 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => INTRO + count(d) * timing(d).hold + 0.4,
  thumbTime: () => INTRO + 0.8,
  fileName: (d) => `${d.kicker} ${d.title}`,

  draw(ctx, t, d, A) {
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, d.skyTop)
    sky.addColorStop(1, d.skyBottom)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = d.arc
    ctx.beginPath()
    ctx.arc(540, 720, 470 + 20 * Math.sin(t * 0.8), 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.45)'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(540, 720, 510, Math.PI, Math.PI * 2)
    ctx.stroke()

    const he = easeBack(seg(t, 0, 0.8))
    const ha = clamp(he * 2)
    text(ctx, String(d.kicker || '').toUpperCase(), 540, 165 - (1 - he) * 120, { font: `700 54px ${FONTS.body}`, color: '#111', spacing: 14, alpha: ha })
    const big = String(d.title || '').toUpperCase()
    const bigFont = fitSize(ctx, big, (s) => `400 ${s}px ${FONTS.fun}`, 940, 205, 90)
    const by = 345 - (1 - he) * 160
    text(ctx, big, 548, by + 8, { font: bigFont, color: '#FFB3B3', alpha: ha })
    text(ctx, big, 540, by, { font: bigFont, color: d.titleColor, alpha: ha })

    const movies = d.movies && d.movies.length ? d.movies : [{}]
    const p = position(d, t)
    const intro = easeBack(seg(t, 0.3, 0.9))
    const order = movies.map((m, i) => ({ m, i, dist: i - p })).filter((o) => Math.abs(o.dist) < 1.7)
    order.sort((a, b) => Math.abs(b.dist) - Math.abs(a.dist))
    for (const { m, dist } of order) {
      const ad = Math.abs(dist)
      const sx = Math.max(0.1, 1 - 0.55 * ad)
      const sy = 1 - 0.1 * Math.min(ad, 1)
      ctx.save()
      ctx.translate(540 + dist * 560, PY)
      const k = 0.7 + 0.3 * intro
      ctx.scale(sx * k, sy * k)
      ctx.globalAlpha = clamp(intro * 2) * (1 - clamp((ad - 1) / 0.7))
      ctx.shadowColor = 'rgba(20,40,80,.35)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 18
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.roundRect(-PW / 2 - 14, -PH / 2 - 14, PW + 28, PH + 28, 54)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      cover(ctx, A.img(m.poster), -PW / 2, -PH / 2, PW, PH, { radius: 42, label: 'ADD POSTER' })
      ctx.restore()
    }

    const cur = movies[Math.round(p)] || {}
    const ca = clamp(1 - Math.abs(p - Math.round(p)) * 3.5) * clamp(intro * 2)
    const ink = '#172554'
    const ttl = String(cur.title || '').toUpperCase()
    text(ctx, ttl, 540, 1572, { font: fitSize(ctx, ttl, (s) => `700 ${s}px ${FONTS.body}`, 940, 58, 30, 2), color: ink, spacing: 2, alpha: ca })
    const cast = String(cur.cast || '').split(',').map((s) => s.trim()).filter(Boolean).join('  \u2728  ')
    if (cast) text(ctx, cast, 540, 1636, { font: fitSize(ctx, cast, (s) => `500 ${s}px ${FONTS.body}`, 940, 34, 20), color: ink, alpha: ca })
    if (cur.director) text(ctx, 'Directed by \u{1F3A5} ' + cur.director, 540, 1688, { font: `500 32px ${FONTS.body}`, color: ink, alpha: ca })
    if (cur.date) text(ctx, cur.date, 540, 1744, { font: `700 32px ${FONTS.body}`, color: d.titleColor, spacing: 2, alpha: ca })
    if (d.watermark) watermark(ctx, W, H, { y: 1850, color: 'rgba(23,37,84,.4)' })
  },
}
