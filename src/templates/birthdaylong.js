import { BRAND } from '../brand.js'
import { pal, lookField } from '../lib/looks.js'
import { LW, LH, drawListShow, listShellFields, listShellDefaults, listThumbTime, listDuration, listTimingFields, itemSecField } from '../lib/wide.js'

// Star of the Day, long form: a run of birthdays. One slide per person, with the framing controls
// the vertical template has, because a face sitting badly in the crop is the usual complaint.

const star = (heading = '', role = '', born = '', body = '') => ({ image: '', heading, role, born, body, x: 0.5, y: 0.25, zoom: 1 })

export default {
  key: 'birthdaylong',
  label: 'Star of the Day (long)',
  short: 'Stars+',
  emoji: '\u{1F382}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () =>
    listShellDefaults({
      kicker: 'Star of the Day',
      title: 'Birthdays This Week',
      sub: 'The faces behind the films',
      hook: 'Seven people who shaped the films we keep going back to.',
      hookNote: 'Wishing every one of them a happy birthday.',
      items: [
        star('Star Name', 'Actress', 'Born 1988', 'Three National Award nominations, and the decade’s most quietly reliable lead.'),
        star('Another Name', 'Director', 'Born 1971', 'Began in documentaries; still shoots his own second unit.'),
        star('A Third Name', 'Composer', 'Born 1965', 'Four hundred films, and a theme everyone can hum.'),
      ],
      shape: 'poster',
      ctaH: 'Who did we miss?',
      ctaS: 'Add their name in the comments and we will include them next week.',
      ctaTag: BRAND.tagline,
      bgStyle: 'Rays',
      look: 'Sepia',
      countdown: false,
    }),
  fields: [
    {
      group: 'Content',
      key: 'items',
      label: 'People',
      type: 'list',
      itemLabel: 'Person',
      newItem: star('', '', '', ''),
      fields: [
        { key: 'image', label: 'Photo', type: 'image' },
        { key: 'heading', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role (Actress, Director, Composer…)', type: 'text' },
        { key: 'born', label: 'Born / age line', type: 'text' },
        { key: 'body', label: 'Known for (**bold** for film titles)', type: 'textarea' },
        { key: 'x', label: 'Photo: left ↔ right', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'y', label: 'Photo: top ↕ bottom (faces are usually near the top)', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'zoom', label: 'Photo: zoom', type: 'range', min: 1, max: 2.5, step: 0.01 },
        itemSecField(),
      ],
    },
    ...listShellFields(lookField),
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: listThumbTime,
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    drawListShow(ctx, t, d, A, pal(d), {
      bgDefault: 'Rays',
      shape: 'poster',
      imageLabel: 'ADD PHOTO',
      itemOf: (it) => ({
        heading: it.heading,
        rows: [
          ['Role', it.role],
          ['Born', it.born],
        ],
        body: it.body,
        bodyMax: 4,
        fx: Number.isFinite(+it.x) ? +it.x : 0.5,
        fy: Number.isFinite(+it.y) ? +it.y : 0.25,
        zoom: Math.max(1, +it.zoom || 1),
      }),
    })
  },
}
