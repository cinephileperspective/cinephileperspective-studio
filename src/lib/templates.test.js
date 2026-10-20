import { describe, it, expect } from 'vitest'
import { TEMPLATES, getTemplate, normalizeData, collectIds, audioPlan, unusedKeys, loadWarning } from '../templates/index.js'
import { shortsStatus, sizeStatus, fileSlug } from './files.js'
import { mix, seg, easeBack, richLines, cover } from './draw.js'
import { listPlan, listAt, rankOf, listCount, LW, LH, LSAFE, SHAPES, WIDE_BACKGROUNDS } from './wide.js'
import { LOOKS } from './looks.js'
import { OCCASIONS, CUSTOM, BACKDROPS } from '../templates/festival.js'

// A canvas context that accepts every call, so draw() can run in Node and any typo or bad
// reference still throws.
function fakeCtx() {
  const grad = { addColorStop() {} }
  return new Proxy(
    {},
    {
      get(target, k) {
        if (k === 'measureText') return (s) => ({ width: String(s).length * 12 })
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad
        if (k in target) return target[k]
        return () => {}
      },
      set(target, k, v) {
        target[k] = v
        return true
      },
    },
  )
}
const fakeImg = { width: 800, height: 600 }
const A = { img: () => fakeImg, gray: () => fakeImg, video: () => ({ videoWidth: 640, videoHeight: 360 }), dur: () => 5 }

describe.each(TEMPLATES.map((t) => [t.key, t]))('template %s', (key, tpl) => {
  const d = tpl.defaults()

  it('has a positive duration and a thumbnail time inside it', () => {
    const total = tpl.duration(d)
    expect(total).toBeGreaterThan(2)
    expect(tpl.thumbTime(d)).toBeGreaterThanOrEqual(0)
    expect(tpl.thumbTime(d)).toBeLessThan(total)
  })

  it('draws every moment with and without media, without throwing', () => {
    const filled = JSON.parse(JSON.stringify(d))
    for (const f of tpl.fields) {
      if (['image', 'video', 'audio'].includes(f.type)) filled[f.key] = 'x1'
      if (f.type === 'images') filled[f.key] = ['x1', 'x2', 'x3']
      if (f.type === 'list') filled[f.key] = Array.from({ length: 3 }, () => Object.fromEntries(f.fields.map((g) => [g.key, g.type === 'text' ? 'Sample text' : 'x1'])))
    }
    for (const data of [d, filled]) {
      const total = tpl.duration(data)
      for (let i = 0; i <= 60; i++) {
        const t = Math.min((total * i) / 60, total - 0.001)
        expect(() => tpl.draw(fakeCtx(), t, data, i % 2 ? A : { img: () => null, video: () => null })).not.toThrow()
      }
    }
  })

  it('every field has a group, key and known type', () => {
    const types = ['text', 'textarea', 'number', 'range', 'color', 'checkbox', 'select', 'image', 'images', 'video', 'audio', 'list']
    for (const f of tpl.fields) {
      expect(f.group).toBeTruthy()
      expect(types).toContain(f.type)
      expect(key in { [key]: 1 } && f.key in d).toBe(true)
    }
  })

  it('normalizeData fills missing fields and ignores wrongly typed ones', () => {
    const out = normalizeData(tpl, { [Object.keys(d)[0]]: { bad: true } })
    expect(Object.keys(out).sort()).toEqual(Object.keys(d).sort())
  })
})

describe('templates that change length with content', () => {
  it('review grows with slides, rewind with stills, spotlight with films', () => {
    const r = getTemplate('review')
    const rd = r.defaults()
    const before = r.duration(rd)
    rd.slides.push({ image: '', label: 'Music', value: '9/10' })
    expect(r.duration(rd)).toBeCloseTo(before + rd.slideSec)

    const w = getTemplate('rewind')
    const wd = w.defaults()
    const a = w.duration(wd)
    wd.stills = Array.from({ length: 10 }, (_, i) => 's' + i)
    expect(w.duration(wd)).toBeGreaterThan(a)

    const s = getTemplate('spotlight')
    const sd = s.defaults()
    const b = s.duration(sd)
    sd.movies.push({ poster: '', title: 'C' })
    expect(s.duration(sd)).toBeCloseTo(b + sd.hold)
  })

  it('review video() picks the clip for the moment', () => {
    const r = getTemplate('review')
    const d = r.defaults()
    d.clips = [{ video: 'v1' }, { video: 'v2' }]
    const total = r.duration(d)
    expect(r.video(d, 1)[0].id).toBe('v1')
    expect(r.video(d, total - 1)[0].id).toBe('v2')
    expect(r.video({ ...d, clips: [] }, 1)).toEqual([])
  })
})

