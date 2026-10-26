// ===== SIGNAL look: helpers. Needs DUR, HANDS and a paused gsap timeline `tl` defined before this file. =====
// entrances never pre-render their from-state (never patch tl.fromTo/tl.from: the renderer hangs)
const ft = (s, f, t, p) => {
  const to = { immediateRender: false, ...t };
  if (f.opacity !== undefined && to.opacity === undefined && !to.keyframes) to.opacity = f.opacity;
  return tl.fromTo(s, f, to, p);
};
const fr = (s, f, p) => tl.from(s, { immediateRender: false, ...f }, p);
let seed = 59; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const E = { enter: "expo.out", pop: "back.out(2.4)", move: "power4.inOut", exit: "expo.in", hud: "steps(4)" };
const hide = (sel, t) => tl.set(sel, { opacity: 0 }, t);
const show = (sel, t) => tl.set(sel, { opacity: 1 }, t);

// ---------- the twin: face-anchored framing. Source face centre is (936,330) in the 1920x1080 twin.
// tw(s, fx, fy): put the face centre at SCREEN (fx, fy) at scale s.
const FACE = [936, 330];
const tw = (s, fx = 540, fy = 560) => ({ x: fx - FACE[0] * s, y: fy - FACE[1] * s, scale: s });
// chroma fringe in brand colours: accent ghost left, paper ghost right (the "RGB offset")
const split = (o = 5) => `drop-shadow(${-o}px 0 0 color-mix(in srgb, #E63B2E 78%, transparent)) drop-shadow(${o}px 0 0 rgba(245,243,238,.42))`;
let TWF = split(5);
const cut = (t, v) => tl.set("#twin", { ...v, opacity: 1, filter: TWF }, t);
const push = (t, v, d, ease = "none") => tl.to("#twin", { ...v, duration: d, ease }, t);

// ---------- monitor modes: screen rect (x1,y1,x2,y2 in SCREEN px) -> clip-path of #mon + bezel box + glow offset
const MODES = {
  mon:   { r: [40, 200, 1040, 1290], round: 34, bez: 1, gy: 0 },
  split: { r: [130, 860, 950, 1440], round: 28, bez: 1, gy: 560 },
  full:  { r: [0, 0, 1080, 1920], round: 0, bez: 0, gy: 0 },
};
const clipOf = (m) => { const [x1, y1, x2, y2] = m.r; return `inset(${y1 + 40}px ${1160 - (x2 + 40)}px ${2000 - (y2 + 40)}px ${x1 + 40}px round ${m.round}px)`; };
const mode = (t, name, d = 0.28) => {
  const m = MODES[name], [x1, y1, x2, y2] = m.r;
  const geo = { left: x1 + 40, top: y1 + 40, width: x2 - x1, height: y2 - y1, borderRadius: m.round };
  if (d) { tl.to("#mon", { clipPath: clipOf(m), duration: d, ease: E.move }, t); tl.to("#bez", { ...geo, opacity: m.bez, duration: d, ease: E.move }, t); }
  else { tl.set("#mon", { clipPath: clipOf(m) }, t); tl.set("#bez", { ...geo, opacity: m.bez }, t); }
  tl.set("#scrbg", { y: m.gy }, t);
};

