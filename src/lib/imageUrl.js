import { addFile } from './assets.js'

export const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v.trim())

// Fetches an image from a web address and stores it as an asset, returning the asset id. The server
// must allow cross-origin reads (Wikimedia, TMDB and most CDNs do). Errors carry a user-facing message.
export async function addImageUrl(raw) {
  let url
  try {
    url = new URL(String(raw).trim())
    if (!/^https?:$/.test(url.protocol)) throw new Error()
  } catch {
    throw new Error('That is not a web address (it should start with https://).')
  }
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('That site does not allow loading its images here. Save the image and use Choose instead.')
  }
  if (!res.ok) throw new Error(`The site answered ${res.status}.`)
  const blob = await res.blob()
  if (!blob.type.startsWith('image/')) throw new Error('That address is not an image file.')
  const name = decodeURIComponent(url.pathname.split('/').pop() || 'image') || 'image'
  return addFile(new File([blob], name, { type: blob.type }))
}

// A project file may put an image address where an asset id belongs. Replaces each one in `data`
// (in place) with a stored asset id; an address that cannot be loaded is blanked. Returns the failures.
export async function resolveImageUrls(fields, data) {
  const failed = []
  const load = async (v) => {
    try {
      return await addImageUrl(v)
    } catch (e) {
      failed.push(`${String(v).trim()} (${e.message})`)
      return ''
    }
  }
  const walk = async (fs, obj) => {
    for (const f of fs) {
      const v = obj?.[f.key]
      if (f.type === 'image' && isUrl(v)) obj[f.key] = await load(v)
      else if (f.type === 'images' && Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) if (isUrl(v[i])) v[i] = await load(v[i])
        obj[f.key] = v.filter(Boolean)
      } else if (f.type === 'list' && Array.isArray(v)) for (const item of v) await walk(f.fields, item)
    }
  }
  await walk(fields, data)
  return failed
}
