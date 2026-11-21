import { BRAND } from '../brand.js'
import { pal, lookField } from '../lib/looks.js'
import { LW, LH, drawListShow, listShellFields, listShellDefaults, listThumbTime, listDuration, listTimingFields, itemSecField } from '../lib/wide.js'

// Cinema Rewind, long form: a run of anniversaries. One slide per film, each saying how long ago it
// came out and why it is still worth talking about.

const film = (heading = '', years = '', released = '', body = '') => ({ image: '', heading, years, released, body })

export default {
  key: 'rewindlong',
  label: 'Cinema Rewind (long)',
  short: 'Rewind+',
  emoji: '⏪',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () =>
    listShellDefaults({
      kicker: 'Cinema Rewind',
      title: 'Films Turning Ten This Year',
      sub: 'A decade on, and still being argued about',
      hook: 'Ten years ago these arrived. Some were hits. All of them lasted.',
      hookNote: 'Anniversaries are a good excuse for a rewatch.',
      items: [
        film('Movie Title', '10 Years Of', 'Released 29 June 2015', 'Dismissed on release, reassessed ever since. The third act is still the best in its genre.'),
        film('Another Title', '10 Years Of', 'Released 2 October 2015', 'A debut that set the template for everything that followed it.'),
      ],
      shape: 'wide',
      ctaH: 'Which one holds up best?',
      ctaS: 'Pick one in the comments and tell us why.',
      ctaTag: BRAND.tagline,
      bgStyle: 'Stripes',
      look: 'Indigo',
      countdown: false,
    }),
  fields: [
    {
      group: 'Content',
      key: 'items',
      label: 'Films',
      type: 'list',
      itemLabel: 'Film',
      newItem: film('', '', '', ''),
      fields: [
        { key: 'image', label: 'Poster or still', type: 'image' },
        { key: 'heading', label: 'Film title', type: 'text' },
        { key: 'years', label: 'Anniversary line (e.g. 10 Years Of)', type: 'text' },
        { key: 'released', label: 'Release line (e.g. Released 29 June 2015)', type: 'text' },
        { key: 'body', label: 'Why it still matters (**bold** for names)', type: 'textarea' },
        itemSecField(),
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
      bgDefault: 'Stripes',
      shape: 'wide',
      shapes: ['wide', 'poster', 'square'],
      imageLabel: 'ADD POSTER',
      itemOf: (it) => ({
        heading: it.heading,
        tag: it.years,
        rows: [['Released', it.released]],
        body: it.body,
        bodyMax: 4,
      }),
    })
  },
}