describe('assets and audio', () => {
  it('collectIds walks images, lists and media fields', () => {
    const r = getTemplate('review')
    const d = r.defaults()
    d.poster = 'p1'
    d.slides[0].image = 'p2'
    d.clips = [{ video: 'v1' }]
    d.audio = 'm1'
    expect(collectIds(r, d).sort()).toEqual(['m1', 'p1', 'p2', 'v1'])
    const w = getTemplate('rewind')
    const wd = w.defaults()
    wd.stills = ['s1', 's2']
    expect(collectIds(w, wd).sort()).toEqual(['s1', 's2'])
  })

  it('audioPlan combines music and clip sound', () => {
    const r = getTemplate('review')
    const d = r.defaults()
    d.audio = 'm1'
    d.clips = [{ video: 'v1' }, { video: 'v2' }]
    const plan = audioPlan(r, d, 20)
    expect(plan.map((p) => p.id)).toEqual(['m1', 'v1', 'v2'])
    expect(plan[2].start).toBe(10)
    d.clipSound = false
    expect(audioPlan(r, d, 20)).toHaveLength(1)
  })
})

describe('helpers', () => {
  it('mix, seg and easeBack behave', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(seg(5, 2, 2)).toBe(1)
    expect(seg(1, 2, 2)).toBe(0)
    expect(easeBack(0)).toBeCloseTo(0)
    expect(easeBack(1)).toBeCloseTo(1)
  })
  it('richLines keeps punctuation glued to bold names', () => {
    const ctx = fakeCtx()
    const lines = richLines(ctx, 'Hi **Venu**, bye', 10000, () => '10px x')
    const w = lines[0].words
    expect(w.map((x) => x.w)).toEqual(['Hi', 'Venu', ',', 'bye'])
    expect(w[2].glue).toBe(true)
    expect(w[1].bold).toBe(true)
  })
  it('shortsStatus and fileSlug', () => {
    expect(shortsStatus(45).level).toBe('ok')
    expect(shortsStatus(120).level).toBe('warn')
    expect(shortsStatus(200).level).toBe('bad')
    expect(fileSlug('Varshangalkku Shesham!')).toBe('varshangalkku-shesham')
    expect(fileSlug('')).toBe('video')
  })
})

describe('rewind icon', () => {
  it('is editable, optional and tracked as an asset', () => {
    const w = getTemplate('rewind')
    const d = w.defaults()
    expect(d.icon).toBe('\u00AB')
    d.icon = '\u{1F3AC}'
    d.iconImage = 'i1'
    expect(collectIds(w, d)).toContain('i1')
    for (const v of [{ icon: '' , iconImage: '' }, { icon: '\u2605', iconImage: '' }, { icon: '', iconImage: 'i1' }]) {
      expect(() => w.draw(fakeCtx(), w.duration(d) - 1, { ...d, ...v }, A)).not.toThrow()
    }
  })
})

describe('birthday photo position', () => {
  it('has position and zoom controls that default to a face-friendly framing', () => {
    const b = getTemplate('birthday')
    const d = b.defaults()
    expect(d.photoY).toBeLessThan(0.5)
    const keys = b.fields.filter((f) => f.group === 'Photo position').map((f) => f.key)
    expect(keys).toEqual(expect.arrayContaining(['photoX', 'photoY', 'photoZoom', 'photo2X', 'photo2Y']))
    for (const v of [{ photoX: 0, photoY: 0, photoZoom: 2.5 }, { photoX: 1, photoY: 1, photoZoom: 1 }]) {
      expect(() => b.draw(fakeCtx(), 6, { ...d, photo: 'x1', photo2: 'x2', ...v }, A)).not.toThrow()
    }
  })
  it('old saved data without the new fields gets the defaults', () => {
    const b = getTemplate('birthday')
    const out = normalizeData(b, { name: 'Old Save', photo: 'a1' })
    expect(out.photoY).toBe(0.25)
    expect(out.name).toBe('Old Save')
  })
})

