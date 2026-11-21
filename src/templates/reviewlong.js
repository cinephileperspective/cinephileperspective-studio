import { BRAND } from '../brand.js'
import { pal, lookField } from '../lib/looks.js'
import {
  LW, LH, LSAFE, wideBackdrop, wideBgField, WIDE_BACKGROUNDS, wideRail, wideWatermark,
  titleCard, hookCard, chapterSlide, verdictCard,
  listPlan, listAt, listCount, listDuration, listTimingFields, listTimingDefaults, itemSecField
} from '../lib/wide.js'

// Cinephile Review, long form: a deep-dive, not a ranked list.
//
// It shares the list show's timeline — title, setup, N sections, closing — because that shape fits
// either way, but it paints chapters instead of ranked slides: each one is an aspect of the film
// with its own score and a paragraph of argument, and the closing card is the overall verdict
// rather than a call to action. The sections mirror the vertical Review's score slides, so a Short
// and a long review of the same film can be written from the same notes.

const SHAPES = ['wide', 'poster', 'tall', 'square']
const chapter = (heading = '', score = '', body = '') => ({ image: '', heading, score, body, x: 0.5, y: 0.25, zoom: 1 })

export default {
  key: 'reviewlong',
  label: 'Cinephile Review (long)',
  short: 'Review+',
  emoji: '\u{1F39E}️',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () => ({
    kicker: 'Cinephile Review',
    title: 'Movie Title',
    sub: 'Directed by Director Name · 2026',
    hook: 'A spoiler-free look at what works, what does not, and whether it is worth your ticket.',
    hookNote: 'No plot points past the first act.',
    items: [
      chapter('Story & screenplay', '7.0/10', 'The setup is confident and the first hour earns its length. Where it strains is the middle, which asks the audience to wait rather than wonder.'),
      chapter('Performances', '8.5/10', '**Lead Actor** holds the film together without ever reaching for it, and the supporting cast is cast against type to real effect.'),
      chapter('Direction', '8.0/10', 'Patient, unshowy work. The camera stays still long enough for scenes to land, which is rarer than it should be.'),
      chapter('Music & sound', '7.5/10', 'The score knows when to stop. Two sequences play almost silent, and they are the best in the film.'),
    ],
    overall: '7.8/10',
    overallLabel: 'Overall',
    verdictH: 'The verdict',
    verdictS: 'Flawed in the middle, confident everywhere else. Worth a ticket.',
    verdictTag: BRAND.tagline,
    side: 'left',
    shape: 'poster',
    fitWhole: false,
    look: 'Noir',
    bgStyle: 'Aurora',
    showRail: true,
    watermark: true,
    ...listTimingDefaults(),
    secItem: 18, // a chapter is an argument, not a caption
    secCta: 7,
  }),
  fields: [
    { group: 'Content', key: 'kicker', label: 'Small heading (title card)', type: 'text' },
    { group: 'Content', key: 'title', label: 'Film title', type: 'text' },
    { group: 'Content', key: 'sub', label: 'Subtitle (director, year)', type: 'text' },
    { group: 'Content', key: 'hook', label: 'Setup card (empty to skip)', type: 'textarea' },
    { group: 'Content', key: 'hookNote', label: 'Setup note (small line under it)', type: 'text' },
    {
      group: 'Content',
      key: 'items',
      label: 'Chapters',
      type: 'list',
      itemLabel: 'Chapter',
      newItem: chapter('', '', ''),
      fields: [
        { key: 'image', label: 'Still or poster for this chapter', type: 'image' },
        { key: 'heading', label: 'Chapter (Story, Performances, Music…)', type: 'text' },
        { key: 'score', label: 'Score or note for this chapter', type: 'text' },
        { key: 'body', label: 'What you think (**bold** for names)', type: 'textarea' },
        { key: 'x', label: 'Picture: left ↔ right', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'y', label: 'Picture: top ↕ bottom (faces are usually near the top)', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'zoom', label: 'Picture: zoom', type: 'range', min: 1, max: 2.5, step: 0.01 },
        itemSecField(),
      ],
    },
    { group: 'Verdict', key: 'overall', label: 'Overall score (blank to skip the ring)', type: 'text' },
    { group: 'Verdict', key: 'overallLabel', label: 'Label under the score', type: 'text' },
    { group: 'Verdict', key: 'verdictH', label: 'Verdict heading', type: 'text' },
    { group: 'Verdict', key: 'verdictS', label: 'Verdict line', type: 'textarea' },
    { group: 'Verdict', key: 'verdictTag', label: 'Closing tagline pill', type: 'text' },
    lookField(),
    wideBgField(),
    { group: 'Look', key: 'shape', label: 'Picture shape', type: 'select', options: SHAPES },
    { group: 'Look', key: 'fitWhole', label: 'Show the whole picture (never crop it)', type: 'checkbox' },
    { group: 'Look', key: 'side', label: 'Still on the', type: 'select', options: ['left', 'right'] },
    { group: 'Look', key: 'showRail', label: 'Show the progress rail', type: 'checkbox' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: (d) => {
    const p = listPlan(d)
    // The first chapter, settled.
    return p.title + p.hook + Math.min(p.durs[0] - 0.2, 1.4)
  },
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const n = listCount(d)
    const at = listAt(d, t)
    wideBackdrop(ctx, P, WIDE_BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : 'Aurora', t)

    if (at.scene === 'title') {
      titleCard(ctx, P, at.lt, { kicker: d.kicker, title: d.title, sub: d.sub })
    } else if (at.scene === 'hook') {
      hookCard(ctx, P, at.lt, { hook: d.hook, note: d.hookNote })
    } else if (at.scene === 'item') {
      const it = (d.items && d.items[at.i]) || {}
      chapterSlide(ctx, P, at.lt, at.dur, it, A, {
        shape: SHAPES.includes(d.shape) ? d.shape : 'poster',
        side: d.side === 'right' ? 'right' : 'left',
        chip: `Chapter ${at.i + 1} of ${n}`,
        heading: it.heading,
        note: it.score,
        body: it.body,
        label: 'ADD PICTURE',
        // Contain shows a tall poster whole; cover fills the box and crops, framed by x / y / zoom.
        fit: d.fitWhole ? 'contain' : 'cover',
        fx: Number.isFinite(+it.x) ? +it.x : 0.5,
        fy: Number.isFinite(+it.y) ? +it.y : 0.25,
        zoom: Math.max(1, +it.zoom || 1),
      })
      if (d.showRail) wideRail(ctx, P, at.i + 1, n)
    } else {
      verdictCard(ctx, P, at.lt, { head: d.verdictH, score: d.overall, label: d.overallLabel, sub: d.verdictS, tag: d.verdictTag })
    }

    const tucked = at.scene === 'item' && d.showRail
    if (d.watermark) wideWatermark(ctx, P, { align: tucked ? 'right' : 'center', x: tucked ? LSAFE.x + LSAFE.w : LW / 2, y: tucked ? LH - 92 : LH - 54 })
  },
}
