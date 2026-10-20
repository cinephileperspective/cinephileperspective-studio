import { FONTS, BRAND } from '../brand.js'
import { seg, easeOut, easeInOut, easeBack, text, cover, fitSize, richLines, drawRich, clamp } from '../lib/draw.js'

// Cinephile Review: poster / synopsis / score slides on a beige band, with reaction clips underneath.
const W = 1080
const H = 1920
const BAND_Y = 930
const VID_Y = 1200
const TR = 0.5

function scenes(d) {
  const list = [{ kind: 'title', dur: Math.max(1, +d.titleSec || 3.5) }]
  if (String(d.synopsis || '').trim()) list.push({ kind: 'synopsis', dur: Math.max(2, +d.synopsisSec || 8) })
  for (const sl of d.slides || []) list.push({ kind: 'slide', sl, dur: Math.max(1, +d.slideSec || 4) })
  if (String(d.overall || '').trim()) list.push({ kind: 'overall', dur: Math.max(1, +d.slideSec || 4) + 1 })
  let start = 0
  for (const s of list) {
    s.start = start
    start += s.dur
  }
  return list
}

const sceneAt = (list, t) => {
  let i = list.length - 1
  for (let k = 0; k < list.length; k++) {
    if (t < list[k].start + list[k].dur) {
      i = k
      break
    }
  }
  return i
}

const clipShare = (d, total) => total / Math.max(1, (d.clips || []).filter((c) => c.video).length)
const activeClips = (d) => (d.clips || []).filter((c) => c.video)

function drawScene(ctx, sc, lt, d, A) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, VID_Y)
  ctx.clip()
  ctx.fillStyle = d.band
  ctx.fillRect(0, 0, W, VID_Y)
  const ink = '#101010'

  if (sc.kind === 'synopsis') {
    text(ctx, 'SYNOPSIS', 540, 190, { font: `400 110px ${FONTS.display}`, color: ink, spacing: 4, alpha: easeOut(seg(lt, 0, 0.5)) })
    let size = 56
    let lines
    let fontFor
    do {
      fontFor = (bold) => `${bold ? 700 : 500} ${size}px ${FONTS.body}`
      lines = richLines(ctx, d.synopsis, 880, fontFor)
      size -= 2
    } while (lines.length * (size + 2) * 1.5 > 700 && size > 24)
    const lh = (size + 2) * 1.5
    const top = 300 + (760 - lines.length * lh) / 2 + size
    const sa = easeOut(seg(lt, 0.3, 0.7))
    ctx.save()
    ctx.globalAlpha = sa
    drawRich(ctx, lines, 540, top + (1 - sa) * 30, lh, fontFor, ink, '#000')
    ctx.restore()
  } else {
    const poster = sc.kind === 'slide' ? sc.sl.image : d.poster
    cover(ctx, A.img(poster), 0, 0, W, BAND_Y, { zoom: 1 + 0.06 * (lt / sc.dur), label: sc.kind === 'slide' ? 'ADD IMAGE' : 'ADD POSTER' })
    let label
    let value
    if (sc.kind === 'title') {
      label = d.title
      value = d.reviewWord
    } else if (sc.kind === 'overall') {
      label = d.overallLabel
      value = d.overall
    } else {
      label = sc.sl.label
      value = sc.sl.value
    }
    label = String(label || '').toUpperCase()
    const labelFont = fitSize(ctx, label, (s) => `400 ${s}px ${FONTS.display}`, 960, 112, 44, 2)
    text(ctx, label, 540, 1052, { font: labelFont, color: ink, spacing: 2, alpha: easeOut(seg(lt, 0.1, 0.4)) })
    const pop = easeBack(seg(lt, 0.3, 0.5))
    if (pop > 0) {
      ctx.save()
      ctx.translate(540, 1150)
      ctx.scale(pop, pop)
      if (sc.kind === 'title') text(ctx, String(value || '').toUpperCase(), 0, 0, { font: `500 46px ${FONTS.body}`, color: ink, spacing: 14 })
      else text(ctx, String(value || ''), 0, 0, { font: fitSize(ctx, String(value || ''), (s) => `700 ${s}px ${FONTS.body}`, 900, 82, 36), color: ink })
      ctx.restore()
    }
  }
  ctx.restore()
}