describe('tribute and update templates', () => {
  it('wrap headlines, handle empty text and every status', () => {
    const b = getTemplate('buzz')
    const d = b.defaults()
    for (const status of ['Official', 'Reported', 'Rumour', 'Other']) {
      expect(() => b.draw(fakeCtx(), 5, { ...d, status, headline: 'A very long headline that keeps going and going so it has to shrink and wrap over several lines', source: '' }, A)).not.toThrow()
    }
    expect(() => b.draw(fakeCtx(), 5, { ...d, headline: '', summary: '', ticker: false, watermark: false }, A)).not.toThrow()
    expect(getTemplate('buzz').fields.find((f) => f.key === 'status').options).toEqual(['Official', 'Reported', 'Rumour'])
    const tr = getTemplate('tribute')
    const td = tr.defaults()
    expect(td.blackAndWhite).toBe(true)
    expect(() => tr.draw(fakeCtx(), 6, { ...td, photo: 'x', message: 'Forever in our hearts. Gone but never forgotten by those who loved his work.', candle: false }, A)).not.toThrow()
  })
})

describe('long video (16:9 list show)', () => {
  const cd = getTemplate('countdown')

  it('is horizontal and registered as a long template', () => {
    expect(cd.kind).toBe('long')
    expect(cd.size).toEqual([LW, LH])
    expect(LW).toBeGreaterThan(LH)
    expect(TEMPLATES.filter((t) => t.kind === 'long').map((t) => t.key)).toContain('countdown')
  })

  it('lays the scenes out in order and grows with the item list', () => {
    const d = cd.defaults()
    const p = listPlan(d)
    expect(p.n).toBe(3)
    expect(p.total).toBeCloseTo(p.title + p.hook + 3 * p.item + p.cta)
    expect(cd.duration(d)).toBeCloseTo(p.total)
    d.items = [...d.items, { image: '', heading: 'Four', year: '', rating: '', body: '' }]
    expect(cd.duration(d)).toBeCloseTo(p.total + p.item)
  })

  it('reports the right scene for any moment', () => {
    const d = cd.defaults()
    const p = listPlan(d)
    expect(listAt(d, 0).scene).toBe('title')
    expect(listAt(d, p.title + 0.1).scene).toBe('hook')
    const firstItem = p.title + p.hook
    expect(listAt(d, firstItem + 0.1)).toMatchObject({ scene: 'item', i: 0 })
    expect(listAt(d, firstItem + p.item + 0.1)).toMatchObject({ scene: 'item', i: 1 })
    expect(listAt(d, p.total - 0.1).scene).toBe('cta')
    // The last item never spills past its own slot.
    expect(listAt(d, firstItem + p.n * p.item - 0.001).i).toBe(p.n - 1)
  })

  it('skips the hook card when there is no hook text', () => {
    const d = { ...cd.defaults(), hook: '   ' }
    expect(listPlan(d).hook).toBe(0)
    expect(listAt(d, listPlan(d).title + 0.1).scene).toBe('item')
  })

  it('counts down when asked and up otherwise', () => {
    const n = 10
    expect(rankOf({ countdown: true }, 0, n)).toBe(10)
    expect(rankOf({ countdown: true }, 9, n)).toBe(1)
    expect(rankOf({ countdown: false }, 0, n)).toBe(1)
    expect(rankOf({ countdown: false }, 9, n)).toBe(10)
  })

  it('survives an empty item list', () => {
    const d = { ...cd.defaults(), items: [] }
    expect(listCount(d)).toBe(1)
    expect(cd.duration(d)).toBeGreaterThan(2)
    expect(() => cd.draw(fakeCtx(), cd.duration(d) / 2, d, A)).not.toThrow()
  })

  it('tells long videos apart from Shorts when advising on length', () => {
    expect(sizeStatus(cd, 600).level).toBe('ok')
    expect(sizeStatus(cd, 600).text).toContain('10:00')
    expect(sizeStatus(getTemplate('buzz'), 600).level).toBe('bad')
    expect(sizeStatus(cd, 30).level).toBe('warn')
  })
})

