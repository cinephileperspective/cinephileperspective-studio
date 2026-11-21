import { BRAND } from '../brand.js'
import { pal, lookField } from '../lib/looks.js'
import { LW, LH, drawListShow, listShellFields, listShellDefaults, listThumbTime, listDuration, listTimingFields, itemSecField } from '../lib/wide.js'

// Weekend Watch, long form: the theatre and OTT roundup with room to actually talk about each film.
// Cinema Countdown is the generic ranked list; this one is the weekly what-to-watch, so every slide
// carries cast, director and where it is playing.

const film = (heading = '', cast = '', director = '', where = '', body = '') => ({ image: '', heading, cast, director, where, body })

export default {
  key: 'spotlightlong',
  label: 'Weekend Watch (long)',
  short: 'Weekend+',
  emoji: '\u{1F37F}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () =>
    listShellDefaults({
      kicker: 'Weekend Watch',
      title: 'What To Watch This Weekend',
      sub: 'In theatres and streaming now',
      hook: 'Six films worth your Saturday evening, and where to find each one.',
      hookNote: 'Theatre listings change weekly — check before you travel.',
      items: [
        film('Movie One', 'Actor One, Actor Two', 'Director Name', 'In theatres', 'The one everybody will be talking about on Monday. Go in knowing nothing.'),
        film('Movie Two', 'Actor Three, Actor Four', 'Director Name', 'Streaming', 'Quieter, slower, and the better film of the two. Worth staying up for.'),
      ],
      shape: 'poster',
      ctaH: 'What are you watching?',
      ctaS: 'Tell us what you picked — we read every comment.',
      ctaTag: BRAND.tagline,
      bgStyle: 'Glow',
      look: 'Noir',
      countdown: false,
    }),
  fields: [
    {
      group: 'Content',
      key: 'items',
      label: 'Films',
      type: 'list',
      itemLabel: 'Film',
      newItem: film('', '', '', '', ''),
      fields: [
        { key: 'image', label: 'Poster', type: 'image' },
        { key: 'heading', label: 'Film title', type: 'text' },
        { key: 'cast', label: 'Cast (comma separated)', type: 'text' },
        { key: 'director', label: 'Director', type: 'text' },
        { key: 'where', label: 'Where to watch (In theatres, Streaming…)', type: 'text' },
        { key: 'body', label: 'Why watch it (**bold** for names)', type: 'textarea' },
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
      bgDefault: 'Glow',
      shape: 'poster',
      imageLabel: 'ADD POSTER',
      itemOf: (it) => ({
        heading: it.heading,
        tag: it.where,
        rows: [
          ['Cast', it.cast],
          ['Director', it.director],
        ],
        body: it.body,
        bodyMax: 3,
      }),
    })
  },
}
