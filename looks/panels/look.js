// ===== PANELS look helpers. Inlined by build.py as {{LOOKJS}}, after tl / ft / rnd / HANDS / DUR are defined.
// All coordinates are page px (1080x1920), the same as the root and #caps.

// ---- geometry
const PX = (pts) => "polygon(" + pts.map(([x, y]) => `${+x.toFixed(1)}px ${+y.toFixed(1)}px`).join(", ") + ")";
// twin framing: his head centre lands at x = hx, the desk line (source y 1030) at y = by. Mouth = source (960, 410).
const F = (s, hx = 770, by = 1910) => ({ x: hx - 960 * s, y: by - 1030 * s, scale: s });
const mouthOf = (f) => [f.x + 960 * f.scale, f.y + 410 * f.scale];
// a panel is a quad [TL, TR, BR, BL]. Every twin clip has 8 points so any two can tween:
// TL, tab-left on edge, tab-left top, tab-right top, tab-right on edge, TR, BR, BL. tab = [x1, x2, yTop] or null.
const edgeY = (q, x) => q[0][1] + (q[1][1] - q[0][1]) * (x - q[0][0]) / (q[1][0] - q[0][0]);
const tabPts = (q, tab) => {
  const m = (q[0][0] + q[1][0]) / 2, [x1, x2, yt] = tab || [m, m, null];
  const y1 = edgeY(q, x1), y2 = edgeY(q, x2);
  return [q[0], [x1, y1], [x1, yt ?? y1], [x2, yt ?? y2], [x2, y2], q[1], q[2], q[3]];
};
const clipT = (q, tab) => PX(tabPts(q, tab));
const clipB = (q) => PX(tabPts(q, null));
const QZ = [[40, 1880], [1040, 1880], [1040, 1880], [40, 1880]];   // a twin panel collapsed into its bottom edge

// ---- the twin in his panel
let CUR = null;
const stageTwin = (t, q, f, tab = null) => {
  tl.set("#tpan", { clipPath: clipB(q) }, t); tl.set("#twc", { clipPath: clipT(q, tab) }, t);
  tl.set("#twin", { x: f.x, y: f.y, scale: f.scale }, t);
  CUR = { q, tab, f };
};
// morph panel + reframe him together: this is the "camera travels to the next panel" move
const moveTwin = (t, q, f, tab = null, d = 0.34, ease = "power4.inOut") => {
  ft("#tpan", { clipPath: clipB(CUR.q) }, { clipPath: clipB(q), duration: d, ease }, t);
  ft("#twc", { clipPath: clipT(CUR.q, CUR.tab) }, { clipPath: clipT(q, tab), duration: d, ease }, t);
  ft("#twin", { x: CUR.f.x, y: CUR.f.y, scale: CUR.f.scale }, { x: f.x, y: f.y, scale: f.scale, duration: d, ease }, t);
  CUR = { q, tab, f };
};
const drift = (t, f, d) => { ft("#twin", { x: CUR.f.x, y: CUR.f.y, scale: CUR.f.scale }, { x: f.x, y: f.y, scale: f.scale, duration: d, ease: "none" }, t); CUR = { ...CUR, f }; };
// panel paper behind him: one of the #tpan layers is visible at a time
// one attribute switch (not a group opacity set: those drifted under out-of-order seeking)
const panelBg = (t, id) => tl.set("#tpan", { attr: { "data-bg": id.replace("#", "") } }, t);
// the speech-bubble zone beside his head. side "r": the bubble hugs the right edge and its tail points right-down to the mouth
const bubAt = (t, L, T, W, H = 240, side = "r") => tl.set("#caps", { left: L, top: T, width: W, height: H, attr: { "data-side": side } }, t);

// ---- hands
const hand = (f, i, g) => { const [hx, hy] = g[1][Math.min(i, g[1].length - 1)]; return [f.x + hx * f.scale, f.y + hy * f.scale]; };
const gesture = (t) => HANDS.reduce((a, b) => Math.abs(b[0] - t) < Math.abs(a[0] - t) ? b : a);
// spawn an element from his real hand: it arcs up, overshoots and lands in its CSS spot
const spawnP = (sel, t, f, cx, cy, rot = 0, i = 0) => {
  const [hx, hy] = hand(f, i, gesture(t)), dx = hx - cx, dy = hy - cy;
  ft(sel, { opacity: 0, x: dx, y: dy, scale: 0.08, rotation: rot - 40 },
    { keyframes: [{ opacity: 1, x: dx * 0.45, y: dy * 0.45 - 180, scale: 0.6, rotation: rot - 12, duration: 0.16, ease: "power2.out" },
                  { x: 0, y: 0, scale: 1.1, rotation: rot + 4, duration: 0.15, ease: "power2.in" },
                  { scale: 1, rotation: rot, duration: 0.12, ease: "back.out(3)" }] }, t);
};
const spP = (id, t, f, rot = 0, out = null) => {
  const el = document.getElementById(id), L = parseFloat(el.style.left), T = parseFloat(el.style.top), W = parseFloat(el.style.width);
  const H = el.dataset.h ? +el.dataset.h : parseFloat(el.style.height);
  spawnP("#" + id, t, f, L + W / 2, T + H / 2, rot);
  if (out) { twos("#" + id, t + 0.45, out, rot); tl.set("#" + id, { opacity: 0 }, out); }
};