describe('festival wishes', () => {
  const fest = getTemplate('festival')

  it('offers a custom palette alongside the named occasions', () => {
    const options = fest.fields.find((f) => f.key === 'occasion').options
    expect(options).toEqual([...Object.keys(OCCASIONS), CUSTOM])
    expect(options.length).toBeGreaterThan(10)
    for (const P of Object.values(OCCASIONS)) {
      for (const k of ['bg', 'panel', 'accent', 'ink', 'mute', 'on', 'star']) expect(P[k]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('draws every occasion and background without throwing', () => {
    const d = fest.defaults()
    for (const occasion of [...Object.keys(OCCASIONS), CUSTOM]) {
      expect(() => fest.draw(fakeCtx(), 3, { ...d, occasion }, A)).not.toThrow()
    }
    for (const bgStyle of BACKDROPS) {
      expect(() => fest.draw(fakeCtx(), 3, { ...d, bgStyle }, A)).not.toThrow()
    }
    // A bad palette name and a bad custom colour both fall back instead of breaking.
    expect(() => fest.draw(fakeCtx(), 3, { ...d, occasion: 'Nope' }, A)).not.toThrow()
    expect(() => fest.draw(fakeCtx(), 3, { ...d, occasion: CUSTOM, customBg: 'red', customAccent: '' }, A)).not.toThrow()
  })

  it('tracks the emblem image as an asset', () => {
    const d = fest.defaults()
    d.emblem = 'e1'
    d.audio = 'm1'
    expect(collectIds(fest, d).sort()).toEqual(['e1', 'm1'])
  })
})


describe('every Shorts template except Festival Wishes has a long counterpart', () => {
  // The pairing the studio promises: one long template per short, Festival Wishes excepted.
  // Cinema Countdown is the extra generic list and deliberately has no short sibling.
  const PAIRS = [
    ['buzz', 'buzzlong'],
    ['birthday', 'birthdaylong'],
    ['tribute', 'tributelong'],
    ['rewind', 'rewindlong'],
    ['review', 'reviewlong'],
    ['spotlight', 'spotlightlong'],
  ]

  it('pairs them up, and leaves the greeting out', () => {
    for (const [short, long] of PAIRS) {
      expect(getTemplate(short).kind, short).toBe('short')
      expect(getTemplate(long).kind, long).toBe('long')
      expect(getTemplate(long).size, long).toEqual([LW, LH])
    }
    expect(TEMPLATES.some((t) => t.key === 'festivallong')).toBe(false)
    // Nothing is missing: every short bar the greeting is covered.
    const shorts = TEMPLATES.filter((t) => t.kind === 'short').map((t) => t.key)
    expect(shorts.filter((k) => k !== 'festival').sort()).toEqual(PAIRS.map(([s]) => s).sort())
    // And nothing is spare: the only long template without a short is Cinema Countdown.
    const longs = TEMPLATES.filter((t) => t.kind === 'long').map((t) => t.key)
    expect(longs.filter((k) => !PAIRS.some(([, l]) => l === k))).toEqual(['countdown'])
  })

  it('gives every long template a distinct key, label and tab name', () => {
    const longs = TEMPLATES.filter((t) => t.kind === 'long')
    expect(new Set(longs.map((t) => t.key)).size).toBe(longs.length)
    expect(new Set(longs.map((t) => t.label)).size).toBe(longs.length)
    expect(new Set(longs.map((t) => t.short)).size).toBe(longs.length)
    for (const t of longs) expect(t.label, t.key).toMatch(/long|Countdown/)
  })

  it('draws every colour template and background without throwing', () => {
    for (const t of TEMPLATES.filter((x) => x.kind === 'long')) {
      const d = t.defaults()
      const mid = t.duration(d) / 2
      for (const look of Object.keys(LOOKS)) expect(() => t.draw(fakeCtx(), mid, { ...d, look }, A), `${t.key}/${look}`).not.toThrow()
      for (const bgStyle of WIDE_BACKGROUNDS) expect(() => t.draw(fakeCtx(), mid, { ...d, bgStyle }, A), `${t.key}/${bgStyle}`).not.toThrow()
      // A look or background that is not on the list falls back rather than breaking.
      expect(() => t.draw(fakeCtx(), mid, { ...d, look: 'nope', bgStyle: 'nope', shape: 'nope' }, A)).not.toThrow()
    }
  })

  it('grows with its list and survives an empty one', () => {
    for (const t of TEMPLATES.filter((x) => x.kind === 'long')) {
      const d = t.defaults()
      const before = t.duration(d)
      const grown = { ...d, items: [...d.items, { image: '', heading: 'Extra', body: '' }] }
      expect(t.duration(grown), t.key).toBeCloseTo(before + listPlan(d).item)
      const empty = { ...d, items: [] }
      expect(listCount(empty)).toBe(1)
      for (let i = 0; i <= 20; i++) {
        expect(() => t.draw(fakeCtx(), (t.duration(empty) * i) / 20.5, empty, A), t.key).not.toThrow()
      }
    }
  })

  it('tracks every picture in the list as an asset', () => {
    for (const t of TEMPLATES.filter((x) => x.kind === 'long')) {
      const d = t.defaults()
      d.items[0].image = 'p1'
      d.items[1].image = 'p2'
      d.audio = 'm1'
      expect(collectIds(t, d).sort(), t.key).toEqual(['m1', 'p1', 'p2'])
    }
  })

  it('keeps the news tags the vertical Cinema Update uses', () => {
    const b = getTemplate('buzzlong')
    const statuses = b.fields.find((f) => f.key === 'items').fields.find((f) => f.key === 'status').options
    expect(statuses).toEqual(getTemplate('buzz').fields.find((f) => f.key === 'status').options)
    const d = b.defaults()
    for (const status of [...statuses, 'Something else', '']) {
      expect(() => b.draw(fakeCtx(), b.duration(d) / 2, { ...d, items: [{ ...d.items[0], status }] }, A)).not.toThrow()
    }
  })

  it('remembers Remembrance is black and white, and copes without a grayscale provider', () => {
    const t = getTemplate('tributelong')
    const d = t.defaults()
    expect(d.blackAndWhite).toBe(true)
    const mid = t.duration(d) / 2
    expect(() => t.draw(fakeCtx(), mid, d, { img: () => null, video: () => null })).not.toThrow()
    expect(() => t.draw(fakeCtx(), mid, { ...d, blackAndWhite: false }, A)).not.toThrow()
  })

  it('makes the two deep-dives chaptered rather than ranked', () => {
    const r = getTemplate('reviewlong')
    // A chapter needs more time on screen than a list slide, and ends on a verdict, not a CTA.
    expect(r.defaults().secItem).toBeGreaterThan(getTemplate('spotlightlong').defaults().secItem)
    expect(r.fields.some((f) => f.group === 'Verdict')).toBe(true)
    expect(r.defaults().overall).toBeTruthy()
    const d = r.defaults()
    // The verdict ring is optional.
    expect(() => r.draw(fakeCtx(), r.duration(d) - 0.5, { ...d, overall: '' }, A)).not.toThrow()
    expect(() => r.draw(fakeCtx(), r.duration(d) - 0.5, { ...d, side: 'right' }, A)).not.toThrow()
  })
})

describe('loading a project file', () => {
  it('reports fields the chosen template cannot use', () => {
    // Writing the short Review's fields under template "reviewlong" used to load silently and show
    // the built-in placeholder chapters, which looked exactly like the file being ignored.
    const tpl = getTemplate('reviewlong')
    const warn = loadWarning(tpl, { title: 'Jailer 2', synopsis: '...', slides: [], reviewWord: 'Review' })
    expect(warn).toContain('synopsis')
    expect(warn).toContain('slides')
    expect(warn).toContain('reviewWord')
    expect(warn).toContain(tpl.label)
    // A file that fits says nothing at all.
    expect(loadWarning(tpl, { title: 'Jailer 2', items: [{ heading: 'Story', score: '6/10', body: 'x' }] })).toBe('')
  })

  it('reports values of the wrong type instead of quietly dropping them', () => {
    const tpl = getTemplate('countdown')
    const { unknown, wrongType } = unusedKeys(tpl, { secItem: '12', showRail: 'yes', title: 'Fine', nope: 1 })
    expect(wrongType.sort()).toEqual(['secItem', 'showRail'])
    expect(unknown).toEqual(['nope'])
  })

  it('refuses an array field handed something that is not an array', () => {
    // typeof [] is 'object', so this once passed the type check and then made duration() NaN.
    const tpl = getTemplate('reviewlong')
    const d = normalizeData(tpl, { items: {} })
    expect(Array.isArray(d.items)).toBe(true)
    expect(Number.isFinite(tpl.duration(d))).toBe(true)
    expect(loadWarning(tpl, { items: {} })).toContain('items')
  })

  it('accepts a hand-written file with content only, for every template', () => {
    for (const tpl of TEMPLATES) {
      const src = tpl.defaults()
      // Content only: no timing, no colours, no media ids.
      const content = {}
      for (const f of tpl.fields) {
        if (f.group === 'Timing & sound' || f.group === 'Photo position' || f.group === 'Look') continue
        if (['image', 'images', 'video', 'audio', 'range', 'color'].includes(f.type)) continue
        content[f.key] = src[f.key]
      }
      expect(loadWarning(tpl, content), tpl.key).toBe('')
      const d = normalizeData(tpl, content)
      expect(Number.isFinite(tpl.duration(d)), tpl.key).toBe(true)
      expect(() => tpl.draw(fakeCtx(), tpl.duration(d) / 2, d, A), tpl.key).not.toThrow()
    }
  })
})

describe('fitting a picture into a chapter or slide', () => {
  // A context that records what drawImage was asked to paint, so the geometry can be checked.
  function recordingCtx() {
    const calls = []
    const base = fakeCtx()
    return [
      new Proxy(base, { get: (t, k) => (k === 'drawImage' ? (src, x, y, w, h) => calls.push({ x, y, w, h }) : Reflect.get(t, k)) }),
      calls,
    ]
  }
  const img = (w, h) => ({ width: w, height: h })

  it('gives every shape a box inside the title-safe area', () => {
    for (const [name, [w, h]] of Object.entries(SHAPES)) {
      const y = Math.round((LH - h) / 2)
      expect(w, name).toBeLessThanOrEqual(LSAFE.w)
      expect(y, name).toBeGreaterThanOrEqual(LSAFE.y)
      expect(y + h, name).toBeLessThanOrEqual(LSAFE.y + LSAFE.h)
    }
  })

  it('has a tall box shaped for vertical posters', () => {
    const [w, h] = SHAPES.tall
    expect(h).toBeGreaterThan(w)
    // Within a pixel of 9:16, so a 1080x1920 poster needs essentially no cropping.
    expect(Math.abs(w / h - 9 / 16)).toBeLessThan(0.005)
  })

  it('cover fills the box and crops the overflow', () => {
    const [ctx, calls] = recordingCtx()
    cover(ctx, img(1080, 1920), 0, 0, ...SHAPES.wide)
    const [w, h] = SHAPES.wide
    const d = calls[0]
    expect(d.w).toBeGreaterThanOrEqual(w - 1)
    expect(d.h).toBeGreaterThan(h) // taller than the box: the overflow is what gets cut
  })

  it('contain scales the whole picture to fit, cropping nothing', () => {
    for (const shape of Object.keys(SHAPES)) {
      const [w, h] = SHAPES[shape]
      for (const src of [img(1080, 1920), img(1000, 1500), img(1920, 1080), img(800, 800)]) {
        const [ctx, calls] = recordingCtx()
        cover(ctx, src, 0, 0, w, h, { fit: 'contain' })
        const d = calls[0]
        expect(d.w, `${shape} ${src.width}x${src.height}`).toBeLessThanOrEqual(w + 0.5)
        expect(d.h, `${shape} ${src.width}x${src.height}`).toBeLessThanOrEqual(h + 0.5)
        // The aspect ratio is kept, so nothing is squashed.
        expect(Math.abs(d.w / d.h - src.width / src.height)).toBeLessThan(0.01)
        // And it is centred in the box.
        expect(Math.abs((d.x + d.w / 2) - w / 2)).toBeLessThan(0.5)
        expect(Math.abs((d.y + d.h / 2) - h / 2)).toBeLessThan(0.5)
      }
    }
  })

  it('lets the long review pick a tall box and show a poster whole', () => {
    const r = getTemplate('reviewlong')
    const shapes = r.fields.find((f) => f.key === 'shape').options
    expect(shapes).toContain('tall')
    expect(r.fields.some((f) => f.key === 'fitWhole' && f.type === 'checkbox')).toBe(true)
    expect(r.defaults().fitWhole).toBe(false) // cropping stays the default
    const item = r.fields.find((f) => f.key === 'items').fields.map((f) => f.key)
    expect(item).toEqual(expect.arrayContaining(['x', 'y', 'zoom']))
    const d = r.defaults()
    for (const shape of shapes) {
      for (const fitWhole of [false, true]) {
        expect(() => r.draw(fakeCtx(), d.secTitle + d.secHook + 1, { ...d, shape, fitWhole }, A), `${shape}/${fitWhole}`).not.toThrow()
      }
    }
  })
})
