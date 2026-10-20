import { BRAND } from '../brand.js'
import { LOOKS, pal, lookField } from '../lib/looks.js'
import {
  LW, LH, LSAFE, wideBackdrop, wideBgField, WIDE_BACKGROUNDS, wideRail, wideWatermark,
  titleCard, hookCard, itemSlide, ctaCard,
  listPlan, listAt, listCount, listDuration, rankOf, listTimingFields, listTimingDefaults,
} from '../lib/wide.js'

// Cinema Countdown: the long-form (16:9) list show. Title card, hook, one slide per film, closing
// card. Used for "Top 10 of the year", "Best of a director", theatre and OTT roundups — anything
// that is a ranked or unranked list of films.
//
// The shape of the show (scenes, timing, rail, rank chips) lives in lib/wide.js and is shared with
// the other studios; this file only supplies the cinema look and the per-film fields.

const film = (title = '', year = '', rating = '', body = '') => ({ image: '', heading: title, year, rating, body })

export default {
  key: 'countdown',
  label: 'Cinema Countdown',
  short: 'Countdown',
  emoji: '\u{1F3C6}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () => ({
    kicker: 'Cinephile Perspective',
    title: 'Top 10 Films of the Year',
    sub: 'Our picks, counted down',
    hook: 'Ten films that stayed with us long after the credits.',
    hookNote: 'Stay to the end — number one surprised us.',
    items: [
      film('Film One', '2024', '8.5 / 10', 'A quiet, confident debut that trusts its audience. **Lead Actor** carries every frame.'),
      film('Film Two', '2024', '9 / 10', 'The year’s most ambitious picture, and the only one that earned its length.'),
      film('Film Three', '2023', '8 / 10', 'Proof that a small story told well beats a big one told loudly.'),
    ],
    countdown: true,
    shape: 'poster',
    ctaH: 'What would you add?',
    ctaS: 'Tell us in the comments — we read every one.',
    ctaTag: BRAND.tagline,
    look: 'Noir',
    bgStyle: 'Glow',
    showRail: true,
    watermark: true,
    ...listTimingDefaults(),
  }),
  fields: [
    { group: 'Content', key: 'kicker', label: 'Small heading (title card)', type: 'text' },
    { group: 'Content', key: 'title', label: 'Video title', type: 'text' },
    { group: 'Content', key: 'sub', label: 'Subtitle', type: 'text' },
    { group: 'Content', key: 'hook', label: 'Hook line (empty = skip the hook card)', type: 'textarea' },
    { group: 'Content', key: 'hookNote', label: 'Hook note (small line under it)', type: 'text' },
    {
      group: 'Content',
      key: 'items',
      label: 'Films',
      type: 'list',
      itemLabel: 'Film',
      newItem: { image: '', heading: '', year: '', rating: '', body: '' },
      fields: [
        { key: 'image', label: 'Poster / still', type: 'image' },
        { key: 'heading', label: 'Film title', type: 'text' },
        { key: 'year', label: 'Year / director', type: 'text' },
        { key: 'rating', label: 'Rating or where to watch', type: 'text' },
        { key: 'body', label: 'Why watch it (**bold** for names)', type: 'textarea' },
      ],
    },
    { group: 'Content', key: 'ctaH', label: 'Closing heading', type: 'text' },
    { group: 'Content', key: 'ctaS', label: 'Closing line', type: 'text' },
    { group: 'Content', key: 'ctaTag', label: 'Closing tagline pill', type: 'text' },
    lookField(),
    wideBgField(),
    { group: 'Look', key: 'shape', label: 'Picture shape', type: 'select', options: ['poster', 'wide', 'square'] },
    { group: 'Look', key: 'countdown', label: 'Count down (10 → 1) instead of up', type: 'checkbox' },
    { group: 'Look', key: 'showRail', label: 'Show the progress rail', type: 'checkbox' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: (d) => {
    const p = listPlan(d)
    // The first film, settled: the most useful frame for a cover.
    return p.title + p.hook + Math.min(p.item - 0.2, 1.2)
  },
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const n = listCount(d)
    const at = listAt(d, t)
    wideBackdrop(ctx, P, WIDE_BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : 'Glow', t)

    if (at.scene === 'title') {
      titleCard(ctx, P, at.lt, { kicker: d.kicker, title: d.title, sub: d.sub })
    } else if (at.scene === 'hook') {
      hookCard(ctx, P, at.lt, { hook: d.hook, note: d.hookNote })
    } else if (at.scene === 'item') {
      const it = (d.items && d.items[at.i]) || {}
      itemSlide(ctx, P, at.lt, at.dur, it, A, {
        shape: ['poster', 'wide', 'square'].includes(d.shape) ? d.shape : 'poster',
        rank: rankOf(d, at.i, n),
        label: 'ADD POSTER',
        heading: it.heading,
        rows: [
          ['Year / director', it.year],
          ['Rating / where to watch', it.rating],
        ],
        body: it.body,
      })
      if (d.showRail) wideRail(ctx, P, at.i + 1, n)
    } else {
      ctaCard(ctx, P, at.lt, { head: d.ctaH, sub: d.ctaS, tag: d.ctaTag })
    }

    // The watermark sits opposite the rail so the two never collide.
    if (d.watermark) wideWatermark(ctx, P, { align: at.scene === 'item' && d.showRail ? 'right' : 'center', x: at.scene === 'item' && d.showRail ? LSAFE.x + LSAFE.w : LW / 2, y: at.scene === 'item' && d.showRail ? LH - 92 : LH - 54 })
  },
}
