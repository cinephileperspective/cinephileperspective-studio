import { BRAND } from '../brand.js'
import { pal, lookField } from '../lib/looks.js'
import { LW, LH, drawListShow, listShellFields, listShellDefaults, listThumbTime, listDuration, listTimingFields } from '../lib/wide.js'

// Cinema Update, long form: a news bulletin. One slide per story, each tagged Official, Reported or
// Rumour exactly as the vertical Cinema Update tags a single story.

// The tag colours match the short template's convention: green is confirmed, amber is reported,
// red is unverified.
const STATUS = { Official: '#3FD9A4', Reported: '#E0A458', Rumour: '#E0314B' }
const STATUSES = Object.keys(STATUS)

const story = (heading = '', status = 'Official', source = '', body = '') => ({ image: '', heading, status, source, body })

export default {
  key: 'buzzlong',
  label: 'Cinema Update (long)',
  short: 'Update+',
  emoji: '\u{1F4F0}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () =>
    listShellDefaults({
      kicker: 'Cinema Buzz',
      title: 'This Week in Cinema',
      sub: 'Everything worth knowing, in one go',
      hook: 'Five stories that moved the industry this week.',
      hookNote: 'Confirmed, reported and rumoured — each one is labelled.',
      items: [
        story('First look drops for the new project', 'Official', 'Production house', 'The studio put out the first poster this morning, confirming a festival release.'),
        story('A long-rumoured casting is finally settled', 'Reported', 'Trade press', 'Trade reporters say the deal is signed, though neither side has confirmed it yet.'),
        story('Sequel talk gathers pace', 'Rumour', 'Unverified', 'Nothing official, but two separate accounts point the same way. Treat it carefully.'),
      ],
      shape: 'wide',
      ctaH: 'Which story matters most?',
      ctaS: 'Tell us in the comments — we follow up on the big ones.',
      ctaTag: BRAND.tagline,
      bgStyle: 'Grid',
      look: 'Crimson',
      countdown: false,
    }),
  fields: [
    {
      group: 'Content',
      key: 'items',
      label: 'Stories',
      type: 'list',
      itemLabel: 'Story',
      newItem: story('', 'Official', '', ''),
      fields: [
        { key: 'image', label: 'Poster / still / first look', type: 'image' },
        { key: 'heading', label: 'Headline', type: 'text' },
        { key: 'status', label: 'Status tag', type: 'select', options: STATUSES },
        { key: 'source', label: 'Source line', type: 'text' },
        { key: 'body', label: 'What happened (**bold** for names)', type: 'textarea' },
      ],
    },
    ...listShellFields(lookField, { shapes: ['wide', 'poster', 'square'] }),
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: listThumbTime,
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    drawListShow(ctx, t, d, A, pal(d), {
      bgDefault: 'Grid',
      shape: 'wide',
      shapes: ['wide', 'poster', 'square'],
      imageLabel: 'ADD IMAGE',
      itemOf: (it) => ({
        heading: it.heading,
        tag: it.status,
        tagColor: STATUS[it.status] || null,
        rows: [['Source', it.source]],
        body: it.body,
        bodyMax: 4,
      }),
    })
  },
}