// ---------- hands: stickers launched from the twin's real hand position
const hand = (f, i, g) => { const [hx, hy] = g[1][Math.min(i, g[1].length - 1)]; return [f.x + hx * f.scale, f.y + hy * f.scale]; };
const gesture = (t) => HANDS.reduce((a, b) => Math.abs(b[0] - t) < Math.abs(a[0] - t) ? b : a);
// SIGNAL spawn: the element "transmits" out of the hand: tiny bright dot -> stretched beam -> hard snap with a stepped settle
const spawn = (sel, t, f, cx, cy, i = 0, rot = 0) => {
  const [hx, hy] = hand(f, i, gesture(t));
  const dx = hx + 40 - cx, dy = hy + 40 - cy;
  ft(sel, { opacity: 0, x: dx, y: dy, scaleX: 0.04, scaleY: 0.04, rotation: rot },
    { keyframes: [{ opacity: 1, x: dx * 0.35, y: dy * 0.35, scaleX: 0.25, scaleY: 1.3, duration: 0.12, ease: "power2.out" },
                  { x: 0, y: 0, scaleX: 1.15, scaleY: 0.7, duration: 0.1, ease: "power2.in" },
                  { scaleX: 1, scaleY: 1, duration: 0.14, ease: E.hud }] }, t);
};
const sp = (id, t, f, rot = 0, out = null) => {
  const el = document.getElementById(id), L = parseFloat(el.style.left), T = parseFloat(el.style.top), Wd = parseFloat(el.style.width);
  const Hh = el.dataset.h ? +el.dataset.h : parseFloat(el.style.height) || Wd * +el.dataset.r;
  spawn("#" + id, t, f, L + Wd / 2, T + Hh / 2, 0, rot);
  if (out) jitter("#" + id, t + 0.4, out);
  if (out && out < DUR) cutOut("#" + id, out);
};

// ---------- motion language: things don't ease in, they TUNE in (stepped, flickering), and they cut out
// jitter: a 1-2 px signal wobble every 0.12 s (the HUD equivalent of stop-motion boil)
const jitter = (sel, t, out) => { for (let k = t; k < out - 0.08; k += 0.12) tl.set(sel, { x: Math.round(rnd() * 4 - 2), y: rnd() < 0.15 ? 2 : 0 }, k); };
// tuneIn: flicker on (0 -> .6 -> .2 -> 1) with a horizontal smear
const tuneIn = (sel, t, from = { scaleX: 1.25 }) => ft(sel, { opacity: 0, ...from },
  { keyframes: [{ opacity: 0.7, scaleX: 1, duration: 0.04 }, { opacity: 0.15, duration: 0.04 }, { opacity: 1, duration: 0.05 }], ease: "none" }, t);
// cutOut: one-frame collapse to a scanline (CRT power-off)
const cutOut = (sel, t) => { tl.to(sel, { scaleY: 0.03, scaleX: 1.15, duration: 0.07, ease: E.exit }, t); tl.set(sel, { opacity: 0 }, t + 0.07); };
// slam: hard entrance for stamps/cards, stepped settle
const slam = (sel, t, out, from = 1.7) => {
  ft(sel, { opacity: 0, scale: from }, { opacity: 1, scale: 1, duration: 0.16, ease: E.hud }, t);
  if (out < DUR) cutOut(sel, out);
};
// scan reveal: a top-to-bottom wipe in 6 steps (for plates, maps, panels)
const scanIn = (sel, t, d = 0.36) => { show(sel, t); ft(sel, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: d, ease: "steps(6)" }, t); };
// lock-on: brackets start loose and snap shut in 4 steps, then the tag types in
const lockOn = (sel, t, out, tag = null) => {
  ft(sel, { opacity: 0, scale: 1.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: E.hud }, t);
  for (let k = 0; k < 4; k++) tl.set(sel, { opacity: k % 2 ? 1 : 0.35 }, t + 0.32 + k * 0.05);
  tl.set(sel, { opacity: 1 }, t + 0.52);
  if (tag) typeIn(sel + " .tag", t + 0.1, tag, 0.16);   // fully typed by t+0.26, before the brackets settle (never caught half-typed)
  if (out < DUR) hide(sel, out);
};
// typeIn: types a string into an element, char by char
const typeIn = (sel, t, str, d = 0.4) => { tl.set(sel, { textContent: "" }, 0); const n = [...str].length; [...str].forEach((_, k) => tl.set(sel, { textContent: [...str].slice(0, k + 1).join("") }, t + d * k / n)); };
// blink: toggles opacity on a period (LIVE dot, cursors)
const blink = (sel, t, out, p = 0.5) => { for (let k = t; k < out; k += p) { tl.set(sel, { opacity: 1 }, k); tl.set(sel, { opacity: 0.15 }, k + p / 2); } };
// count: a number ticking up to `to` over d s (keep pad 1: a zero-padded digit in a right-aligned nowrap box gets pushed out of view)
const count = (sel, t, d, to, pad = 1) => { for (let k = 0; k <= 10; k++) tl.set(sel, { textContent: String(Math.round(to * k / 10)).padStart(pad, "0") }, t + d * k / 10); };
const shake = (t, a = 12) => tl.to("#cam", { x: `+=${a}`, y: `-=${a * 0.5}`, duration: 0.03, repeat: 5, yoyo: true, ease: "none" }, t);
const flash = (t) => { tl.set("#flash", { opacity: 0.5 }, t); tl.set("#flash", { opacity: 0 }, t + 0.05); };

