# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cinephile Perspective Studio: a Vue 3 + Vite app that authors and exports cinema videos for the Cinephile Perspective channel — vertical Shorts (1080x1920) and one 16:9 long video (1920x1080). It is the sibling of Now Learning Studio and QuizRiddleton Studio; all three now share the same canvas stage, clock, exporter, asset store and file handover, and those files are kept byte-identical so they can be diffed between repos.

Templates are grouped by **kind**: `short` (vertical) or `long` (16:9). `App.vue` shows a Shorts / Long video switch above the template tabs and remembers which template you were last on in each kind. Eight templates (the Birthday, Review, Rewind and Weekend Watch ones follow the channel's Canva videos):

| key | label | segment | length |
|---|---|---|---|
| `buzz` | Cinema Update | Cinema Buzz news, with Official / Reported / Rumour tag | fixed (default 10 s) |
| `birthday` | Star of the Day | celebrity birthdays | fixed (default 10 s) |
| `tribute` | Remembrance | death anniversaries, passing news | fixed (default 10 s) |
| `review` | Cinephile Review | movie reviews | grows with slides |
| `rewind` | Cinema Rewind | anniversaries | grows with stills |
| `spotlight` | Weekend Watch | theatre / OTT roundups | grows with films |
| `festival` | Festival Wishes | festival and occasion greetings | fixed (default 8 s) |

Every Shorts template except Festival Wishes has a long-form counterpart, keyed `<short>long`, plus one extra generic list:

| key | label | pairs with | shape |
|---|---|---|---|
| `buzzlong` | Cinema Update (long) | `buzz` | list show; each story tagged Official / Reported / Rumour |
| `birthdaylong` | Star of the Day (long) | `birthday` | list show; per-item photo framing |
| `tributelong` | Remembrance (long) | `tribute` | list show; black-and-white photographs, rail off by default |
| `rewindlong` | Cinema Rewind (long) | `rewind` | list show; anniversary tag per film |
| `reviewlong` | Cinephile Review (long) | `review` | **chaptered**: one aspect per chapter, closing on a verdict ring |
| `spotlightlong` | Weekend Watch (long) | `spotlight` | list show; cast, director and where to watch |
| `countdown` | Cinema Countdown | — | the generic ranked "Top N" list |

`templates.test.js` checks the pairing both ways, so adding a short template without its long sibling (or vice versa) fails the suite.

## Commands (run in this directory)

`npm install`, `npm run dev`, `npm run build`, `npm test` (vitest; `npx vitest run src/lib/templates.test.js` for one file). Export needs https or localhost (WebCodecs) and works on desktop Chrome/Edge/Brave/Safari and on iPhone (see Export below).

## Architecture

- **One draw function per template.** `src/templates/<key>.js` exports `{key,label,short,emoji,kind,size,fps,defaults,fields,duration,thumbTime,fileName,draw,video?,audio?,soundtrack?}`. `kind` is `'short'` or `'long'` and decides which switch the template appears under, the safe-area overlay and the length advice (`sizeStatus` in `lib/files.js`). `draw(ctx, t, data, A)` paints the whole frame for time `t` and must be pure in `(t, data, A)`: no clocks, no `Math.random`, no state between frames. `A.img(id)` and `A.video(id)` return decoded media or `null` (draw a placeholder via `cover()`, which already does).
- **Preview and export share `draw()`.** `StageCanvas.vue` calls it on the visible canvas (about 30 repaints a second while playing); `lib/exporter.js` calls it on an offscreen canvas. There is no DOM rasterising and no animation freezing, so anything the canvas can draw exports correctly.
- **Export methods (`lib/exporter.js`).** Chosen by feature detection (`exportCaps()` / `pickMethod()`), never by user agent. `fast`: offline, every frame through WebCodecs `VideoEncoder` into MP4 via `mp4-muxer`, sound mixed in an `OfflineAudioContext` and encoded with `AudioEncoder` (AAC, Opus fallback). `record`: real time, the canvas plays once into `MediaRecorder` (`captureStream`) together with the mixed sound; used when sound is wanted but `AudioEncoder` is missing (iPhones before iOS 26) or when fast export fails (the app then falls back automatically). Safari, Chrome and Brave on iPhone are all WebKit and behave the same. A WebCodecs support table shows full support from Safari/iOS 26 and partial (no audio encoding) from 16.4 to 18.7. `keepAwake()` requests a screen wake lock during export. `App.vue` `deliver()` shows a Share / Save and Download card for every result; phones never auto-download because iOS blocks downloads that start after a long render, and Share is how a video reaches Photos.
- **Browser gaps are patched in `lib/polyfill.js`** (called from `main.js`): `ctx.roundRect` (Safari < 16) and `ctx.letterSpacing` (Safari < 18.4, emulated letter by letter, skipping Indic/Arabic/Thai so shaping is never broken). Do not use `ctx.filter` (Safari lacks it): bake the effect instead, as `provider.gray(id)` does for the Remembrance photo. Large photos are capped at 2400 px.
- **One clock.** `lib/useClock.js` holds `t`; everything is drawn from `t`. Editing pauses but keeps the frame. `useMusicPreview` plays the chosen music track in the preview only.
- **Fields drive the editor.** `fields` is a list of `{group,key,label,type,...}`; `FieldEditor.vue` renders it (types: text, textarea, number, range, color, checkbox, select, image, images, video, audio, list; `select` takes `options: [...]`). A `list` has `newItem` and nested `fields`. Adding a field means: add it to `defaults()` and `fields`, and use it in `draw()`. Saved data is merged over `defaults()` by `normalizeData`, which also drops values of the wrong type.
- **Photo position.** Templates that crop a photo (birthday, tribute, buzz) expose `X`/`Y`/`Zoom` range fields in a `Photo position` group and pass them to `cover()` as `fx`, `fy`, `zoom`. A field with `seek: <seconds>` makes the preview jump to that time while it is dragged, so the framing is judged on a settled frame (the editor emits `seek`, `App.vue` calls `clock.seekTime`).
- **Media.** `lib/assets.js` stores uploads in IndexedDB (`cinephile-studio` / `assets`) and in memory (ImageBitmap capped at 2400 px, `<video>`, audio). Project data only holds the short asset id. `collectIds(tpl, data)` finds ids through the field definitions; unused stored files are pruned on startup. `assetTick` bumps when media loads so the stage repaints.
- **Video clips (Review).** A template that shows video exposes `video(d, t) -> [{id, time}]`. The preview seeks the `<video>` without waiting; the exporter awaits `seeked` per frame (`prepareVideos(needs, true)`) so frames are exact. Clips loop by `time % duration`.
- **Audio.** `audioPlan(tpl, d, total)` (in `templates/index.js`) returns `[{id,start,dur,loop,gain,fadeOut,offset}]`: the music track plus anything a template adds with `audio(d,total)` (Review adds each clip's own sound). The exporter decodes each file with `decodeAudioData`, mixes them in an `OfflineAudioContext` and encodes AAC (Opus fallback). Files without an audio track are skipped silently.
- **Fonts.** Bundled with `@fontsource/*` (imported in `main.js`). Canvas text only uses a web font after it has loaded, so `FONT_LOADS` in `brand.js` is awaited in `App.vue` before the first paint is considered ready. A new font needs: the package, an import in `main.js`, a `FONTS` entry and a `FONT_LOADS` entry. Malayalam/Tamil/Telugu/Kannada text falls back to whatever system font exists (the stacks list Noto Sans families); bundle one if exports must not depend on the machine.
- **The long videos are built from `lib/wide.js`**, which holds the whole 16:9 kit: nine background templates, `wpara` (wrapped text that honours `**bold**`), `panel`, `wpill`, `rankChip`, `wideRail`, the scene painters and the timeline (`listPlan`, `listAt`, `rankOf`). It is byte-identical in Now Learning Studio, so fix layout bugs in both. An empty hook skips the hook card; `countdown: true` numbers items N..1.
  - **List shows** (everything but `reviewlong`) are one call: `drawListShow(ctx, t, d, A, P, { itemOf })` paints all four scenes, the rail and the watermark, and `itemOf(item, i)` is the only part a template writes — what its own slides contain. `listShellFields(lookField)` and `listShellDefaults()` supply the cards either side of the items, so a new list show declares only its own item fields.
  - **Chaptered deep-dives** (`reviewlong`) share the same timeline but paint `chapterSlide` instead of `itemSlide` and close on `verdictCard` instead of `ctaCard`, because a review is an argument, not a ranking. Their `secItem` defaults much higher: a chapter is a paragraph, not a caption.
- **Colour templates for long videos** are `LOOKS` in `lib/looks.js` (Noir, Crimson, Indigo, Emerald, Sepia, Daylight), shared by all seven. A vertical template carries its own accent instead, because it is a single poster; a long video runs for minutes and needs a whole palette.
- **Festival Wishes (`templates/festival.js`)** carries its own occasion palettes (`OCCASIONS`, plus a `Custom` one derived from two colours) and six backdrops, and depends only on `brand.js` and `lib/draw.js` — so it is byte-identical in QuizRiddleton Studio too.
- **Handing over the finished file** is `lib/save.js` + `lib/device.js`, shared by all three studios. `needsTapToSave()` is true on a handheld whose browser can share files: the export then waits behind a Share / Save button, because a share sheet needs a fresh tap and a long render has outlived the one that started it. Computers download straight away. `isHandheld()` is user-agent based and is only ever used to choose *how* to hand a file over, never whether a feature exists — that is always feature detection.
- **Brand.** `src/brand.js` holds names, tagline, watermark text, storage key, the IndexedDB store name (`assetDb`) and font stacks. Templates use `FONTS` and `BRAND` rather than literals.
- **Persistence.** Autosave: `localStorage` key `cinephile-studio-v1` (`{template, sound, data}` for all four templates; media ids only). Save project writes a JSON with the media embedded as data URLs (`{app, version, template, data, assets}`); Load restores it.
- **Layout.** `App.vue` is the shell (template tabs, generic editor groups, export, cover JPG, save/load, shortcuts). `styles/shell.css` is the responsive shell: side panel at 900 px and wider, Edit/Preview tabs below.

## Gotchas

- Keep key content inside the safe area (toggle it in "View & file"): top 250 px and bottom 420 px are covered by platform UI.
- `text()` in `lib/draw.js` corrects centred text for letter spacing.
- Emoji in captions (Weekend Watch uses sparkle and camera emoji) depend on the system emoji font.
- Preview only plays the music track. Clip sound is mixed in at export time.
- Verified only in Node/happy-dom (fake MediaRecorder, fake canvas). Real iPhone behaviour (MediaRecorder codecs, video-clip seeking, memory, share sheet) is untested; test on a device after changes to the export path.
- Remembrance's black-and-white look comes from a cached grayscale canvas (`provider.gray`), not a canvas filter.
- Real-time recording takes as long as the video and stops if the page is backgrounded or the screen locks (it reports this). On iPhone, preview of Review's clips seeks frame by frame and may stutter; recording uses the same path.
- Review's reaction clips split the video length equally; the length itself comes from the slides, not the clips.
- `templates.test.js` runs every template's `draw()` against a fake context at 61 moments, with and without media, and covers the long-video timeline and every festival palette. It catches runtime errors but not how things look. Verify layout changes by eye in the browser.
- `app.test.js` mounts the whole app under happy-dom with stubs for canvas, ResizeObserver and `document.fonts`.