// ---- motion language: snaps, punches, holds "on twos"
const twos = (sel, t, out, rot = 0, a = 1.2) => { for (let k = t; k < out - 0.05; k += 0.083) tl.set(sel, { rotation: rot + (rnd() * 2 - 1) * a, x: rnd() * 4 - 2, y: rnd() * 4 - 2 }, k); };
// a panel or box snaps into the page (3 frames, overshoot)
const slam = (sel, t, out = null, rot = 0, from = 1.22) => {
  ft(sel, { opacity: 0, scale: from, rotation: rot - 2 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.14, ease: "back.out(3)" }, t);
  if (out) tl.set(sel, { opacity: 0 }, out);
};
// onomatopoeia: punches past full size, settles, jitters on twos, pops out
const ono = (sel, t, out, rot = -8) => {
  ft(sel, { opacity: 0, scale: 0.2, rotation: rot - 25 },
    { keyframes: [{ opacity: 1, scale: 1.35, rotation: rot + 6, duration: 0.09, ease: "power2.out" }, { scale: 1, rotation: rot, duration: 0.12, ease: "back.out(3)" }] }, t);
  twos(sel, t + 0.25, out, rot, 1.6);
  ft(sel, { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.3, duration: 0.09, ease: "power2.in" }, out - 0.09);
};
const shake = (t, a = 14) => tl.to("#cam", { x: `+=${a}`, y: `-=${a * 0.7}`, duration: 0.035, repeat: 5, yoyo: true, ease: "none" }, t);
const flash = (t, a = 0.45) => { tl.set("#flash", { opacity: a }, t); tl.set("#flash", { opacity: 0 }, t + 0.034); };   // one soft frame: a stronger flash reads as a glitch
const whip = (t, d) => { tl.set("#whip", { opacity: 1 }, t + 0.04); tl.set("#whip", { opacity: 0 }, t + d - 0.04); };
const count = (sel, t, d, to, fmt) => { for (let k = 0; k <= 14; k++) tl.set(sel, { textContent: fmt(Math.round(to * Math.pow(k / 14, 2))) }, t + d * k / 14); };
const fmtN = (n) => n.toLocaleString("en-US");

// ---- page transitions (Hebrew reads right to left, so the camera travels LEFT: pages slide right)
const travel = (t, from, to, d = 0.34) => {
  ft(from, { x: 0 }, { x: 1180, duration: d, ease: "power4.inOut" }, t); tl.set(from, { opacity: 0 }, t + d);
  ft(to, { opacity: 1, x: -1180 }, { x: 0, duration: d, ease: "power4.inOut" }, t);
  whip(t, d);
};
// turn a page (cover -> first page): it lifts off its left edge toward the camera, around the right-hand spine
const turnPage = (t, from, to, d = 0.42) => {
  tl.set(to, { opacity: 1, x: 0 }, t);
  ft(from, { rotationY: 0, transformPerspective: 2600, transformOrigin: "100% 50%" }, { rotationY: 104, duration: d, ease: "power2.in" }, t);
  tl.set(from, { opacity: 0 }, t + d);
};
// dive into one panel of the page until it becomes the next page
const zoomInto = (t, from, to, ox, oy, d = 0.34, k = 7.5) => {
  ft(from, { scale: 1, transformOrigin: `${ox}px ${oy}px` }, { scale: k, duration: d, ease: "expo.in" }, t);
  // the next page grows in under the dive (crossfade over the second half), so no gutter or empty band ever shows
  ft(to, { opacity: 0, x: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: d * 0.5, ease: "power2.out" }, t + d * 0.5);
  ft(from, { opacity: 1 }, { opacity: 0, duration: d * 0.45, ease: "power1.in" }, t + d * 0.55);
};

// ---- RIP stone: crack line draws, the halves fall apart, the burst behind rises
const crack = (id, t) => ft(`#${id} .crk`, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.24, ease: "power2.out" }, t);
const split = (id, t, a = 15) => {
  ft(`#${id} .half.l`, { x: 0, y: 0, rotation: 0 }, { x: -100, y: 34, rotation: -a, duration: 0.3, ease: "power3.out" }, t);
  ft(`#${id} .half.r`, { x: 0, y: 0, rotation: 0 }, { x: 100, y: 34, rotation: a, duration: 0.3, ease: "power3.out" }, t);
  tl.set(`#${id} .crk`, { opacity: 0 }, t);
};
const dropIn = (sel, t, d = 0.22) => {
  ft(sel, { opacity: 1, y: -900 }, { y: 0, duration: d, ease: "power3.in" }, t);
  ft(sel, { scaleY: 1, scaleX: 1 }, { keyframes: [{ scaleY: 0.88, scaleX: 1.07, duration: 0.05 }, { scaleY: 1, scaleX: 1, duration: 0.14, ease: "back.out(3)" }] }, t + d);
};
// ambient: speed lines that run, the "page" breathing
const run = (sel, t, d, dx = 400) => ft(sel, { backgroundPosition: "0px 0px" }, { backgroundPosition: `${dx}px 0px`, duration: d, ease: "none" }, t);
