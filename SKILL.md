---
name: twin-reel-studio
description: Make vertical "digital twin" reels (9:16, 30–100 s) for TikTok, Instagram Reels and YouTube Shorts starring the user's own HeyGen avatar in their own cloned voice, staged inside a full motion-design "look": Signal (a live news broadcast), Panels (a comic book) or Feed (the reel is a phone screen). Graphics spawn from the twin's real hand moves, captions light up word by word, and every look has its own sound design. It works in any language (Hebrew first-class) with the user's brand colours. First run sets up a creator profile (avatar, voice, colours, look, CTA). Use when the user wants a reel, short, TikTok or Instagram video with their digital twin or AI avatar, a "talking avatar video with graphics", a news explainer, tip, "N signs of" list, testimonial or personal-story reel, or asks to set up or change their twin reel profile. Not for 16:9 long explainers or a plain talking-head clip with no graphics.
---

# Twin Reel Studio

A reel is: a script in beats → narration in the creator's cloned voice → their HeyGen twin lip-synced to it on a transparent background → hand tracking → images and short clips in the look's style → a HyperFrames composition in the chosen look (the twin is staged inside it, graphics spawn from the hands, captions light up word by word) → a mix balanced against the voice → a file ready to post.

## The looks

A look is a complete design language, not a colour theme: how the twin is staged, the layout, the type, the motion, the transitions, the captions and the sounds. Each lives in `S/looks/<name>/`:
- `LOOK.md`: the design system.
- `starter.html`.
- `look.css` / `look.js`.
- Fonts and sounds.
- `example/`: a finished test reel.

| Look | The reel is… | Best for |
|---|---|---|
| `signal` | A live news broadcast: the twin in the studio monitor, BREAKING banner and ticker, HUD graphics, glitch cuts, terminal-typed captions. | News, "this just happened", warnings, tech and security stories. |
| `panels` | A comic book: a cover, a camera that moves panel to panel, speech-bubble captions pointing at the mouth, SFX lettering. | Opinions, "N signs of", lists, myths, humour. |
| `feed` | A phone screen: the twin on a video call, notifications, a live counter or auction, story mode, a group chat, a chart that shoots up. | Trends, money, numbers, social stories, "everyone is talking about". |

Suggest the look that fits the topic; the profile's `look` is only the default. ("Look" here is the reel's design; the HeyGen avatar's look is `heygen.look_id`.)

`S` below is this skill's folder (`~/.claude/skills/twin-reel-studio`). Run Python with `-I`, and on Windows add `-X utf8` whenever it prints non-Latin text.

## 0. Install and first run (the user pasted the install prompt)

Speak the user's language (usually Hebrew), one step at a time, in plain words. Wait for them after every step that
needs their hands. The user may not be technical: never ask them to type commands, run them yourself.

The profile lives at `~/.twin-studio/profile.json` (outside the skill, so updates never touch it). It is shared with
the `twin-studio` skill, so a member who set up one skill is already set up for the other: keep it and fill in only
what's missing (`look`, `header`, `cta`, `clips.tool`).

**Step 1: free tools.** Install whatever is missing, without asking. All of it is free.

| Tool | Check | Windows (winget) | Mac (Homebrew) |
|---|---|---|---|
| git | `git --version` | `winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements` | `xcode-select --install` |
| Python 3.10–3.12 | `python --version` (Mac: `python3`) | `winget install --id Python.Python.3.12 -e --silent --accept-source-agreements --accept-package-agreements` | `brew install python@3.12` |
| ffmpeg, Node 22+ | `ffmpeg -version`, `node -v` | setup.py installs them | setup.py installs them |

