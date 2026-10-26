# Look: PANELS (graphic-novel comic book)

## The idea
The reel is a comic book. The twin lives inside a comic panel, and the page layout changes on every beat while the camera travels from panel to panel, right to left (Hebrew reading order). The hook is the issue's cover. Captions are speech bubbles beside his head. The talking points become comic panels with villains, onomatopoeia and gags.

**Use it for** opinion pieces, "N signs of…" lists, myth-busting, villain/hero framings and anything with a caricature or a gag. **Avoid it for** sober news, grief or very technical walkthroughs (screenshots look odd in a comic).

## Files
- **Start here:** `src/index.src.html` is a copy of the look's `starter.html`. It holds the head, the cover, the page/panel camera, the twin staging, the bubble captions, the transitions and the "to be continued" outro tied to `DUR`, plus a ~10 s demo timeline (one example of every helper). Everything marked `REPLACE` is demo content.
- **Full worked example:** `example/` in the skill (`looks/panels/example/`): a finished 22 s reel (timing, `mix.py` cues, `gen_sfx.mjs`), plus `gen_art.mjs`, the art-pack generator for the current quality bar. The example reel predates the art rule below: copy its timing, not its code-drawn props. Its `{{PROJECT}}` paths are placeholders.
- `art/`: the demo art pack the starter shows.
- `look.css`: theme. It is inlined by `build.py` as `{{LOOKCSS}}`.
- `look.js`: helpers. It is inlined as `{{LOOKJS}}` after `tl / ft / rnd / HANDS / DUR`.
- `style.txt`: the image prompt.
- `src/caps_A.css`: the speech-bubble captions.

## Make a new reel in this look
1. Read the script's beats (`audio/timing.json` `starts`). One beat = one page. Set `B2…B6` in the page (add or drop pages); keep the last page as the hold page and the outro at `DUR - 1.6`.
2. **Cover (frame 0):** masthead (Bangers, Latin, ≤ 10 letters), corner box, the Rubik hook with the topic word in `<em>`, the starring circle (an image or the "?"), the teaser burst. Frame 0 comes from CSS: if you change `Q1/F1/TAB1`, update the three `#tpan/#twc/#twin` CSS lines to match.
3. **Per page/beat, write these blocks:**
   - HTML: a `.pg` (later pages first in the DOM) with 1–6 `.pp` panels shaped by `clip-path:polygon(..px)` above y ≈ 800–900, and the beat's FX in `#fx` (or `#fxu` for hand spawns).
   - JS: the transition (`turnPage` only cover → page 1, `travel` by default, `zoomInto` to dive from a grid), `moveTwin(t, Q, F)` at the same t, `panelBg`, `bubAt`, the beat's events, a closing `drift`.
   - `mix.py` cues: every `ono()` gets a sound, every `travel()` a whoosh, `flip` on the page turn and the outro. The starter's last comment lists the demo's cues.
4. **Which helper for what:**
   - a panel/box/cell arrives → `slam`; a word-sound → `ono` (+ `shake`, `flash` on big hits);
   - a thing he "produces" → `spP(id, t, F)` from his hand (put it in `#fxu` so it flies behind his head); pick t when his hand is up in `track/hands.json`;
   - a list → numbered `.cell`s + `zoomInto` into a splash page with the giant numeral;
   - something dies/ends → the RIP stone: `dropIn` + THUD, `crack`, `split`, the `.rev` burst;
   - a number → `count` in an `.nbox`; momentum → `.spd` + `run`; a question → the punch-in `moveTwin(t, Q, F(1.3, 690, 2140), tab)` + giant "?";
   - anything that must stay alive to the end → `twos(sel, t, DUR)`.
5. Captions: fill `KEY` (red, bigger), `SKIP` (chunks the cover title already says), `BURST` (quotes, screams). Fix spellings in `build.py` `FIX`/`MERGE`; add a sentence's first word to `NUM` if chunks merge across sentences.
6. Build (`python -I -X utf8 src/build.py`: no duplicate ids), `npx hyperframes lint`, snapshot every beat, check: face never covered, no clipped Hebrew, frame 0 strong, no empty frames.

