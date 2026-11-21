# Content format for Cinephile Perspective Studio

What to ask an assistant (ChatGPT or any other) for, so the answer drops straight into the studio.

## How to use it

Ask for one JSON object in this wrapper:

```json
{
  "app": "cinephile-studio",
  "version": 1,
  "template": "<template key from the tables below>",
  "data": { ...the fields for that template... }
}
```

Save it as a `.json` file, then in the studio press **Load project (JSON)**, at the top of the
**Save & load project** section in the editor panel. It opens on that template with the text filled
in. Pictures are uploads, so add those yourself afterwards.

### Rules the file has to follow

- **Only the keys listed below.** Anything else is ignored — the studio now says which keys it
  threw away when you load the file, so read that message rather than assuming it worked.
- **Types matter.** A number must be a number and a true/false must be a boolean. `"12"` and
  `"yes"` are silently thrown away and the default used instead.
- **Leave out anything you do not want to set.** Missing keys keep their defaults — including all
  the timing and colour settings, which an assistant should not be guessing at.
- **`assets` can be left out entirely.** Pictures, clips and music are uploads; the file does not
  carry them.
- **`**double asterisks**` make a word bold** in any field whose label mentions it (synopses and
  the long-form `body` fields). Use it for names and film titles.
- Keep every piece of text short. These are video captions, not paragraphs: a heading is a few
  words, a body line is one or two sentences. Long text is shrunk to fit, then truncated.

---

## The long videos (16:9, 1920x1080)

All seven share the same outer shell, so ask for these keys plus the `items` shape for the template
you want:

| key | type | what it is |
|---|---|---|
| `kicker` | text | small heading above the title, on the opening card |
| `title` | text | the video title |
| `sub` | text | one line under the title |
| `hook` | text | the line on the second card. Leave it out to skip that card |
| `hookNote` | text | smaller line under the hook |
| `items` | list | one entry per slide — the shape depends on the template, see below |
| `ctaH` | text | closing card heading |
| `ctaS` | text | closing card line |
| `ctaTag` | text | the pill on the closing card (usually the channel tagline) |

Optional, and best left out unless you have a reason: `look` (`Noir`, `Crimson`, `Indigo`,
`Emerald`, `Sepia`, `Daylight`), `bgStyle` (`Glow`, `Grid`, `Dots`, `Stripes`, `Rays`, `Aurora`,
`Waves`, `Bokeh`, `Circuit`), `shape` (`poster`, `wide`, `square`), `countdown` (true counts
N→1), `showRail`, `watermark`.

### ⚠️ `reviewlong` is not the same template as `review`

This is the easiest mistake to make, because the two have similar names and both review a film.
They share **no** field names:

| short `review` | long `reviewlong` |
|---|---|
| `synopsis` | `hook` (the setup card) |
| `slides`, each `{ label, value }` | `items`, each `{ heading, score, body }` |
| `reviewWord` | — |
| `overall`, `overallLabel` | `overall`, `overallLabel` (the only two in common) |
| — | `verdictH`, `verdictS`, `verdictTag` instead of `ctaH` / `ctaS` / `ctaTag` |

Put `synopsis` or `slides` in a `reviewlong` file and the studio will tell you it ignored them, then
show its four built-in placeholder chapters. The file is not broken — it is being read, and none of
your content fits. Rename the fields and reload.

### items, per template

| template key | label | each item |
|---|---|---|
| `buzzlong` | Cinema Update (long) | `heading` headline · `status` one of `Official` / `Reported` / `Rumour` · `source` where it came from · `body` what happened |
| `birthdaylong` | Star of the Day (long) | `heading` name · `role` Actress, Director, Composer… · `born` born/age line · `body` known for |
| `tributelong` | Remembrance (long) | `heading` name · `role` · `dates` e.g. `1950 – 2020` · `body` a line about them |
| `rewindlong` | Cinema Rewind (long) | `heading` film title · `years` e.g. `10 Years Of` · `released` e.g. `Released 29 June 2015` · `body` why it still matters |
| `reviewlong` | Cinephile Review (long) | `heading` the aspect (Story, Performances, Music…) · `score` e.g. `8.0/10` · `body` the argument, 2–3 sentences |
| `spotlightlong` | Weekend Watch (long) | `heading` film title · `cast` comma separated · `director` · `where` `In theatres` / `Streaming` · `body` why watch it |
| `countdown` | Cinema Countdown | `heading` film title · `year` year/director · `rating` rating or where to watch · `body` why it is on the list |

Every item also takes an `image`: either upload it in the studio, or put a direct link to the picture file (`https://…/poster.jpg`) and it is fetched when the project loads. The site must allow other pages to read its images (Wikimedia and TMDB do); a link that cannot be loaded is reported and left blank.

`reviewlong` additionally takes `overall` (e.g. `7.8/10`), `overallLabel` (e.g. `Overall`),
`verdictH`, `verdictS`, `verdictTag`.

### A full worked example (`reviewlong`)

