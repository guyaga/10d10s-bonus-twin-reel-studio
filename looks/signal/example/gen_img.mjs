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
  worldmap: ["A flat equirectangular world map drawn as a dot-matrix of small evenly spaced off-white dots (continents only, accurate coastlines, Europe clearly readable), thin faint latitude and longitude grid lines, filling the frame edge to edge horizontally. No text, no labels, no markers.", "16:9"],
  plug: "A big industrial power plug being pulled out of its wall socket, the plug and its cable drawn as wireframe line art, a small spark at the prongs in the signal colour, seen at a three-quarter angle. No text.",
  aichip: "A square computer microchip seen straight-on with pins on all four sides, and in the middle of the chip a single wide-open eye whose iris glows in the signal colour, circuit traces radiating out. No text.",
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