// ---------- transitions
// macroblocks for datamosh: N divs of random accent / paper / ink rectangles, built once
const buildBlocks = (n = 3) => {
  const cam = document.getElementById("cam"), before = document.getElementById("flash");
  const cols = ["#E63B2E", "rgba(245,243,238,.75)", "#111111", "color-mix(in srgb, #E63B2E 45%, transparent)", "rgba(245,243,238,.25)"];
  for (let b = 0; b < n; b++) {
    const d = document.createElement("div"); d.className = "full mb"; d.id = "mb" + b;
    const layers = [];
    for (let k = 0; k < 16; k++) {
      const w = 40 + Math.round(rnd() * 380), h = 16 + Math.round(rnd() * 90), x = Math.round(rnd() * 1080), y = Math.round(rnd() * 1920), c = cols[Math.floor(rnd() * cols.length)];
      layers.push(`linear-gradient(${c},${c}) ${x}px ${y}px / ${w}px ${h}px no-repeat`);
    }
    d.style.background = layers.join(",");
    cam.insertBefore(d, before);
  }
};
// glitch: tear bars + monitor jolt + skew + macroblocks + heavy chroma split, for d seconds, then everything snaps back
const glitch = (t, d = 0.24, amp = 1) => {
  const n = Math.max(2, Math.round(d / 0.04));
  for (let k = 0; k < n; k++) {
    const s = t + k * 0.04;
    tl.set("#mon", { x: Math.round((rnd() * 2 - 1) * 46 * amp), skewX: (rnd() * 2 - 1) * 9 * amp }, s);
    tl.set("#tear", { opacity: 1, backgroundPosition: `0px ${Math.round(rnd() * 400)}px`, x: Math.round((rnd() * 2 - 1) * 30) }, s);
    tl.set("#twin", { filter: split(14 + Math.round(rnd() * 22 * amp)) }, s);
    for (let b = 0; b < 3; b++) tl.set("#mb" + b, { opacity: (k + b) % 3 === 0 ? 0.9 : 0 }, s);
  }
  const e = t + n * 0.04;
  tl.set("#mon", { x: 0, skewX: 0 }, e); tl.set("#tear", { opacity: 0 }, e); tl.set("#twin", { filter: TWF }, e);
  for (let b = 0; b < 3; b++) tl.set("#mb" + b, { opacity: 0 }, e);
};
// jolt: a 2-frame chroma kick on the twin only (for punch words)
const jolt = (t, o = 26) => { tl.set("#twin", { filter: split(o) }, t); tl.set("#twin", { filter: split(Math.round(o / 2)) }, t + 0.04); tl.set("#twin", { filter: TWF }, t + 0.08); };
// signal loss: static burst -> brand colour bars with NO SIGNAL -> back
const nosig = (t, d = 0.22) => {
  for (let k = 0; k < 3; k++) tl.set("#static", { opacity: 0.85, backgroundPosition: `${Math.round(rnd() * 256)}px ${Math.round(rnd() * 256)}px` }, t + k * 0.03);
  tl.set("#static", { opacity: 0 }, t + 0.09);
  show("#bars", t + 0.09); hide("#bars", t + d);
};

