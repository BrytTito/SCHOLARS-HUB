# Brand assets

The mark is drawn in-house: a white mortarboard on the brand blue
(`hsl(221 83% 53%)` = `#2563eb`), on a 64-unit grid. Nothing is imported, so the
same drawing is used at every size.

The files in `app/` and `public/brand/` are **outputs**. Edit the HTML sources
in this folder and re-render — never hand-edit a PNG.

## What ships

| File | Size | Purpose |
|---|---|---|
| `app/icon.svg` | vector | browser tab (SVG-capable browsers) |
| `app/favicon.ico` | 16 + 32 + 48 | legacy tab, bookmarks, pinned sites |
| `app/apple-icon.png` | 180 | iOS home screen — full bleed, iOS applies its own mask |
| `app/opengraph-image.png` | 1200 × 630 | link previews (Open Graph) |
| `app/twitter-image.png` | 1200 × 630 | link previews (X/Twitter card) |
| `app/manifest.ts` | — | install name, theme colour, `any` + `maskable` icons |
| `public/brand/logo-mark.svg` | vector | standalone mark for docs and slides |
| `public/brand/logo-mark-192.png` | 192 | manifest icon |
| `public/brand/logo-mark-512.png` | 512 | manifest icon, app stores |
| `public/brand/logo-maskable-512.png` | 512 | Android adaptive icon — full bleed, art inside the 80% safe zone |
| `public/brand/logo-lockup.png` | 1440 × 360 | mark + wordmark, for light backgrounds |
| `public/brand/logo-lockup-dark.png` | 1440 × 360 | mark + wordmark, for dark backgrounds |

`components/brand/logo.tsx` exports `LogoCap`: the same geometry, in
`currentColor`, for the header, the auth pages and the registration card. Those
containers supply the padding, so the cap and the favicon stay one drawing.

## Re-rendering

```powershell
powershell -ExecutionPolicy Bypass -File brand/render-assets.ps1
```

Needs Google Chrome (headless rendering) and Node (ICO packing). No image
library, no npm packages — the sources are plain HTML, so the artwork stays
editable by anyone who can write CSS. Pass `-Chrome <path>` if Chrome lives
somewhere other than the default location.

What the script does, and why:

- **Renders big, then downsamples.** Chrome clamps a window to a minimum width,
  so `--window-size=16,16` produces a crop of a wider page, not a 16px icon.
  Everything is rendered at 1024 and reduced with a high-quality filter; that
  supersampling is also what keeps the 16px tab icon clean.
- **Keeps alpha premultiplied while resizing.** Resizing plain RGBA leaves a
  pale halo on dark backgrounds and leaves transparent corners on
  `apple-icon.png`, which iOS requires to be fully opaque. The script asserts
  that the apple icon's border is 100% opaque before finishing.
- **Uses two small-size sources.** `mark-compact.html` drops the tassel and
  thickens the strokes, because at 16px the tassel is sub-pixel and lands as a
  grey smudge. `mark-square.html` is the full-bleed variant for iOS and for the
  Android adaptive icon.

## Checks worth running after a change

- Open `app/favicon.ico` in a browser tab, and `app/opengraph-image.png` at
  100%: the headline and the GH₵ price must stay readable when the card is
  shown at ~600px wide.
- Put the site in dark mode: the header cap and the lockup must still read.
- Paste the deployed URL into a chat app. The preview must show this artwork,
  not a default.
- On a phone, "Add to Home Screen": no white corners, no wordmark.

## Do not

- Rename these files without updating `app/manifest.ts`.
- Mark a non-full-bleed image as `purpose: "maskable"` — the launcher crops it.
- Put the wordmark in the favicon. At 16px only the silhouette survives.
