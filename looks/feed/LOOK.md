# FEED — the reel is a phone screen

**Start here:** `new_reel.py --look feed` copies `starter.html` to `src/index.src.html`: the phone chrome, the three twin framings, captions, swipes, and a 10 s demo timeline with one of each helper (notification, counter, story switch + hand sticker, chat, chart from data), then HERO, and an outro tied to `DUR`. Every placeholder line is marked `REPLACE`.
**Full worked example:** `example/` (a 16 s reel about a trading card that sold for $16.5M: live auction, story, chat, chart, plus its `mix.py` cues, `gen_img.mjs` and `gen_sfx.mjs`). Read it for timing ideas; don't copy its content.

## Make a new reel in this look (checklist)
1. Read `audio/words.json` and split the script into beats (one app screen per beat). Write the frame-0 thumbnail first: `#nb0` (the payoff as a notification) + `#hook0` (before → after), both visible from CSS.
2. For each beat write, in this order: a `flickUp` finger + `swipeOut` of the old screen, a `dock()` of the bubble (HERO / PIP / PIPL / STORY), the new screen (`swipeIn` or `emerge` from his hand), its payoff (a counter, a pop, a stamp of colour), and a `badge` bump. Keep a PiP stretch ≤ ~5.5 s, then go back to HERO or STORY.
3. Pick the helper by what he says:
   - news, a name, "this week" → `notify(sel, t, out)` with an `.nb` banner
   - a price, a count, a score → `cnt(sel, t, d, from, to, num|usd|times|pct)` on a `.card2`, then a `pop` gain chip
   - "people are saying", community, reactions → a `.chatp` panel: `swipeIn` + `pop` per `.msg` + `#typing`
   - "me", a memory, behind the scenes → `dock(t, STORY, SV)` + `storyOn(t)`, stickers via `emerge(id, t, SV, hand)`; leave with `storyOff(t)`
   - growth over time → `.chartc` + `chartBuild("ch", CHART)` → `drawCold` then `drawHot`, a `×N` counter, `#brk`, `jolt` + `shake` + `flash`
   - a bidding war → `.bid` rows popping beside the PiP while `cnt` runs the price (see example)
4. Use `emerge()` for the main card of each beat: at least one element per reel should grow out of his hand (`HANDS`).
5. Fill `KEY` in the captions with the punch words, exactly as spelled in the built captions.
6. Build, lint, snapshot (0, each beat start + 1 s, the end) and check: face never covered, no clipped Hebrew, nothing under the captions (cards end ≤ canvas y 1600).
7. Add the `mix.py` cues (see Sound palette): one cue per visual event.

**Chart data must be real.** The chart shape is drawn straight from the `CHART` array. Its numbers must come from data the creator supplies (with a source in `.sub`). Never invent a curve or "improve" one to look more dramatic; if there is no data, use a counter card instead.

## Idea and when to use it
The whole 9:16 frame is a phone. The twin is on a video call: a rounded bubble that starts big, docks to a picture-in-picture corner, opens into a full-screen story, and docks again. Everything he says turns into a real-app moment: a push notification, a marketplace listing, a live auction, a group chat, a stock chart. A swipe up moves to the next "post" on each new beat.
Use it for **trend, money, market and internet-culture explainers**: prices, launches, viral news, "everyone is doing X", numbers that grow. It's less suited to slow personal stories or abstract ideas with no screen to show.

## Palette roles (only the 3 brand hexes + rgba of ink/paper)
- **Ink `#111111`**: the app background (dark mode), chat panel (`color-mix(paper 9%, ink)`), caption chips at 82%.
- **Paper `#F5F3EE`**: cards, notification banners, the call bubble's backdrop (radial paper → `color-mix(paper 86%, ink)` vignette), status-bar text.
- **Accent `#E63B2E`**: only for "live / money / growth": LIVE pill, badge, winning bid, the price after it rises, SOLD ribbon, gain chips, the breakout line, KEY caption words, big numerals. Tints use `color-mix(in srgb, var(--red) N%, transparent)`.
- Nothing else: no `#fff`, no `rgba(0,0,0,…)`. Shadows use `rgba(17,17,17,a)`, the flash and the story-sticker border use paper. `build.py` swaps only the three hexes and the two rgba bases, so any other colour would stay the same for every member.
- Images: product photos from the style prompt come out on-palette (ink/red/paper). PNG pixels are **not** swapped by build.py. For another member's brand, regenerate the images with their `style_prompt`.

