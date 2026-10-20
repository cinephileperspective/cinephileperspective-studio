# Cinephile Perspective Studio

Make videos for Cinephile Perspective.

**Shorts** (vertical 1080×1920): Cinema Update, Star of the Day, Remembrance, Cinema Rewind, Cinephile Review, Weekend Watch and Festival Wishes.
**Long video** (16:9 1920×1080): a long version of every Short except the greeting — Cinema Update, Star of the Day, Remembrance, Cinema Rewind, Cinephile Review and Weekend Watch — plus Cinema Countdown for a straight "Top N" list. Cinephile Review runs as a chaptered deep-dive with a verdict score; the rest are a title card, a hook, one slide per item and a closing card.

```
npm install
npm run dev      # open the printed localhost address in Chrome, Edge or Brave
npm run build    # production build in dist/
npm test
```

1. Choose **Shorts** or **Long video**, pick a template, fill in the fields, upload photos / posters / stills (and clips or music if you want).
2. Press play to preview, drag the slider to scrub.
3. **Export** makes an MP4. On computers, and on iPhone with iOS 26 or newer, it renders offline (fast). On older iPhones it records in real time instead (it takes as long as the video: keep the screen on and stay on the page). When it finishes, tap **Share / Save** and choose **Save Video** to put it in Photos. **Save cover image** gives a JPG the same way.
4. **Save project** downloads a JSON that includes your media, so you can reopen it anywhere. Your work is also autosaved in this browser.

Open the deployed https address on your phone (the offline export needs a secure page).

Deploy: Vercel with build `npm run build` and output `dist`.