// ---------- ticker: fills #tick .run with the items (separated by an accent ▪), repeated until it covers the crawl.
// Returns the crawl distance in px for ambient(). Speed is px per second, so it reads the same at 15 s and at 100 s.
const ticker = (items, speed = 70) => {
  const run = document.querySelector("#tick .run"), crawl = Math.round(speed * DUR);
  const one = items.map((x) => x + "<em>▪</em>").join(""), chars = items.join("").length + items.length * 3;
  const reps = Math.max(2, Math.ceil((1100 + crawl) / Math.max(1, chars * 19)) + 1);   // ~19 px per char at 36 px
  run.innerHTML = one.repeat(reps);
  return crawl;
};

// ---------- ambient: LIVE blink, timecode, ticker crawl, scan roll, grain, hum
const pad2 = (n) => String(n).padStart(2, "0");
const ambient = (crawl = 900, tc0 = 17 * 3600 + 42 * 60 + 6) => {
  blink("#top .live i", 0, DUR, 0.6);
  for (let k = 0; k < DUR; k += 0.08) {
    const f = Math.floor(k * 25) % 25, s = tc0 + Math.floor(k);
    tl.set("#top .tc", { textContent: `TC ${pad2(Math.floor(s / 3600) % 24)}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}:${pad2(f)}` }, k);
  }
  ft("#tick .run", { x: 0 }, { x: crawl, duration: DUR, ease: "none" }, 0);
  for (let k = 0; k < DUR; k += 2.4) ft("#roll", { y: -300 }, { y: 1960, duration: 2.4, ease: "none" }, k);
  for (let k = 0; k < DUR; k += 0.1) tl.set("#grain", { backgroundPosition: `${Math.round(rnd() * 512)}px ${Math.round(rnd() * 512)}px` }, k);
  ft("#bg", { backgroundPosition: "0px 0px, 0px 0px, 0px 0px" }, { backgroundPosition: "0px 60px, 0px 120px, 0px 120px", duration: DUR, ease: "none" }, 0);
};

// ---------- captions: a terminal line. Words TYPE in char by char at their spoken time, a block cursor rides the end.
// caps: [[word, start], ...] chunks from build.py; KEY: punch words (as in words.json, punctuation included)
const signalCaptions = (caps, KEY) => {
  const box = document.getElementById("caps");
  caps.forEach((chunk, i) => {
    const d = document.createElement("div"); d.className = "cap"; d.id = "cap" + i;
    const p = document.createElement("span"); p.className = "pr"; p.textContent = "▸"; d.appendChild(p);
    chunk.forEach(([w], j) => {
      const s = document.createElement("span");
      const shown = w.replace(/[.,:!?]+$/, "");
      s.className = "w" + (/^[\x00-\x7F×]+$/.test(shown) ? " lat" : "") + (KEY.has(w) ? " key" : "");
      s.id = `cw${i}_${j}`; s.dataset.full = shown; d.appendChild(s);
    });
    const c = document.createElement("span"); c.className = "cur"; d.appendChild(c);
    box.appendChild(d);
    const start = chunk[0][1], end = i + 1 < caps.length ? Math.min(caps[i + 1][0][1], chunk[chunk.length - 1][1] + 1.2) : DUR;
    tl.set(d, { opacity: 0 }, 0);
    tl.set(d, { opacity: 1 }, start - 0.04);
    chunk.forEach(([w, s], j) => {
      const el = `#cw${i}_${j}`, full = [...d.children[j + 1].dataset.full], nx = j + 1 < chunk.length ? chunk[j + 1][1] : end;
      tl.set(el, { textContent: "", attr: { "data-on": "0" } }, 0);
      const dt = Math.min(0.035, Math.max(0.012, (nx - s) * 0.5 / full.length));
      full.forEach((_, k) => tl.set(el, { textContent: full.slice(0, k + 1).join("") }, s + dt * k));
      tl.set(el, { attr: { "data-on": "1" } }, s); tl.set(el, { attr: { "data-on": "0" } }, nx);
    });
    if (i + 1 < caps.length) tl.set(d, { opacity: 0 }, end - 0.02);
  });
  blink(".cur", 0, DUR, 0.4);
};