## Type
- **Heebo** (variable 100–900, local woff2 `heebo_he/lx/la`) for all UI: titles 800 at 40–50px, body 500 at 32–42px, big numerals 900 at 90–260px.
- **Space Mono** 700 for tickers, timers, bid amounts, chart axes (LTR).
- Latin and numbers always sit in `direction:ltr` (`.ltr`) spans inside RTL rows. Never put punctuation after a number in an RTL caption ("14." renders ".14"): drop it in MERGE.
- Don't use glyphs outside the subsets (▲ → `.tri` CSS triangle, → becomes an inline SVG arrow).

## Phone chrome (always visible, so it's in the thumbnail)
- `#sbar` status bar, canvas y 0–84 (clock "9:41", bars, battery, `currentColor`, which turns ink while a paper story is up).
- `#abar` app bar, canvas y 78–158: `{{HEADER}}` on the right, a bell with `#badge` on the left. Bump the badge on every event (`badge(sel, t, n)`). The name `#abarNm` starts hidden (inline `opacity:0`) and appears only after the first notification has cleared, because banners sit over the app bar and the name would peek out above them. Hide it again under any banner that stays (the outro).
- `#homebar` home indicator at canvas y 1882.
- In story mode, fade out `#abar`, `#rtag` and `#homebar`, and show `#sbars` (progress), `#shead` and `#reply`. `storyOn(t, fill)` and `storyOff(t)` do all of this.

## Twin staging (canvas px; cam coords = canvas + 40)
The twin lives inside `#callclip` (full-canvas div, `clip-path: inset(... round r)`) over `#callbg`. `#ring` draws the bubble's edge and shadow and carries `#rtag` (red dot + call timer `clock()`).
`VIEW(R, s, fy)` puts his face centre (source px 938, 320; for another twin, define `const TWIN_FACE = [x, y]` before `{{LOOKJS}}`) at the rect's centre x and `fy` of its height.

| state | rect {x,y,w,h,r} | scale, fy | face width | use |
|---|---|---|---|---|
| HERO | 50, 260, 980, 1120, 56 | 1.2, .40 | ~310px | hook, thumbnail, any "I/me" line |
| PIP right | 560, 150, 470, 600, 44 | 0.85, .45 | ~220px | while a card fills the lower half |
| STORY | 0, 0, 1080, 1920, 0 | 1.18, .333 | ~305px | personal beat; stickers go at his hands (y 1000–1520) |
| PIP left | 50, 150, 470, 600, 44 | 0.85, .45 | ~220px | the second data beat; big numbers go top right |

- The first state is written in CSS (`#callclip` clip-path, `#twin` transform, `#ring` box) so frame 0 is right. Then call `callInit(HERO, HV)` once (it also pins that state at t=0); every `dock(t, R, V, d)` is an explicit fromTo from the previous state.
- Keep PiP stretches ≤ ~5.5 s, and alternate with HERO/STORY so the lips stay readable. Never go below 0.85 scale in a 470-wide PiP.
- Cards live below y 760 when the PiP is up. Nothing enters the bubble rect.

## Motion language (look/look.js, injected at `{{LOOKJS}}`; look/look.css at `{{LOOKCSS}}`)
- Easing: `expo.inOut` for docks (0.5–0.6 s), `expo.out` for entrances, `back.out(1.4–3)` for UI pops, `power3.in` for exits. Smooth, never boiled or jittered: this look has no stop-motion.
- `emerge(id, t, view, handIndex, rot)`: a card grows out of his real hand position (from `HANDS`) at scale 0.12 → 1. **Use it for the main card of each beat.** The element needs inline `left/top/width` + `data-h`.
- `notify(sel, t, out)`: iOS banner drop and flick away. `pop`, `rise`, `out`: UI atoms.
- `cnt(sel, t, d, from, to, fmt, n, pow)` with the `num` / `usd` / `times` / `pct` formatters (big numbers roll in round steps). `badge`, `clock` (m:ss call timer, any length), `jolt` (horizontal card shake), `back` (fade a chrome element back in), plus the page's `shake` and soft `flash(t, .25–.3)`.
- `storyOn(t, fill)` / `storyOff(t)`: the chrome swap for story mode (pair with a `dock`).
- `chartBuild(prefix, DATA, hot)`: builds a `.chartc` card's line, area, dot and clip rect from `[[label, value], …]`; returns `drawCold(t, d)`, `drawHot(t, d)` (the accent breakout of the last `hot` segments) and `end`.
- Finger indicators `.tch` (`.dk` on paper): `flickUp(sel, t)` before every swipe, `tap(sel, t)` on a button or tab. One element per use.