## Palette roles
- **Ink `#111111`:**
  - The page background. The gutters are simply the ink showing between panels.
  - All outlines and lettering.
- **Paper `#F5F3EE`:**
  - Panel paper, bubbles, narrator boxes, gravestones.
- **Accent `#E63B2E`:**
  - Ben-Day print and cover/splash pages.
  - SFX fills, key words and the active word.
- **Surfaces** (`look.css`):
  - `.bd-red`: red with paper dots.
  - `.bd-redk`: red with ink dots.
  - `.bd-paper`: paper with red dots.
  - `.bd-ink`: ink with paper dots.
  - `.rays`: sunburst. Set `--rx/--ry` to its centre.
- Never add a hue. Images are generated in the same three inks.

## Type
| Role | Font | Notes |
|---|---|---|
| Onomatopoeia, masthead, numbers, Latin labels | **Bangers** (Latin only) | `.ono`: paper fill, 12px ink stroke, stacked ink extrusion. `.ono.red`. `.ono.xr` = red extrusion. |
| Hebrew SFX / cover title | **Rubik 900** | `.ono.he` |
| Bubbles, narrator boxes, gravestones | **Secular One** (Hebrew + Latin) | captions 62px, key words 76px |
| spare condensed Hebrew | Karantina 700 (loaded, unused here) | |

All are local woff2 files in `src/fonts/` (`p_*.woff2`), declared at the end of `src/fonts.css.html`.

## Staging the twin (exact numbers)
- **Layers:** `#tpan` (panel paper, clipped) sits under `#twc` (the twin, clipped), both full-page inside `#stage`. Page coords = root coords (1080×1920).
- **Panel:** a quad `[TL, TR, BR, BL]`. Slant the top edge by 20–70px between pages.
  - Standard twin panel: x 40→1040, top edge y 830–980, bottom 1880.
  - 22px ink gutter to the story tier above.
- **Framing:** `F(s, hx, by)` puts his head centre at x = `hx` and the desk line at y = `by`.
  - Standard: `F(1.0, 760–790, 1910)`, which puts the face at about 620–930 × 990–1330.
  - Close-up punch: `F(1.3, 690, 2140)` with a head tab.
  - Cover: `F(1.12, 560, 1900)`.
  - Keep s ≥ 0.95 so the lips read.
- **Head tab, on every panel:** `[x1, x2, yTop]`, about 60px wider than his hair either side and ~150px above the panel top, lets his head break out over the panel edge. Never pass `null`: a lean or a punch-in then crops his hair. Check the head region of the rendered mp4 at 4 fps.
  - Cover: `[380, 740, 830]` with the panel top at about 1100. His head pops over the cover art. This is the thumbnail.
- **Story tier:** y 110–800/900 holds 1–6 panels (`.pp` full-page divs shaped with `clip-path:polygon(..px)`).
- **Header:** the y 0–100 ink band (`#hdr`).
- **Outline:** a 5px ink outline on the twin (`#twin` filter).

## Motion language (`look.js`)
- **Snaps, not glides:** panels and boxes `slam()` in over 3 frames with an overshoot.
- **SFX:** `ono()` punches to 1.35× and settles, jitters "on twos" (`twos()`, 12 fps) and pops out at 1.3×.
- **Spawns from his hand:** `spP(id, t, framing, rot, out)` (uses `HANDS`): tags, props, bursts. Put spawned elements in `#fxu` (between his panel paper and the twin) so the flight passes behind his head; the landing spot must be outside his panel.
- **Twin moves:**
  - `stageTwin(t, q, f, tab)`: hard set.
  - `moveTwin(t, q, f, tab, d)`: the panel morphs and he reframes in the same 0.34s `power4.inOut`.
  - `drift(t, f, d)`: a slow push.
- **Panel paper:** `panelBg(t, "#tbP"|"#tbR"|"#tbK")`.
- **Caption zone:** `bubAt(t, L, T, W, H, side)` moves the bubble zone. Its right edge sits about 20px left of his face. Set it at every framing change.
- **Others:** `shake`, `flash`, `count`, `dropIn` (fall + squash), `crack`/`split` (stones), `run` (speed lines).

