# SIGNAL: broadcast HUD look

## The idea
The twin is a live broadcast. He sits inside a control-room monitor on an ink background, with a LIVE bug, a running timecode, a BREAKING lower third and a ticker. Graphics behave like signal: they tune in (flicker plus a horizontal smear), lock on (HUD brackets snap shut in steps), and cut out (CRT collapse to a scanline). Beats are joined by glitch, datamosh and signal-loss cuts, never by wipes or eases. Captions are a terminal line: words type in char by char behind a ▸ prompt, with a block cursor.

**Use it for:** news explainers, breaking stories, security and tech incidents, data or "how big is it" reels, anything with maps, counts and systems.
**Don't use it for:** warm personal stories, testimonials or soft tips. The ink and the scanlines read as urgent.

## Files
- **`src/index.src.html` (from `starter.html`) is where a new reel starts.** It has the full chrome (top HUD, monitor + bezel, BREAKING lower third, ticker, grain, glitch layers, captions) and a short demo timeline with one example of each signature move: the hook (giant word + lower third), a split-mode plate (a CSS bar chart), a radar lock with a card that transmits out of his hand, the NO SIGNAL chapter change, and an outro tied to `DUR`. Every content line is marked `REPLACE`. Beat times live in one `B = {...}` object.
- **`example/` (in the skill's `looks/signal/`) is the full worked example:** a 17 s news reel (`index.src.html`, its `build.py` with FIX/MERGE, `mix.py` cues, `gen_img.mjs`, `gen_sfx.mjs`). Read it for the map blackout and the wireframe city (compositions 2 and 4 below). Don't copy its story.
- `look/look.css` and `look/look.js` are injected by `build.py` at `{{LOOKCSS}}` / `{{LOOKJS}}`. Edit the reel's own CSS/JS in the page, not these.

## Make a new reel in this look (checklist)
1. Read `audio/words.json` and set `B.plate`, `B.lock`, `B.anchor` to the words that trigger them. Leave `B.outro` on `DUR`.
2. Per beat, write three blocks in the page: **CSS** (in the content section of `<style>`), **DOM** (plates above the monitor, behind-twin things inside `#mon` before `#twin`, cards and locks in front), and a **timeline block** that opens with a cut (`glitch`, or `nosig` once), then `mode()` + `cut()` + `push()`, then the graphics.
3. Pick the helper by job:
   - The entrance of a chip or label: `tuneIn`. Its exit: `cutOut`. A plate or map: `scanIn`. A name, stamp or card: `slam`.
   - Something that comes from him: `sp(id, t, framing)` (needs `style` left/top/width and height or `data-h`).
   - Pointing at the thing that matters: `lockOn` (brackets + tag). A number: `count`. A punch word: `jolt`. An impact: `flash` + `shake`.
   - Between beats: `glitch` (≥ 3 s apart), `nosig` once per reel for the chapter change.
   - Furniture: `ticker([...])` fills the crawl for any length and returns the distance for `ambient()`.
4. One system graphic per beat carries the meaning. Anything that counts or lights up is built in CSS (bars, buildings, segments), not generated.
5. Set the lower-third headline, the ticker lines, the giant word and `KEY` (one or two short punch words per beat, as written in `words.json` after FIX/MERGE, punctuation included).
6. Longer reels (30–100 s): repeat the plate / lock / giant-word beats between `B.anchor` and `B.outro`. Never leave more than ~6 s without a graphic or a framing change.
7. Build, lint, snapshot every beat: the face is clear, no clipped Hebrew, no empty frame.

## Palette roles (only the 3 brand hexes `#111111` / `#F5F3EE` / `#E63B2E`, `rgba(17,17,17,a)` / `rgba(245,243,238,a)` and `color-mix` of `var(--red)`: `build.py` swaps exactly these for the creator's brand, so any other colour would stay fixed)
| Role | Value |
|---|---|
| Background, plates, chip fill | ink `#111111` (the screen interior is ink lifted by a 2.5 % paper layer + a paper glow `rgba(245,243,238,.20)`) |
| Wireframe lines, HUD text, caption text | paper `#F5F3EE` at 1, .75, .35 or .22 |
| Signal: LIVE, lock brackets, lit things, key words, the cursor | accent `#E63B2E`; tints via `color-mix(in srgb, var(--red) N%, transparent)` |
| Chroma fringe on the twin | accent ghost left + paper ghost right (`split(o)`) |
| Lower third strip, ticker | paper plate with ink text |

## Type system (local woff2 in `src/fonts`, declared in `src/fonts.css.html`)
- **IBM Plex Sans Hebrew 500/700:** captions, chips, the lower third and the ticker (all Hebrew).
- **Space Mono 400/700:** every Latin HUD string (LIVE, TC, CAM 01, TARGET, OFFLINE), numbers and Latin caption words (AI, 7, 10).
- **Rubik Glitch:** giant words behind the twin (`.giant`) and KEY words in the captions. It covers Hebrew and Latin.
- Write font families literally in CSS. `var(--mono)` inside `font:` makes the HyperFrames lint flag "font without @font-face".

## Staging the twin (exact numbers)
- **The monitor** is `#mon`, a cam-sized wrapper (`left:0; top:0; 1160×2000`) whose `clip-path: inset(...)` *is* the screen. Inside it, in order: `#scrbg` (glow), behind-twin content (giant words, radar), `#twin`, `#scan` (scanlines), `#roll` (rolling bar) and `#tear` (glitch bars). `#bez` sits outside and draws the frame, the inner CRT shadow, the accent corner brackets and the `CAM 01` / `● REC` labels.
- **Modes** (`mode(t, name, d)`; screen rects in px):
  - `mon`: 40,200 → 1040,1290 (round 34). The default anchor shot.
  - `split`: 130,860 → 950,1440 (round 28). The monitor drops to the lower half and a plate (map, chart) takes 230–800 above it.
  - `full`: full bleed, bezel off. Use it when a graphic stands *in front of* his torso (the city).
- **Framing:** use `tw(s, fx, fy)`, which puts the face centre (source 936,330) at screen (fx, fy).
  - Hook: `tw(1.0,540,600)`, pushing to 1.07.
  - Split: `tw(0.62,540,1092)`. This is the smallest he gets; keep it under about 4 s.
  - Off-centre for a side graphic: `tw(1.1,400,600)`.
  - Full with a city in front: `tw(1.0,540,470)`. The chin sits near y 650, so foreground graphics start at y ≥ 800.
- The twin always carries `TWF = split(5)`: a 5 px accent/paper chroma fringe. It is what separates a black hoodie from an ink background, so never drop it.

## Layout grid (screen px)
- Top HUD bar: y 100–160 (`#top`).
- Content: y 200–1460.
- Lower third: y 1312–1460 (`#lt`, hook only).
- Captions: y 1500–1670.
- Ticker: y 1838–1902 (`#tick`, decorative, sits in the platform UI zone).
- Overlays inside `#cam` use cam coordinates (screen + 40).

## Motion language (look.js)
- `tuneIn(sel,t)`: a 3-frame flicker on with a horizontal smear. This is the default entrance for chips and labels.
- `cutOut(sel,t)`: a CRT collapse to a line (scaleY .03) for one frame, then gone. This is the default exit.
- `slam(sel,t,out,from)`: a hard stepped entrance (`steps(4)`) for plates and names.
- `scanIn(sel,t,d)`: a top-to-bottom reveal in 6 steps, for maps and plates.
- `lockOn(sel,t,out)`: brackets snap from 1.9× to 1× in 4 steps, blink twice, then hold. The `.tag` is the label; put it under the target (`style="top:auto;bottom:-62px"`) when the space above is busy.
- `sp(id,t,frame)` / `spawn`: the element *transmits* out of his real hand: a dot, then a vertical beam, then a horizontal snap, then a stepped settle.
- `jitter(sel,t,out)`: a 1–2 px signal wobble every 0.12 s (this look's "boil").
- `blink`, `count`, `shake` (small, 12 px), `flash` (paper at .5 for 1–2 frames).
- `jolt(t,o)`: a 2-frame chroma kick on the twin, for punch words.
- `ambient(crawl)`: LIVE blink, timecode (rolls over correctly for any length), ticker crawl, scan roll, grain and a backdrop drift. `ticker(items, speed)` fills the crawl text and returns `crawl`.
- Rhythm: nothing eases in softly. Everything is steps, flickers and hard cuts. The only smooth motion is the slow push on the twin and the ticker.

## Transitions between beats
- `glitch(t,d,amp)`: about 0.24 s. The monitor jolts and skews, tear bars show, 3 datamosh macroblock layers (`buildBlocks(3)`, built once) cycle, and a heavy chroma split hits the twin. Then everything snaps back. Put the `mode()` change and the new `cut()` inside the glitch window.
- `nosig(t,d)`: a static burst, then colour bars in brand colours with `NO SIGNAL`. Use it for the big chapter change (once per reel). Switch the mode and the framing under the bars.
- `jolt` for in-beat punches. Don't glitch more often than about every 3 s.

## Captions (src/caps_A.css + signalCaptions in look.js)
- One centred terminal line at y 1500, ▸ prompt in accent on the right (RTL start), block cursor (`.cur`) blinking at the end.
- Each word types in char by char from its whisper start, at ≤35 ms per char.
- The active word gets an accent underline (`box-shadow inset`). KEY words switch to Rubik Glitch in accent at 104 px.
- Trailing punctuation is stripped for display but kept for chunking. Add `.`/`:` in `FIX` to force a break, and `MERGE` two tokens to keep a pair together. KEY entries must include that punctuation (`"AI."`).
- Numbers: FIX the spoken word to digits ("שבעה" → "7"), and they render in Space Mono.

## Sound palette (mix.py; gain = dB under the voice peak)
| Cue | Use | Gain |
|---|---|---|
| `ident` (new) | LIVE ident at 0.15 | 6 |
| `chirp` (new) | every data point appearing (dots, buildings, lights) | 14 |
| `static` (new) | every glitch cut and the signal loss | 8 |
| `sub` (new) | lock-ons that matter and the final name | 3.5 |
| `radar` (new) | radar sweep | 10 |
| `lock` (new) | `lockOn` | 9 |
| `glitch`, `scan`, `tick`, `ping`, `buzzer`, `powerdown`, `swipe`, `hit`, `count` (shared) | small glitches, scanIn, dots going dark, blips, the OFFLINE status, pulling the plug, a hand spawn, impacts, a ticker | library defaults |

## Signature compositions
1 and 3 are in the starter. 2 and 4 are in `example/index.src.html`.

1. **The broadcast hook (frame 0):** monitor plus a giant Rubik Glitch word *behind* him inside the screen, the BREAKING lower third (the headline is in CSS, so it shows at t=0), LIVE plus TC, and the ticker.
2. **Map blackout (split mode):** a keyed dot-matrix map plate above. Built in JS: `.gd` site dots ping online (chirps), then go dark one by one: a red flash, then a red ✕ (`.gx`), and a matching segment in the `#stat` bar dims. Named country chips tune in as theirs die. The status flips to OFFLINE, and the cause (the plug) transmits out of his hand.
3. **Radar lock:** in `mon` mode with the twin off-centre, a radar (rings plus a rotating conic sweep) sits behind him inside the screen. A blip pulses, then the subject slams in on the blip and the brackets lock with `TARGET: X`.
4. **Wireframe city in front of the anchor (full mode):** 10 CSS buildings (`.bld`, ink fill + paper window grid) rise in `steps(5)` from a ground line at y 1330, in front of his torso. `.lit` overlays light N of them in accent, while a counter spawned from his hand ticks. The foundation segments (`.seg`, accent with the shared label under the lit ones, hatched under the rest) step in. The brackets lock the foundation, then the name plate slams.

## Images
- Use `look/style.txt` (already in `reel.json` as `style_prompt`) (a broadcast-HUD wireframe: paper lines on flat ink, accent highlights).
- **Treatment:** key the ink out to alpha (`alpha = clip((max(rgb) − bg − 8)/90)`, then crop to the content) and show the result with the `.ph` class (a soft accent glow). No paper-cut and no white border. Plates (maps) get the same key and sit straight on the ink.
- Anything that needs to count, light up or be precise (buildings, bars, slabs) is built in CSS, not generated.

## Do / Don't
- **Do:**
  - Give every beat one system graphic that carries the meaning (a map, a city, a lock).
  - Keep the face clear; giant words go behind him inside `#mon`.
  - Use Hebrew labels on chips for meaning, with Latin mono as flavour.
- **Don't:**
  - Use paper backgrounds, torn edges, stamps or pill captions (that's the reserved flash look).
  - Ease things in softly.
  - Use any blue or green "hacker" colours.
  - Stack a lower third and captions while the split monitor is up.

## Gotchas hit
- The whisper beat break: the template `build.py` uses `starts + 0.15`, which split off the first word of beat 2 ("תחשבו" alone), because that word started 0.009 s after the beat start. The example uses `+0.05`; change it in `src/build.py` if a beat's first word ends up alone.
- The counter digit: padding "07" inside a right-aligned nowrap box pushed the leading 0 out of view. Use plain digits (`count` defaults to `pad = 1`).
- The chip, title and status overlaps on the map: Europe is dense. Place the chips in the oceans, move any site dot that sits under a chip, and keep the map title top-left.
- The radar's conic sweep reads as a hard wedge when a snapshot freezes it. That's expected; it's a moving sweep in the render.
- Rubik Glitch makes short Hebrew KEY words very wide (בכוונה at 104 px ≈ 330 px). Keep KEY chunks to one or two words.
- The twin's black hoodie vanishes on ink without `split()` and the `#scrbg` glow. Keep both on.
