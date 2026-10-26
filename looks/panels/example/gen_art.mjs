// Panels v2 demo art pack: every panel is real inked art (no code-drawn props).
// usage: node gen_art.mjs            all items
//        node gen_art.mjs gag1,tomb   only these
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";

const DIR = "{{PROJECT}}";
const KEY = needKey("GEMINI_API_KEY", "aistudio.google.com/apikey");
const OUT = `${DIR}/web`;
const only = process.argv[2] ? process.argv[2].split(",") : null;
const STYLE = JSON.parse(fs.readFileSync(`${DIR}/reel.json`, "utf8")).style_prompt;   // the look style with the creator colours filled in
const PLAIN = "Isolated on a completely plain, flat, empty #F5F3EE paper background with a wide empty margin all round, no ground, no shadow on the background.";

// people are generic (not real persons)
const items = {
  cover: ["Full-bleed comic-book cover splash: a vast night city seen from street level in steep worm's-eye perspective, a colossal glowing monolith-like AI core rising between the skyscrapers and splitting the sky, searchlight beams crossing, paper debris and sparks swirling, a crowd of tiny silhouettes looking up in awe at the bottom. The upper third is open dark sky (room for a title).", "9:16"],
  star: ["A sleek, slightly menacing humanoid robot head and shoulders, three-quarter view, one glowing eye, cables like hair, a confident sly smirk, dramatic rim light. Centred, filling the frame, background solid ink black with a red halftone glow behind the head.", "1:1"],
  gag1: ["A generic tired office worker (not a real person) slumped at a desk buried under towering stacks of paperwork at night, a weak desk lamp, coffee cups everywhere, sweat drops, eyes half closed. Seen from a slightly high angle. Tall vertical comic panel composition.", "9:16"],
  gag2: ["The same kind of generic office worker (not a real person) jolted upright in shock, face lit from below by a glowing laptop screen, papers flying off the desk, motion lines, jaw dropped. Close, dramatic low angle. Tall vertical comic panel composition.", "9:16"],
  gag3: ["A generic office worker (not a real person) leaning back relaxed with hands behind the head and feet on the desk, smug grin, while several sleek robotic arms sort and stamp the paperwork at blazing speed around him. Tall vertical comic panel composition.", "9:16"],
  rip: ["A moonlit graveyard on a hill at night: a huge full moon, twisted bare trees, drifting fog, crooked distant crosses, a clear empty patch of ground in the centre foreground (something will stand there). Wide cinematic comic panel, deep spotted blacks.", "5:4"],
  tomb: [`A single old cracked stone tombstone with a rounded top, slightly tilted, moss and chips, a big blank flat face with NO engraving and no text at all, heavy ink rendering and halftone shading. Front view, full object visible. ${PLAIN}`, "3:4"],
  reveal: [`A brand-new glowing laptop bursting upward out of rubble, radiant light rays and sparks exploding from its screen, flying stone chunks. Full object visible. ${PLAIN}`, "1:1"],
  grid1: ["Close-up comic panel: a smartphone exploding with notification bubbles flying out of the screen, a hand gripping it, motion lines.", "3:4"],
  grid2: ["Close-up comic panel: a stylised human brain wired with glowing circuit lines, crackling with electric sparks.", "3:4"],
  grid3: ["Close-up comic panel: a rocket blasting off from a laptop keyboard, thick smoke clouds and fire, steep angle.", "3:4"],
  splash: ["Dynamic action splash panel: a generic hero (not a real person) in a hoodie bursting through a wall of falling paperwork, slashing it apart with a giant glowing stylus like a sword, papers shredding in an arc, extreme foreshortening.", "5:4"],
  meanwhile: ["Establishing comic panel: a big city clock tower at dusk with the hands near midnight, birds scattering, dramatic clouds, speed and wind lines suggesting time racing.", "4:5"],
  crowd: ["Tall narrow comic panel: a tight cluster of generic shocked faces (not real people) staring up and pointing, mouths open, sweat drops, dramatic under-lighting.", "9:16"],
  studio: ["An inked creator's studio interior at night as a comic-panel background, seen straight on: a desk with a microphone arm, a desk lamp glow, shelves with books and a plant, a window with distant city lights. Low contrast, mostly mid-tones and light hatching, open and uncluttered in the centre (a person will be placed in front of it), nothing in sharp focus.", "4:5"],
  action: ["A pure comic-book action background: explosive radial speed lines drawn in brush ink bursting from a point in the lower centre, on a red halftone field, with a few flying debris specks. No figures, no objects.", "4:5"],
  sfx_pow: [`Hand-drawn comic-book sound-effect lettering of the word "POW!" in huge bold chunky 3D letters with heavy ink outlines and a red fill, an explosive jagged burst shape behind it, slight perspective. ${PLAIN}`, "4:3"],
  sfx_krak: [`Hand-drawn comic-book sound-effect lettering of the word "KRAK!" in huge cracked, splintering 3D letters with heavy ink outlines and a paper-white fill with red shadows, shards flying off. ${PLAIN}`, "4:3"],
  sfx_slash: [`Hand-drawn comic-book sound-effect lettering of the word "SLASH!" in huge italic, speed-stretched 3D letters with heavy ink outlines and a red fill, a sharp slash streak through them. ${PLAIN}`, "4:3"],
  sfx_zoom: [`Hand-drawn comic-book sound-effect lettering of the word "ZOOM!" in huge 3D letters receding in strong perspective with speed trails, heavy ink outlines, red fill. ${PLAIN}`, "4:3"],
};

fs.mkdirSync(OUT, { recursive: true });
await Promise.all(Object.entries(items).filter(([k]) => !only || only.includes(k)).map(async ([name, [subj, ratio]]) => {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent?key=${KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${STYLE}\n\nSubject: ${subj}` }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: ratio, imageSize: "2K" }, thinkingConfig: { thinkingLevel: "MEDIUM" } },
        }),
      });
      const j = await r.json();
      const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (part) { fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(part.inlineData.data, "base64")); console.log(name, "ok"); return; }
      console.log(name, "retry", r.status, JSON.stringify(j).slice(0, 160));
    } catch (e) { console.log(name, "error", e.message); }
    await new Promise((s) => setTimeout(s, 5000));
  }
}));