## Transitions
- **Swipe to the next post**: `flickUp` finger → `swipeOut(old, t)` (y -2100, power3.in, then hidden) + `swipeIn(new, t+0.06)` (from y +1500, expo.out) + a `dock()` of the bubble in the same 0.5 s. It's one gesture, not three.
- **Bubble ↔ story**: dock to STORY, and the status bar tweens paper → ink.

## Captions (src/caps_A.css; KEY set in the page)
- "Subtitle chips": each word is its own pill (ink 82%, paper hairline, Heebo 800 62px). The spoken word inverts to a paper pill with ink text, like a selected filter chip. KEY words turn into accent pills.
- Fixed at `top:1622` (chip centre ~1720): below every card (cards end ≤ 1600) and the story stickers (≤ 1520), above the home bar. Entry: y +24 → 0, 0.16 s expo.out.

## Sound palette (mix.py; gains in dB under the voice peak)
Generated for the look (`audio/`): `tap` 11, `notif` 8, `flick` 9, `bid` 12, `rise` 9 (3 s riser). From the library: `pop` 4, `count` 10, `kaching` 6, `sparkle` 9, `whip` 10, `chime` 6, `ping` 12, `hit` 3.5.
Rules: every swipe gets a `flick`; every banner or new message a `notif`/`ping`; every number tick run a `count`; every money landing a `kaching`; a growing chart a `rise` that ends on the breakout `hit`.

## Signature compositions (as built in example/; timings are that reel's)
1. **Live auction** (beat 1, ~3.7–6.6 s): a listing card (`.card2`: photo 470px, title, seller, price, button) under the right PiP; LIVE pill + `.bid` rows pop into the left column beside the bubble while `cnt` runs the price, which turns red; at the last bid a SOLD ribbon (`.sold`, rotate -30, scaleX 0 → 1), the button crossfades to "נמכר", and a `+%` gain chip appears.
2. **Call → story** (beat 2, 6.9 s): the PiP bubble blows up to full screen. The status bar turns ink, the story progress bar fills, and two paper-bordered stickers (`.stk`) emerge from his two hands.
3. **Chart breakout** (beat 3, 12.8–15.5 s): a paper chart card. The 2020+ tab gets tapped by a finger, the ink line draws (`stroke-dashoffset`) with an area reveal (`clipPath` rect width), then the red final segment, the dot, a giant `×N` counter top right, a red arrow `#brk` breaking out of the card (scaleY from the bottom), a `+%` chip, `jolt` + `shake` + soft flash.
Also: the **thumbnail** (frame 0) = a notification banner with the payoff number + HERO bubble + a hook card "$5M → $16.5M", all visible from CSS, and it all clears in the first 0.3 s.

## Do / Don't
- Do make every beat a real app screen: notification, listing, chat, chart, story, DM. One screen per beat, one swipe between them.
- Do let `swipeIn` bring every bottom card/sheet: it clips the card at the caption line (`CAPS_LINE`) while it travels, so captions are never covered. Settled cards must end above canvas y 1600; bring anything else in from the hand (`emerge`) or the top.
- Do keep faces of strangers out: avatars are initials circles only. Real people (a famous buyer, a CEO) appear as **text only**.
- Don't use rubber stamps, torn paper, halftone, paper grid, manga or tattoo motifs (that's the reserved flash look). Don't use rotation wobble or `boil`.
- Don't use emoji (they bring their own colours).
- Don't draw copyrighted characters: card art is a generic lightning-bolt card back.

## Gotchas
- `{{CAPSTYLE}}` must stay in the `<style>` block, or captions silently render as tiny unstyled text.
- `swipeOut` to -1500 left a 850-tall card visible behind the status bar. Exit far (-2100) **and** set opacity 0 after.
- A long price ($16,500,000 at 108px) collided with the buy button: price ≤ 90px, button 270 wide.
- `.big`/price numbers in RTL rows need `direction:ltr`. Trailing punctuation on numbers flips sides.
- SVG `fill="color-mix(...)"` as an attribute is ignored: use `style="fill:..."`.
- The renderer reports the unused Heebo/Space Mono subsets as "FAILED [unloaded]": harmless (unicode-range never requested).
- A `.stk` sticker needs an explicit inline `height` as well as `data-h`: its children are absolute, so without it the sticker collapses to its padding and the image slot floats see-through over the twin.
- Keep chart titles at `right:96px` (look.css does): the `#brk` arrow rises along the card's right edge.
- `show()` does not exist in this look. Use `tl.set` / `ft` or the helpers above.
- The demo timeline in `starter.html` is fixed to 0–10.2 s; anything after it must be timed to your words, and the outro is `DUR - 2.6`. This works for reels of any length (15–100 s).