```json
{
  "app": "cinephile-studio",
  "version": 1,
  "template": "reviewlong",
  "data": {
    "kicker": "Cinephile Review",
    "title": "Jailer 2",
    "sub": "Directed by Nelson Dilipkumar",
    "hook": "Tiger Muthuvel Pandian is back. Does the sequel earn it?",
    "hookNote": "Spoiler-free: nothing past the first act.",
    "items": [
      { "heading": "Rajinikanth", "score": "8.5/10", "body": "**Rajinikanth** does what only he can, and the film knows it." },
      { "heading": "Story", "score": "6.0/10", "body": "The thinnest part. The plot exists to move Pandian between confrontations." }
    ],
    "overall": "6.5/10",
    "overallLabel": "Overall",
    "verdictH": "The verdict",
    "verdictS": "A star vehicle that works whenever it remembers it is one.",
    "verdictTag": "Beyond the Screen. Into the Story."
  }
}
```

That loads as an 85-second video: title card, setup, four chapters, verdict ring. There is a
complete copy in `jailer2-reviewlong.json` next to this file.

### Example request

> Give me a `spotlightlong` project file for Cinephile Perspective Studio: six Malayalam films
> worth watching this weekend, three in theatres and three streaming. JSON only, using the
> wrapper and keys from the format document. Short captions, no images.

---

## The Shorts (vertical, 1080x1920)

### `buzz` — Cinema Update

| key | type | what it is |
|---|---|---|
| `headline` | text | a few strong words |
| `summary` | text | one or two lines: what happened and why it matters |
| `status` | one of `Official`, `Reported`, `Rumour` | how confirmed it is |
| `source` | text | source line |
| `date` | text | optional, e.g. `18 OCT 2026` |
| `label` | text | the label strip, e.g. `Cinema Buzz` |

Upload yourself, or give a direct image link: `image` (poster / still / first look).

### `birthday` — Star of the Day

| key | type | what it is |
|---|---|---|
| `name` | text | who it is |
| `role` | text | Actress, Director, Composer… |
| `line1`, `line2` | text | the greeting, split over two lines (e.g. `Happy` / `Birthday`) |

Upload yourself: `photo`, `photo2`.

### `tribute` — Remembrance

| key | type | what it is |
|---|---|---|
| `heading` | text | `In Loving Memory`, `Rest in Peace`… |
| `name` | text | who it is |
| `role` | text | Actor, Director, Singer… |
| `dates` | text | `1950 – 2020` |
| `occasion` | text | `5th Death Anniversary`, `Passes Away`… |
| `message` | text | optional short tribute line |

Upload yourself: `photo`. Keep `blackAndWhite` true unless you want colour.

### `rewind` — Cinema Rewind

| key | type | what it is |
|---|---|---|
| `title` | text | the film |
| `label` | text | anniversary line, e.g. `1 Year of` |
| `subtitle` | text | e.g. `Released 29 June 2023` |
| `icon` | text | a symbol or emoji before "Rewind", or empty |

Upload yourself: `poster`, `stills` (the film strip).

### `review` — Cinephile Review

| key | type | what it is |
|---|---|---|
| `title` | text | the film |
| `synopsis` | text | short and spoiler-free; `**bold**` the names |
| `slides` | list of `{ label, value }` | one per aspect — `label` is the heading (`Acting`), `value` the score (`8.0/10`) |
| `overall` | text | overall score, or empty to skip it |
| `reviewWord` | text | the word under the title, e.g. `Review` |
| `overallLabel` | text | heading above the overall score |

Upload yourself: `poster`, each `slides[].image`, and any `clips`.

### `spotlight` — Weekend Watch

| key | type | what it is |
|---|---|---|
| `kicker` | text | small heading, e.g. `Weekend` |
| `title` | text | big heading, e.g. `Watch` |
| `movies` | list of `{ title, cast, director, date }` | one per film; `date` is the release line (`In theatres`) |

Upload yourself: each `movies[].poster`.

### `festival` — Festival Wishes

| key | type | what it is |
|---|---|---|
| `greeting` | text | e.g. `Happy Diwali` |
| `wish` | text | the wish line |
| `from` | text | e.g. `from Cinephile Perspective` |
| `occasion` | one of the list below | sets the colours and the default emblem |
| `emoji` | text | an emblem emoji, or empty for the occasion's own |

`occasion` is one of: `Diwali`, `Pongal`, `New Year`, `Christmas`, `Eid`, `Holi`,
`Independence Day`, `Republic Day`, `Ayudha Pooja`, `Dussehra`, `Navaratri`, `Onam`, `Ugadi`,
`Ganesh Chaturthi`, `Vishu`, `Ramzan`, `Birthday`, `Anniversary`, `Celebration`, `Custom`.

Optional: `bgStyle` one of `Rays`, `Glow`, `Sparkle`, `Confetti`, `Bokeh`, `Plain`.

---

## A prompt you can paste

> You are filling in a project file for Cinephile Perspective Studio, which makes YouTube videos
> about cinema. Reply with **one JSON object and nothing else**, in exactly this wrapper:
>
> `{"app":"cinephile-studio","version":1,"template":"TEMPLATE_KEY","data":{...}}`
>
> Rules:
> - Use only the keys I list. Do not invent keys, and do not include images, audio, colours or
>   timings.
> - Text is for video captions: headings are a few words, body lines one or two sentences.
> - Wrap names and film titles in `**double asterisks**` in any field I mark as taking bold.
> - Facts must be real and checkable. If you are unsure of a date, a rating or a cast member, leave
>   that field out rather than guessing, and tell me afterwards which ones you left out.
>
> TEMPLATE_KEY is `_______`, and the keys are:
>
> _______ (paste the rows for that template from the tables above)
>
> The video is about: _______

Fill the three blanks and send it. Check the facts before you film: the studio has no idea whether
what it is showing is true.
