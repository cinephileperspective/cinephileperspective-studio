import { BRAND } from '../brand.js'
import { pal, lookField } from '../lib/looks.js'
import { LW, LH, drawListShow, listShellFields, listShellDefaults, listThumbTime, listDuration, listTimingFields, itemSecField } from '../lib/wide.js'

// Remembrance, long form: several people remembered in one video. Like the vertical template, the
// photographs default to black and white — and for the same reason, it is a baked grayscale copy
// (provider.gray) rather than a canvas filter, which Safari does not have.

const person = (heading = '', role = '', dates = '', body = '') => ({ image: '', heading, role, dates, body, x: 0.5, y: 0.25, zoom: 1 })

export default {
  key: 'tributelong',
  label: 'Remembrance (long)',
  short: 'Memory+',
  emoji: '\u{1F56F}️',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () =>
    listShellDefaults({
      kicker: 'Remembrance',
      title: 'Those We Lost This Year',
      sub: 'Remembering the people behind the films',
      hook: 'The industry said goodbye to some of its finest this year.',
      hookNote: 'Each of them left the screen different from how they found it.',
      items: [
        person('Name', 'Actor', '1950 – 2020', 'Fifty years on screen, and never once the same character twice.'),
        person('Another Name', 'Director', '1938 – 2021', 'Made nine films, every one of them about home.'),
      ],
      shape: 'poster',
      blackAndWhite: true,
      ctaH: 'Gone, but not forgotten',
      ctaS: 'Share a favourite performance of theirs in the comments.',
      ctaTag: BRAND.tagline,
      bgStyle: 'Aurora',
      look: 'Noir',
      countdown: false,
      showRail: false,
    }),
  fields: [
    {
      group: 'Content',
      key: 'items',
      label: 'People remembered',
      type: 'list',
      itemLabel: 'Person',
      newItem: person('', '', '', ''),
      fields: [
        { key: 'image', label: 'Photo', type: 'image' },
        { key: 'heading', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role (Actor, Director, Singer…)', type: 'text' },
        { key: 'dates', label: 'Years or dates (1950 – 2020)', type: 'text' },
        { key: 'body', label: 'A line about them (**bold** for film titles)', type: 'textarea' },
        { key: 'x', label: 'Photo: left ↔ right', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'y', label: 'Photo: top ↕ bottom', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'zoom', label: 'Photo: zoom', type: 'range', min: 1, max: 2.5, step: 0.01 },
        itemSecField(),
      ],
    },
    { group: 'Look', key: 'blackAndWhite', label: 'Black and white photographs', type: 'checkbox' },
    ...listShellFields(lookField),
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: listThumbTime,
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    drawListShow(ctx, t, d, A, pal(d), {
      bgDefault: 'Aurora',
      shape: 'poster',
      imageLabel: 'ADD PHOTO',
      itemOf: (it) => ({
        heading: it.heading,
        // The grayscale copy is baked once and cached by the asset store.
        img: d.blackAndWhite && A.gray ? A.gray(it.image) : A.img(it.image),
        rows: [
          ['Role', it.role],
          ['Years', it.dates],
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