## Transitions
1. `turnPage(t, from, to)`: the cover lifts off its left edge around the right-hand spine (rotationY 104°, 0.4s). Use it only cover → page 1.
2. `travel(t, from, to)`: the camera pans left. The old page slides out right and the new one in from the left (0.34s), with `#whip` speed lines. Run it with `moveTwin` at the same t. This is the default between beats.
3. `zoomInto(t, from, to, ox, oy)`: dive into one panel (scale 7.5, `expo.in`) until it becomes the next page. Use it for "N signs" → sign 1, from a numbered grid of panels. His panel morphs at the same time; never collapse it over his face.

## Captions (`src/caps_A.css` + caption loop in the page)
- **Bubble:** each chunk is a `.cap` holding a paper `.bb` oval with a 7px ink border and an offset shadow. The tail points right-down to the mouth (`data-side="l"` mirrors it).
- **Words:**
  - Ink Secular One, Latin words too (Bangers' slanted I read as "/"). The bubble is `direction:rtl` and every `.w` is `unicode-bidi:isolate`, so mixed Hebrew + Latin chunks keep spoken order and punctuation stays with its word (checked: "בהקטון AI של", "בקבוצה GPT?", "כל Claude היה").
  - The active word turns red.
  - `KEY` words are red with a stroke, at 76px.
- **Burst bubble:** a chunk starting with a word in `BURST` (quotes, screams) becomes a jagged red burst with paper text and no tail.
- **SKIP:** a chunk starting with a word in `SKIP` gets no bubble. Use it when the cover title already says it.
- **build.py:**
  - `NUM` also forces breaks before a sentence's first word (e.g. "ככה", "אבל") so sentences don't merge.
  - If the narration is cut mid-word, drop words starting in the last 0.3s (`W = [w for w in W if w[1] < T["total"] - 0.3]`, as in `example/build.py`).

## Sound palette (`mix.py`, dB under the voice peak)
**New for this look** (`audio/sfx_*.mp3`, in `LOCAL`):

| Sound | dB under | Used for |
|---|---|---|
| boing | 8 | inflate/deflate gags |
| punch | 5 | slams and SFX hits |
| whoosh | 11 | every page travel |
| crack | 5 | stone cracks |
| gasp | 9 | the reveal |
| flip | 9 | page turn, "to be continued" |

**From the shared library:**
- pop, ping (spawns landing)
- slap (panel slams)
- tick (sequential panels and the dots)
- taiko (THUD)
- scratch (the "?" freeze)
- kaching, scream (gag SFX)
- count (counters)
- rip (stones split)
- whip, swipe (slashes, flights)

Rule: every `ono()` gets a sound, and every `travel()` gets a whoosh.

## Signature compositions
1. **The cover (frame 0):**
   - Red Ben-Day page with a rotating sunburst.
   - Masthead in Bangers with extrusion, issue corner box ("#1 / ISSUE").
   - Rubik 900 Hebrew title with the topic word in red. It inflates on its key word (boing).
   - Villain or hero in a "starring" circle with a label, and a jagged teaser bubble.
   - His head breaks out of the panel (head tab). Starter framing: `F(1.12, 700, 1900)`, tab `[420, 960, 600]`, bubble zone `bubAt(0, 40, 1050, 520)` left of his face.
2. **Three-panel gag:**
   - Three slanted tall panels, one per clause, each with the villain image, an in-panel bubble, an SFX that breaks the gutter and a narrator caption.
   - Show the empty panel slots first (35% paper) so the layout reads.
3. **Grid → dive:** six numbered panels slam in on "six signs", then the camera dives into panel 1 and it becomes the sign's splash page (giant "1", narrator boxes, villain panel, SLASH).
4. **RIP stones that crack open:**
   - CSS gravestones (two clipped `.half` faces plus a `.crk` SVG) drop with THUD.
   - On the turn the crack draws, the halves split and a red/paper burst rises behind them (an image on plain paper with multiply, or a big word). Then a Hebrew SFX and a gasp.
5. **Record-scratch "?":** punch-in to `F(1.3)` with his head breaking the panel, and a giant Bangers "?".
6. **"To be continued…"** ink box at `DUR - 1.6` (flip): the reel ends like an issue.
7. **Hold page:** the last page keeps speed lines (`run`) and `twos` jitter running to `DUR`, so a long last beat never freezes.

## Art (the quality bar: a published graphic novel)
**Every panel is real inked art. Nothing on the page is drawn in code:** no CSS moons, gravestones, sunbursts, empty grey slots, "IMAGE" boxes or "?" circles. A panel that shows a shape instead of art reads as a wireframe.
- **The demo pack** is in `art/` (copied into every new project; `build.py` ships it to `assets/art/`). The starter already shows it, so the template looks finished. Replace every image with this reel's own art.
- **Make the art** with `example/gen_art.mjs` (copy it to the project root; it reads `reel.json` `style_prompt`, i.e. `style.txt` in the creator's colours). One entry per panel, with the panel's aspect ratio: tall gag panels `9:16`, wide pages `5:4`, grid cells `3:4`, the cover `9:16` with the top third as open sky for the title.
- **Prompt rules:** a concrete scene, a dramatic camera angle, generic people only ("not a real person"), and "No lettering, letters or text anywhere in the image" except for SFX art.
- **Free-standing pieces** (a prop that drops in, a reveal, a tombstone) and **SFX lettering** (POW!, KRAK!, SLASH!, ZOOM!: generate the word as drawn lettering) go on plain paper (`Isolated on a completely plain, flat, empty paper background with a wide empty margin`), then `python -I keyout.py name1 name2` cuts them out to `art/<name>.png`. It removes only the paper connected to the border, so white inside the object stays.
- **Place:** full panels as `<img class="art" ...>` with `object-fit:cover`; an unrevealed panel is the same art with `class="art dim"`; SFX art in a `.sfx` wrapper (an ink outline, so red letters still read on a red page).
- **His panel's background** is art too: an inked room behind him (`#tbS`) or brush speed lines (`#tbA`); switch with `panelBg(t, "#tbS")`. The Ben-Day colour fills (`#tbP`, `#tbR`) are only a fallback.
- **Budget:** about 15–20 images per reel (about $0.10 each). Look at every image before using it; regenerate any with stray text or off-palette colour.
- **Head tabs on every panel** (see Staging): his head breaks out over the art, never cropped.

## Do / don't
- **Do:**
  - Change the layout every beat.
  - Keep the 22px ink gutters.
  - Let SFX and spawns break panel borders.
  - Put a narrator box in the panel when the image alone is ambiguous.
  - Show more than one gender among the caricatures.
- **Don't:**
  - Use rubber stamps, red pill captions or torn sheets (that's the flash look).
  - Wipe or collapse his panel over his face.
  - Put a bubble or SFX over his mouth.
  - Shrink him below s 0.95.

## Gotchas hit
- **Group opacity sets drifted under out-of-order seeking.** `tl.set("#tpan > *", {opacity:0})` followed by an id set left the panel paper missing on a later page. Switch the layer with one attribute (`data-bg`) and CSS instead.
- **A CSS `rotate() scaleX(0)` can't be decomposed by GSAP.** The slash lost its angle. Give rotation and scale in the tween itself.
- **`stroke-dashoffset` with `pathLength` + `vector-effect:non-scaling-stroke` showed dash fragments.** Reveal the crack with `clip-path:inset()` instead.
- **Inflating the cover title past ~1.08× clips at the frame edges.** Keep wide titles ≤ 1040px at peak scale.
- **The corner box and the rotated title collide.** The rotation raises the right end by ~25px, so leave 30px.
- **Collapsing his panel during the zoom-through cut his face for 0.4s.** Morph straight to the next quad instead.
- **Whisper chunking can merge across sentences** ("כלום ככה", "צפיות אבל"). Add the next sentence's first word to `NUM`.
- **A hand spawn in `#fx` flew across his eye** (the arc rises from his hand through his head). Spawns go in `#fxu`, under the twin.
- **On the cover the bubble covered his mouth** when his head sat at x 560. Keep the cover head at x ≈ 700 and the bubble zone ≤ 520 wide.
- **A giant "?" at the top of a splash page hid the narrator box.** Keep big SFX clear of `.nbox` text; drop it into the panel art.