export default {
  key: 'review',
  label: 'Cinephile Review',
  short: 'Review',
  emoji: '\u{1F3AC}',
  kind: 'short',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    title: 'Movie Title',
    reviewWord: 'Review',
    poster: '',
    synopsis: 'Write a short, spoiler-free plot summary here. Wrap names in **double asterisks** to make them bold.',
    slides: [
      { image: '', label: 'Acting', value: '8.0/10' },
      { image: '', label: 'Story, screenplay & comedy', value: '7.0/10' },
    ],
    overall: '7.0/10',
    overallLabel: 'Overall',
    clips: [],
    clipSound: true,
    band: '#E6D4A4',
    titleSec: 3.5,
    synopsisSec: 8,
    slideSec: 4,
    audio: '',
    musicVol: 0.35,
  }),
  fields: [
    { group: 'Content', key: 'title', label: 'Movie title', type: 'text' },
    { group: 'Content', key: 'poster', label: 'Poster', type: 'image' },
    { group: 'Content', key: 'synopsis', label: 'Synopsis (**bold** for names)', type: 'textarea' },
    {
      group: 'Content',
      key: 'slides',
      label: 'Score slides',
      type: 'list',
      itemLabel: 'Slide',
      newItem: { image: '', label: '', value: '' },
      fields: [
        { key: 'image', label: 'Image / still', type: 'image' },
        { key: 'label', label: 'Heading (Acting, Music, Nivin Pauly\u2026)', type: 'text' },
        { key: 'value', label: 'Score or note (8.0/10, CAMEO)', type: 'text' },
      ],
    },
    { group: 'Content', key: 'overall', label: 'Overall score (blank to skip)', type: 'text' },
    {
      group: 'Reaction clips',
      key: 'clips',
      label: 'Clips under the review (they share the video length equally)',
      type: 'list',
      itemLabel: 'Clip',
      newItem: { video: '' },
      fields: [{ key: 'video', label: 'Video file', type: 'video' }],
    },
    { group: 'Reaction clips', key: 'clipSound', label: 'Include clip sound in the exported video', type: 'checkbox' },
    { group: 'Look', key: 'band', label: 'Band colour', type: 'color' },
    { group: 'Look', key: 'reviewWord', label: 'Word under the title', type: 'text' },
    { group: 'Look', key: 'overallLabel', label: 'Overall heading', type: 'text' },
    { group: 'Timing & sound', key: 'titleSec', label: 'Title slide (s)', type: 'number', min: 1, max: 20 },
    { group: 'Timing & sound', key: 'synopsisSec', label: 'Synopsis slide (s)', type: 'number', min: 2, max: 30 },
    { group: 'Timing & sound', key: 'slideSec', label: 'Each score slide (s)', type: 'number', min: 1, max: 20 },
    { group: 'Timing & sound', key: 'audio', label: 'Background music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => scenes(d).reduce((a, s) => a + s.dur, 0),
  thumbTime: () => 1.2,
  fileName: (d) => d.title,

  // Which video frames this moment needs, so the host can seek them before drawing.
  video(d, t) {
    const clips = activeClips(d)
    if (!clips.length) return []
    const total = this.duration(d)
    const share = clipShare(d, total)
    const i = Math.min(clips.length - 1, Math.floor(t / share))
    return [{ id: clips[i].video, time: t - i * share }]
  },

  audio(d, total) {
    if (!d.clipSound) return []
    const clips = activeClips(d)
    const share = clipShare(d, total)
    return clips.map((c, i) => ({ id: c.video, start: i * share, dur: share, loop: true, gain: 1 }))
  },

  draw(ctx, t, d, A) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    const list = scenes(d)
    const i = sceneAt(list, t)
    const cur = list[i]
    const lt = t - cur.start
    if (i > 0 && lt < TR) {
      const e = easeInOut(lt / TR)
      ctx.save()
      ctx.translate(-W * e, 0)
      drawScene(ctx, list[i - 1], list[i - 1].dur, d, A)
      ctx.restore()
      ctx.save()
      ctx.translate(W * (1 - e), 0)
      drawScene(ctx, cur, lt, d, A)
      ctx.restore()
    } else drawScene(ctx, cur, lt, d, A)

    // Reaction clip area.
    ctx.fillStyle = '#0b0b0b'
    ctx.fillRect(0, VID_Y, W, H - VID_Y)
    const need = this.video(d, t)[0]
    const vid = need ? A.video(need.id) : null
    if (vid) cover(ctx, vid, 0, VID_Y, W, H - VID_Y, { label: 'CLIP' })
    else text(ctx, 'ADD REACTION CLIPS', 540, VID_Y + 370, { font: `600 38px ${FONTS.body}`, color: 'rgba(255,255,255,.35)', spacing: 5 })
    text(ctx, BRAND.watermark, 540, H - 56, { font: `500 32px ${FONTS.body}`, color: 'rgba(255,255,255,.7)', spacing: 3, shadow: { color: 'rgba(0,0,0,.8)', blur: 8, y: 2 } })
    ctx.fillStyle = 'rgba(0,0,0,.18)'
    ctx.fillRect(0, VID_Y, W, 4)

    const fade = 1 - clamp(t / 0.3)
    if (fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade})`
      ctx.fillRect(0, 0, W, H)
    }
  },
}
