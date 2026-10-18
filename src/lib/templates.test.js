import { describe, it, expect } from 'vitest'
import { TEMPLATES, getTemplate, normalizeData, collectIds, audioPlan } from '../templates/index.js'
import { shortsStatus, fileSlug } from './files.js'
import { mix, seg, easeBack, richLines } from './draw.js'

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
