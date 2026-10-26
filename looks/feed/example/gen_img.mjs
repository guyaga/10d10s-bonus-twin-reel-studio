// Stickers and plates with Nano Banana 2.1, one image per prop, in the creator's style (reel.json style_prompt), on plain paper for the cutout step.
// usage: node gen_img.mjs            all items
//        node gen_img.mjs bell,city  only these
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";

const DIR = "{{PROJECT}}";
const R = JSON.parse(fs.readFileSync(`${DIR}/reel.json`, "utf8"));
const KEY = needKey("GEMINI_API_KEY", "aistudio.google.com/apikey");
const OUT = `${DIR}/web`;
const only = process.argv[2] ? process.argv[2].split(",") : null;
const STYLE = R.style_prompt;

// name: "one subject, what it does, and 'No text.' unless the text is the point"
// a full-screen plate: name: ["subject", "9:16"] (use it as a panel, not a cutout)
// people are always generic caricatures, never a real person
const items = {
  slab: ["A single collectible trading card sealed inside a clear acrylic grading slab, front view, very slightly tilted. The card face is dark ink with only a bold jagged lightning-bolt emblem glowing signal-red from behind, radiant rim light around the card edges. The label strip at the top of the slab is completely blank. No creature, no character, no text.", "3:4"],
  binder: "An open ring binder page of clear trading-card sleeves, a 3 by 3 grid of pockets, every card face-down showing the same generic card back: dark ink with a red jagged lightning-bolt emblem. Seen straight from above. No text, no characters.",
  kid: ["Nostalgic home snapshot, slightly grainy film look: the hands of a ten-year-old child holding a fanned stack of trading cards, all showing the same generic card back with a red lightning-bolt emblem, over a soft carpet. Hands only, no face. No text, no characters.", "4:5"],
  packs: "A small messy pile of sealed foil trading-card booster packs, glossy blank foil wrappers in ink and signal red, each embossed with only a jagged lightning-bolt emblem, crimped ends. No text, no logos, no characters.",
};

fs.mkdirSync(OUT, { recursive: true });
await Promise.all(Object.entries(items).filter(([k]) => !only || only.includes(k)).map(async ([name, v]) => {
  const [subj, ratio] = Array.isArray(v) ? v : [v, "1:1"];
  for (let a = 0; a < 4; a++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent?key=${KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${STYLE} Subject: ${subj}` }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: ratio, imageSize: "2K" }, thinkingConfig: { thinkingLevel: "MEDIUM" } },
      }),
    });
    const j = await r.json();
    const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (part) { fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(part.inlineData.data, "base64")); console.log(name, "ok"); return; }
    console.log(name, "retry", r.status, JSON.stringify(j).slice(0, 200));
    await new Promise((s) => setTimeout(s, 5000));
  }
}));