- On a Mac without Homebrew, install it first (https://brew.sh), and tell the user the Mac may ask for their password.
- After a winget install, the new tool is often not on PATH in this session. Call it by its full path, e.g.
  `%LOCALAPPDATA%\Programs\Python\Python312\python.exe`, or ask the user to restart Claude Code and paste the prompt again.
- On Windows, if `python` opens the Microsoft Store or prints nothing, that is the Store stub: use the full path above.
- Prefer Python 3.12: `mediapipe` (hand tracking) is often late to support the newest Python.

**Step 2: the skill.** Clone the repo into `~/.claude/skills/twin-reel-studio`, or `git pull` there if it already exists.

**Step 3: setup.** `python -I -X utf8 S/scripts/setup.py`. It installs the Python packages, ffmpeg and Node, downloads
the models (Whisper for captions about 1.5 GB, the cut-out model about 180 MB, once), creates the profile, tests the
keys, and ends with READY or NOT READY. Safe to run again. Fix every `[!!]` line it prints, then run it again.

**Step 4: keys.** Keys live in `~/.twin-studio/.env` (or in environment variables). Every script, Python and Node, reads them from there.
- Run `creator.py keys`. It opens that file in Notepad / TextEdit with an empty line per key. The user pastes the keys
  there and saves, so a key never passes through the chat.
- Then `creator.py check`: it tests each key against its service (free) and shows the HeyGen API wallet.
- If the user pastes a key into the chat anyway, write it into the `.env` file for them, and say in one line that the
  file is the safer place next time. Never print a key back.

| Key | Needed | Where |
|---|---|---|
| `HEYGEN_API_KEY` | Required | HeyGen → Settings → API. The API wallet is separate from the HeyGen plan: Add funds ($10–15 to start). |
| `GEMINI_API_KEY` | Required | aistudio.google.com/apikey (Day 1 of the course). Billing must be on for images. |
| `ELEVEN_API_KEY` | Recommended | ElevenLabs → Developers → API Keys (Day 5). Cloning a voice needs Starter or higher. |

**Step 5: the twin and the voice.**
- `creator.py looks` lists the user's own avatars. Offer them in one AskUserQuestion (names, not IDs) and save the choice.
  - Empty list: they create the twin in HeyGen first (Avatars → Create avatar). A twin from a video needs a short
    consent recording: they read a code to the camera, in good light, face to the camera. A photo avatar needs none.
  - Prefer a landscape look: the composition frames the twin from a 16:9 render.
- `creator.py voices` lists their cloned voices, ElevenLabs first (provider `elevenlabs`, model `eleven_v4`: far more
  natural, especially in Hebrew). HeyGen's own voice (provider `heygen`) is the fallback.

**Step 6: the rest** in one AskUserQuestion round:
- Name or handle.
- Language.
- Brand colours: ink, paper, accent, as 6-digit hex. If they don't have them, offer the default black / off-white / red.
- Default look: show the table above (signal / panels / feed).
- The small header line.
- Their CTA (or none).
- Where projects go (a folder they can find).
- Which image-to-video tool they have, if any (Dreamina / Kling / fal / Higgsfield / none).

Save it all with one `creator.py set` call (it rejects a bad colour or option and says why):
```bash
python -I -X utf8 S/scripts/creator.py set name="Dana" language=he direction=rtl heygen.look_id=<id> \
  voice.provider=elevenlabs voice.voice_id=<id> brand.accent=#FF5A1F look=panels \
  header="AI FIELD NOTES" cta="..." projects_root=D:/reels clips.tool=none
```
- Use `direction=ltr` for any language that isn't written right to left.
- The user's own rules ("never say X", "always both genders") go in `rules` as a JSON list. Read them before every script.

**Step 7: prove it.** Run `setup.py` again until it says READY, then `scripts/selftest.py --out <projects_root>/selftest`.
It starts a real project in their default look with a stand-in figure in their colours, builds it, lints it and takes
two snapshots in headless Chrome, with no paid step. The first run downloads HyperFrames and its Chrome. Show the user
the snapshots, then offer the first real reel (plan and price first).

Once the profile exists, don't ask these again. Run `creator.py show` to recall it. A change is one `creator.py set`
call, and it applies to the next new reel.

**Errors** come out as one `[!!]` line plus a `fix:` line. Explain them in plain words and do the fix yourself when you can.

## 1. The rules (read before writing any script)

1. **Clear for a stranger.**
   - The viewer has never seen the creator's other videos and doesn't know their tools, products or community.
   - Say what a thing is before you talk about it.
   - Read every line as a stranger would: what is this, and why should I care?
   - If a fact or context is unclear, ask the user rather than guess.
2. **Informative, with punch.**
   - Each point gets the move plus the real problem or the "why", in one or two plain sentences, not just a label.
   - Lead with the hook. The first frame is also the thumbnail.
3. **Plan first, then spend.**
   - Write `PLAN.md` in the project: the full script, a visual idea per beat, and the paid steps with an estimate (HeyGen seconds, clips).
   - Wait for the user's OK.
   - Give the length honestly. Spoken Hebrew runs about 0.45 s per word, English about 0.38 s, before the 1.09× speed-up at the end.
4. **Their voice.**
   - Write in the creator's natural spoken register: everyday words, short sentences, no clichés.
   - The user's own terms beat yours.
   - If a writing or copy skill is installed for their language, use it.
5. **CTA:** use the profile's `cta`, and only where it fits the reel. Don't end on "write in the comments". A critique reel can end on its own punchline.
6. **People:**
   - Caricatures stay generic, never a real person.
   - Show more than one gender when the subject is a type of person.
   - Hide names, phone numbers and faces of other people in any screenshot.
7. **Facts:** check every claim, number and date against a primary source before it goes into a script. Put the sources in `PLAN.md`.

Proven shapes for a reel (list, news explainer, personal story, testimonial, tip) are in `references/formats.md`.

## 2. Start a project

```bash
python -I S/scripts/new_reel.py <reel-name> --look feed     # -> <projects_root>/<reel-name>; --look defaults to the profile's
```

This does three things:
- Copies `template/`.
- Lays the look over it: `src/index.src.html` from its starter, its captions, fonts and sounds, and `look/` with `LOOK.md`.
- Writes `reel.json`: the profile frozen for this reel, plus the look's image style prompt. Every script reads `reel.json`, so a profile change never breaks an old project, and a one-off change goes in that reel's `reel.json`. **Read `look/LOOK.md` before you plan the visuals:** each beat's visual idea in `PLAN.md` should use that look's signature moves.

## 3. Voice

- Write the beats in `gen_beats.mjs`: one string per idea, 2–4 sentences each. Then run `node gen_beats.mjs`.
- It voices each beat, speeds it up by `voice.tempo` (1.1), cuts pauses longer than 0.25 s down to 0.18 s, and stitches the beats with a 0.25 s lead, 0.3 s gaps and a 1.2 s tail.
- It prints `starts` (beat start times) and `total` into `audio/timing.json`. To re-voice only some beats: `node gen_beats.mjs 2,5`.
- **Pronunciation:**
  - Spell risky foreign words the way they should sound, in the narration language's letters (Hebrew: `צ'אט ג'י פי טי` for ChatGPT, `אֶן אֶף טִי` for NFT).
  - Keep short brand words that the voice already says well (AI, Claude) in Latin.
- Then `python -I -X utf8 words.py`: word timings with faster-whisper into `audio/words.json`. It prints the transcript; read it against the script.
  - Spelling differences are fixed in `src/build.py` `FIX` / `MERGE`.
  - A real wrong word may be a TTS slip: tell the user which word to check by ear.

## 4. The twin (HeyGen)

```bash
python -I S/scripts/twin.py --audio audio/narration.mp3 --webm --out twin     # run it in the background: ~10 min for 90 s
```

- **Cost:** HeyGen API credits, about $0.12 per second at the time of writing. Say the estimate before running.
- Keep the `avatar_v` engine; `avatar_iv` tends to over-grin.
- Copy the result to `presenter.webm` in the project root.
- **Hands:**
  ```bash
  ffmpeg -c:v libvpx-vp9 -i presenter.webm -vf fps=10,scale=960:540 track/f_%04d.png
  cd track && python -I hands.py
  ```
  This prints gesture moments; the look's spawn helper then launches graphics from the real hand position.
- **Splicing or extending the twin** (a new last line, or a pause held on a screenshot):
  1. Build it from separate inputs with `concat`: the trimmed part, a looped still (`-loop 1 -framerate 25 -t N`), then the rest.
  2. **Remux with `-c copy`.** A re-encoded VP9 keeps the old duration in its header, and the renderer silently drops the twin past it.
  3. Shift the narration, `timing.json` and every later cue by the same N.

## 5. Art: images, plates, clips

The image style comes from the look (`reel.json` `style_prompt`, from `look/style.txt`). `LOOK.md` says how images are treated in that look (cut out, framed, duotone…). Keep to 10 images or fewer.

- **Images:**
  1. List the props in `gen_img.mjs` `items`, one subject each, ending in "No text." unless the text is the point. Run `node gen_img.mjs` (all in parallel, about 30 s).
  2. A full-screen plate (a skyline, a room) takes its own ratio: `city: ["subject", "9:16"]`. Copy it straight into `img/` and use it as a panel, not a cutout.
  3. `python -I papercut.py bell.png=bell:shape mug.png=mug` turns `web/` into `img/` paper-cut stickers (rembg cutout, scissor-cut paper border, hard shadow). `shape` keeps the outline (people, animals); the default `hull` suits boxy objects.
  4. **Make a contact sheet and look at it** before using anything.
- **Clips (optional, `clips.tool`):** animate 2–4 of the best stickers or plates with image-to-video, at 9:16, 5 s. Trim the best 1.5–4 s into `img/<name>.mp4` (speed it up if it drifts). They play as full-screen panels inside the look's frame.
  - **Dreamina CLI** (Seedance 2.5):
    1. Every command needs `--project-id <clips.project_id> --non-interactive`. Create a canvas first if the profile has none.
    2. `resource upload --file web/x.png`.
    3. `node create video --mode m2v --model seedance_2.5 --ratio 9:16 --resolution 720P --duration 5 --ref res:<id> --prompt "Animate in the exact illustration style of the reference..." --run --wait --yes`.
    4. If create returns an invalid-response error but the job shows as accepted, wait on that job id. Never resubmit, or you pay twice.
    5. `resource download <id> -o clips/x.mp4`.
  - **Kling / fal / Higgsfield:** use their skill or CLI with the same idea: the sticker as the start frame, at 9:16, with a prompt that keeps the exact style.
  - **None:** use Ken Burns moves on plates instead (a slow scale and pan in the timeline).

## 6. Composition (HyperFrames 0.6.82, Node 22)

- **Start from the look's starter:** `src/index.src.html` already has:
  - the look's chrome
  - the twin staging
  - the caption system
  - a short demo timeline with one example of each signature move

  Replace every `// REPLACE` line with this reel's content, beat by beat.
- **The look's rules:** `look/LOOK.md` has the framing numbers, the helpers, the transitions, the caption system and the sound palette.
  - The helpers live in `look/look.js`, injected at `{{LOOKJS}}`.
  - The look's finished test reel is in `S/looks/<look>/example/` (composition, cues, image and sound prompts). Copy patterns from it.
- **Every beat needs a visual that carries its meaning.** At least one element per beat should come out of the twin's real hand position (`HANDS`).
- **Captions:**
  - `src/build.py` builds them from `words.json`: chunks of up to 3 words, broken after punctuation, at a pause over 0.3 s, at beat starts, and before a `NUM` word.
  - Fix whisper's spelling with `FIX` (heard → written), `MERGE` (split tokens) and `AT` (a fix for one position only).
  - Punch words go in `KEY` in the page.
- **Brand:**
  - Every look is written in black `#111111` / paper `#F5F3EE` / red `#E63B2E`, plus `rgba(17,17,17,a)`, `rgba(245,243,238,a)` and `color-mix` of `var(--red)`.
  - `build.py` swaps them for the profile colours, and sets the text direction for LTR languages. Never add another hue.
  - The look's fonts cover Latin and Hebrew. Other scripts need their own woff2 in `src/fonts` and `fonts.css.html`.
- **Process:**
  1. `python -I -X utf8 src/build.py`. It warns about duplicate ids.
  2. `cd comp && npx hyperframes@0.6.82 lint` must report 0 errors.
  3. `npx hyperframes@0.6.82 snapshot --at t1,t2,... --describe false --timeout 15000`, then **look at every snapshot** before rendering.

### Gotchas (each one cost a full cycle)

- **The renderer seeks out of order** (workers start mid-timeline), so "this tween hasn't started yet" is not a hidden state.
  - Every overlay class or id must be in the t=0 `opacity:0` list, or get its own CSS `opacity:0`.
  - Snapshots don't show this bug. QA the rendered mp4 itself (step 7).
- **Never reuse one element across far-apart moments** (an opening panel that returns at the end, a sticker shown twice). The second use simply never shows. Give it its own element (`lock2`, `bell2`). The same goes for a sticker shown at a different position, because spawn helpers read the position once.
- **The first frame is the thumbnail.** A panel that must show at t=0 gets its visibility from CSS (no `.panel` class, not in the t=0 hide list). A set or tween at exactly 0 still renders frame 0 empty.
- **Ids:**
  - Captions own the ids `cap<i>` and `cw<i>_<j>`; never give an overlay an id like `c4` or `w3_1`.
  - Never give an inner element the class `full`, `panel` or `sheet`: those are global layout classes.
  - Every `<video data-start>` needs its own `id`, or it renders frozen.
- **GSAP and the renderer:**
  - Never reassign `tl.fromTo` / `tl.from`, or the renderer hangs. Use the `ft` / `fr` helpers.
  - Call only helpers the look defines. Lint passes on an undefined function, but the render throws.
- **Layout:**
  - The face and mouth are never covered by graphics or captions.
  - Keep cards clear of the look's header or app bar.
  - Big words and numbers go behind the twin (earlier in the DOM than `#twin`) and away from cards.
  - An accent-coloured element vanishes on an accent-coloured sheet; switch it to ink while that sheet is up.

## 7. Render, mix, check, deliver

- **Memory:** check free RAM first.
  - Close leftover `chrome-headless-shell` processes. Ask the user before closing any of their own apps.
  - Normal: `npx hyperframes@0.6.82 render --quality high --fps 30 --workers 2 --browser-timeout 120 -o ../video.mp4`, run in the background (about 6 min for 90 s).
  - Under about 8 GB free, or after a killed render: run it in the foreground with `--low-memory-mode` instead of `--workers 2`. Tell the user before restarting a killed render.
- **Mix:** list every visual event in `mix.py` `cues` as `(sfx, time)`, then run `python -I mix.py`.
  - The look's own sounds are already in `audio/`, with their gains in `look/sfx.json`. `LOOK.md` says which sound goes with which move.
  - The shared library and the music bed are in `S/assets/sfx/`.
  - New sounds come from `gen_sfx.mjs`. They're picked up automatically; give each a gain in `under`.
  - Gains are measured against the voice (ebur128), not set by ear.
  - The mix speeds picture and sound up 1.09× together, so lip-sync holds, and writes `reel.mp4`. Aim for about -19 LUFS.
- **Check the real file:**
  - A 1.5 fps contact sheet: `ffmpeg -i reel.mp4 -vf fps=1.5,scale=180:-1,tile=8x8 qa.png`. Look at it for leaks, empty panels, overlaps and caption collisions.
  - Grab one frame inside each clip panel to confirm it plays.
  - If a video-analysis skill is installed, have it check for overlapping titles and mistimed captions too. Fix, re-render, re-check.
- **Deliver:**
  - Report the path, the duration, the loudness and any word to check by ear.
  - Offer a light copy for messaging apps: `-c:v libx264 -b:v 3000k -maxrate 3300k -bufsize 6000k -c:a aac -b:a 128k` (use 2300k past about 70 s).
  - Suggest a caption and the first-frame text for the post.
