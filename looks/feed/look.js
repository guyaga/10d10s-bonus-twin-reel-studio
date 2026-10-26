      // ===== FEED look helpers (needs tl, ft, HANDS, hand, gesture from the page) =====
      // A rect is the call bubble in canvas px: {x, y, w, h, r}. A view is the twin transform {x, y, scale}.
      // Face centre in presenter.webm px. HeyGen twins sit near (938, 320); if yours sits elsewhere, define
      // `const TWIN_FACE = [x, y];` in the page before {{LOOKJS}} (measure it on one frame of presenter.webm).
      const FACE = typeof TWIN_FACE !== "undefined" ? TWIN_FACE : [938, 320];
      const VIEW = (R, s, fy = 0.42) => ({ x: R.x + R.w / 2 - FACE[0] * s, y: R.y + R.h * fy - FACE[1] * s, scale: s });
      const clipOf = (R) => `inset(${R.y}px ${1080 - R.x - R.w}px ${1920 - R.y - R.h}px ${R.x}px round ${R.r}px)`;
      const ringOf = (R) => ({ left: R.x + 40, top: R.y + 40, width: R.w, height: R.h, borderRadius: R.r });
      // the starting bubble is also written in CSS (frame 0 = thumbnail); callInit pins it at t=0, and every
      // move after that is an explicit fromTo from the previous state, so out-of-order seeks hold
      let CALL = null;
      const callInit = (R, V) => {
        CALL = { R, V };
        tl.set("#callclip", { clipPath: clipOf(R) }, 0);
        tl.set("#ring", ringOf(R), 0);
        tl.set("#twin", { x: V.x, y: V.y, scale: V.scale }, 0);
      };
      const dock = (t, R, V, d = 0.5, ease = "expo.inOut") => {
        const a = CALL;
        ft("#callclip", { clipPath: clipOf(a.R) }, { clipPath: clipOf(R), duration: d, ease }, t);
        ft("#ring", ringOf(a.R), { ...ringOf(R), duration: d, ease }, t);
        ft("#twin", { x: a.V.x, y: a.V.y, scale: a.V.scale }, { x: V.x, y: V.y, scale: V.scale, duration: d, ease }, t);
        CALL = { R, V };
        return V;
      };
      // a card or tile grows out of his real hand (twin view f, hand i from HANDS), UI-clean: no wobble, expo settle.
      // The element needs inline left/top/width (cam px) and data-h (its height).
      const emerge = (id, t, f, i = 0, rot = 0, d = 0.5) => {
        const el = document.getElementById(id), L = parseFloat(el.style.left), T = parseFloat(el.style.top), Wd = parseFloat(el.style.width);
        const Hh = el.dataset.h ? +el.dataset.h : parseFloat(el.style.height);
        const [hx, hy] = hand(f, i, gesture(t));
        const dx = hx + 40 - (L + Wd / 2), dy = hy + 40 - (T + Hh / 2);
        ft("#" + id, { opacity: 0, x: dx, y: dy, scale: 0.12, rotation: rot - 8 },
          { opacity: 1, x: 0, y: 0, scale: 1, rotation: rot, duration: d, ease: "expo.out" }, t);
      };
      // notification banner: drops from above the status bar, leaves by flicking up at `out` (omit to keep it)
      const notify = (sel, t, out) => {
        ft(sel, { opacity: 0, y: -260, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.4)" }, t);
        if (out) ft(sel, { y: 0, opacity: 1 }, { y: -300, opacity: 0, duration: 0.3, ease: "power3.in" }, out);
      };
      // UI pop for chips, rows and bubbles
      const pop = (sel, t, from = 0.6, d = 0.32) => ft(sel, { opacity: 0, scale: from }, { opacity: 1, scale: 1, duration: d, ease: "back.out(2)" }, t);
      const rise = (sel, t, dy = 60, d = 0.35) => ft(sel, { opacity: 0, y: dy }, { opacity: 1, y: 0, duration: d, ease: "expo.out" }, t);
      const out = (sel, t, d = 0.15) => ft(sel, { opacity: 1 }, { opacity: 0, duration: d, ease: "power2.in" }, t);
      const back = (sel, t, d = 0.25) => ft(sel, { opacity: 0 }, { opacity: 1, duration: d, ease: "power2.out" }, t);
      // feed swipe: the current post leaves up, the next enters from below (same duration, so they read as one scroll)
      const swipeOut = (sel, t, d = 0.42) => { ft(sel, { y: 0, opacity: 1 }, { y: -2100, opacity: 1, duration: d, ease: "power3.in" }, t); tl.set(sel, { opacity: 0 }, t + d + 0.01); };
      // swipeIn also keeps caption room: a matching clip-path cuts the card at the caption line (CAPS_LINE, cam px) while it
      // travels up, so it never slides under the caption chips. The bottom inset is linear in y, so one tween with the
      // same ease tracks the move exactly; it ends slightly negative, leaving the card's shadow down to the line.
      const CAPS_LINE = 1640;   // cam y of the caption band's top (caps_A.css top:1622 canvas, minus a hair) - cards end above it
      const swipeIn = (sel, t, d = 0.5) => {
        ft(sel, { y: 1500, opacity: 1 }, { y: 0, opacity: 1, duration: d, ease: "expo.out" }, t);
        const el = document.querySelector(sel); if (!el) return;
        const T = parseFloat(el.style.top) || el.offsetTop, H = +el.dataset.h || parseFloat(el.style.height) || el.offsetHeight;
        const cut = (Y) => `inset(-120px -120px ${Math.round(T + H + Y - CAPS_LINE)}px -120px)`;
        ft(sel, { clipPath: cut(1500) }, { clipPath: cut(0), duration: d, ease: "expo.out" }, t);
      };
      // finger indicator: tap = press + ripple, swipe = drag up
      const tap = (sel, t) => { ft(sel, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out" }, t); ft(sel, { scale: 1, opacity: 1 }, { scale: 0.8, opacity: 0, duration: 0.25, ease: "power2.in" }, t + 0.2); };
      const flickUp = (sel, t, dist = 700, d = 0.36) => { ft(sel, { opacity: 0, y: 0 }, { opacity: 1, y: -dist * 0.15, duration: 0.08 }, t); ft(sel, { y: -dist * 0.15, opacity: 1 }, { y: -dist, opacity: 0, duration: d, ease: "power2.in" }, t + 0.08); };
      // story mode on/off: the phone chrome swaps for story chrome (#sbars progress, #shead, #reply); the status bar turns ink.
      // Pair it with a dock() to the STORY rect (on) or back to a bubble (off), in the same half second.
      const storyOn = (t, fill = 3) => {
        ft("#sbar", { color: "#F5F3EE" }, { color: "#111111", duration: 0.3 }, t + 0.14);
        out("#abar", t + 0.04, 0.2); out("#rtag", t + 0.04, 0.15); out("#homebar", t + 0.04, 0.2);
        rise("#sbars", t + 0.34, -20); rise("#shead", t + 0.39, -20); rise("#reply", t + 0.44, 30);
        ft("#sfill", { width: "0%" }, { width: "100%", duration: fill, ease: "none" }, t + 0.34);
      };
      const storyOff = (t) => {
        ["#sbars", "#shead", "#reply"].forEach((s) => swipeOut(s, t, 0.4));
        ft("#sbar", { color: "#111111" }, { color: "#F5F3EE", duration: 0.25 }, t + 0.18);
        back("#abar", t + 0.33); back("#rtag", t + 0.48, 0.2); back("#homebar", t + 0.33, 0.2);
      };
      // number tickers: from -> to over d seconds, eased, in n steps of textContent
      const cnt = (sel, t, d, from, to, fmt, n = 24, pw = 2) => { for (let k = 0; k <= n; k++) tl.set(sel, { textContent: fmt(from + (to - from) * (1 - Math.pow(1 - k / n, pw))) }, t + d * k / n); };
      const step = (v) => (Math.abs(v) >= 1e5 ? 1000 : Math.abs(v) >= 1e3 ? 10 : 1);   // big tickers roll in round steps
      const num = (v) => (Math.round(v / step(v)) * step(v)).toLocaleString("en-US");
      const usd = (v) => "$" + num(v);
      const times = (v) => "×" + Math.max(1, Math.round(v));
      const pct = (v) => (v >= 0 ? "+" : "") + num(v) + "%";
      // call timer in the bubble tag (m:ss, any length), and the bell badge
      const clock = (sel, from, to) => { for (let s = Math.ceil(from); s <= to; s++) tl.set(sel, { textContent: String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0") }, s); };
      const badge = (sel, t, n) => { tl.set(sel, { textContent: String(n) }, t); ft(sel, { scale: 1.5 }, { scale: 1, duration: 0.25, ease: "back.out(3)" }, t); };
      const jolt = (sel, t, a = 14) => ft(sel, { x: 0 }, { x: a, duration: 0.04, repeat: 5, yoyo: true, ease: "none" }, t);
      // chart from data: builds the paths of a .chartc card's <svg viewBox="0 0 920 520"> (ids p+"l1", p+"l2", p+"area",
      // p+"dot", p+"rect") from DATA = [[label, value], ...]; the last `hot` segments are the accent breakout.
      // Returns { drawCold(t, d), drawHot(t, d), end: [x, y] }. The shape must be the creator's real numbers.
      const chartBuild = (p, DATA, hot = 1) => {
        const $ = (s) => document.getElementById(p + s);
        const vs = DATA.map((r) => r[1]), lo = Math.min(0, ...vs), hi = Math.max(...vs) || 1;
        const P = DATA.map(([, v], k) => [Math.round(20 + k / Math.max(1, DATA.length - 1) * 880), Math.round(500 - (v - lo) / (hi - lo) * 450)]);
        const cut = Math.max(1, P.length - 1 - hot), C = P.slice(0, cut + 1), H = P.slice(cut);
        const d1 = "M" + C.map((q) => q.join(" ")).join(" L"), d2 = "M" + H.map((q) => q.join(" ")).join(" L");
        $("l1").setAttribute("d", d1); $("l2").setAttribute("d", d2);
        $("area").setAttribute("d", "M" + P.map((q) => q.join(" ")).join(" L") + ` L${P[P.length - 1][0]} 500 L${P[0][0]} 500 Z`);
        const L1 = $("l1").getTotalLength(), L2 = $("l2").getTotalLength(), END = P[P.length - 1], MID = C[C.length - 1][0];
        tl.set("#" + p + "l1", { attr: { "stroke-dasharray": L1, "stroke-dashoffset": L1 } }, 0);
        tl.set("#" + p + "l2", { attr: { "stroke-dasharray": L2, "stroke-dashoffset": L2 } }, 0);
        tl.set("#" + p + "dot", { attr: { cx: END[0], cy: END[1] } }, 0);
        tl.set("#" + p + "rect", { attr: { width: 0 } }, 0);
        return {
          end: END,
          drawCold: (t, d) => {
            ft("#" + p + "l1", { attr: { "stroke-dashoffset": L1 } }, { attr: { "stroke-dashoffset": 0 }, duration: d, ease: "power1.inOut" }, t);
            ft("#" + p + "rect", { attr: { width: 0 } }, { attr: { width: MID }, duration: d, ease: "power1.inOut" }, t);
          },
          drawHot: (t, d) => {
            ft("#" + p + "l2", { attr: { "stroke-dashoffset": L2 } }, { attr: { "stroke-dashoffset": 0 }, duration: d, ease: "power2.in" }, t);
            ft("#" + p + "rect", { attr: { width: MID } }, { attr: { width: 940 }, duration: d, ease: "power2.in" }, t);
            pop("#" + p + "dot", t + d - 0.05, 0.2, 0.3);
          },
        };
      };
