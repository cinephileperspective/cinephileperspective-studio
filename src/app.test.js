// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Canvas and a few browser APIs do not exist in the simulated DOM, so give them harmless stand-ins.
const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : t[k] || (() => {})), set: (t, k, v) => ((t[k] = v), true) })
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ctx
  globalThis.ResizeObserver = class { observe() {} disconnect() {} }
  document.fonts = { load: async () => [] }
  URL.createObjectURL = () => 'blob:x'
})

// Each test mounts a fresh app, and the app restores its last session from localStorage, so the
// store is cleared between tests to keep them independent of the order they run in.
beforeEach(() => localStorage.clear())

describe('App', () => {
  // Walks every template in a kind and returns the heading shown for each.
  async function walkKind(w, label) {
    await w.findAll('.kinds button').find((b) => b.text().startsWith(label)).trigger('click')
    await flushPromises()
    const seen = []
    for (let i = 0; i < w.findAll('.tpls button').length; i++) {
      await w.findAll('.tpls button')[i].trigger('click')
      await flushPromises()
      seen.push(w.find('.tname').text())
      expect(w.findAll('details').length).toBeGreaterThan(2)
    }
    return seen.join('|')
  }

  it('mounts and switches between every Shorts template', async () => {
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Cinephile Perspective')
    expect(w.findAll('.tpls button')).toHaveLength(7)
    const seen = await walkKind(w, 'Shorts')
    for (const label of ['Star of the Day', 'Cinephile Review', 'Cinema Rewind', 'Weekend Watch', 'Remembrance', 'Cinema Update', 'Festival Wishes']) {
      expect(seen).toContain(label)
    }
    expect(seen).toContain('1080\u00d71920')
  })

  it('switches to the long video kind and offers a 16:9 template', async () => {
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    const seen = await walkKind(w, 'Long video')
    // One long template per short, plus the generic Cinema Countdown.
    for (const label of ['Cinema Update (long)', 'Star of the Day (long)', 'Remembrance (long)', 'Cinema Rewind (long)', 'Cinephile Review (long)', 'Weekend Watch (long)', 'Cinema Countdown']) {
      expect(seen).toContain(label)
    }
    expect(seen).toContain('1920\u00d71080')
    // The export button follows the template's own size, not a hard-coded vertical one.
    expect(w.findAll('button').some((b) => b.text().startsWith('Export 1920\u00d71080'))).toBe(true)
    // Switching back remembers where you were in Shorts.
    await w.findAll('.kinds button').find((b) => b.text().startsWith('Shorts')).trigger('click')
    await flushPromises()
    expect(w.find('.tname').text()).toContain('1080\u00d71920')
  })

  it('edits a field, adds and removes a list item, and autosaves', async () => {
    vi.useFakeTimers()
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    await w.findAll('.tpls button').find((b) => b.text().includes('Review')).trigger('click')
    await flushPromises()
    const title = w.findAll('input[type=text]').find((i) => i.element.value === 'Movie Title')
    await title.setValue('Test Movie')
    const before = w.findAll('.item').length
    await w.findAll('button.add').find((b) => b.text().includes('Add slide')).trigger('click')
    expect(w.findAll('.item').length).toBe(before + 1)
    await w.findAll('.item')[0].find('button[aria-label=Remove]').trigger('click')
    expect(w.findAll('.item').length).toBe(before)
    vi.advanceTimersByTime(500)
    const saved = JSON.parse(localStorage.getItem('cinephile-studio-v1'))
    expect(saved.template).toBe('review')
    expect(saved.data.review.title).toBe('Test Movie')
    vi.useRealTimers()
  })
})

describe('App on a phone without fast export (older iPhone)', () => {
  it('offers real-time recording, enables Export and explains it', async () => {
    globalThis.MediaRecorder = class { static isTypeSupported() { return true } }
    HTMLCanvasElement.prototype.captureStream = () => ({})
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Real-time recording')
    expect(w.text()).toContain('Keep this screen on')
    const btn = w.findAll('button').find((b) => b.text().startsWith('Export 1080'))
    expect(btn.attributes('disabled')).toBeUndefined()
    delete globalThis.MediaRecorder
  })
})
