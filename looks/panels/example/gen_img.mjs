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
  vm: ["A generic caricature (not a real person) of a male social-media 'AI guru' influencer in his thirties: slick quiff, sunglasses pushed up on his head, mouth wide open in fake shock like a clickbait thumbnail, pointing straight at the viewer, a phone in the other hand, a big ring light glowing behind his head. Head and shoulders, centred, filling the frame. Background: flat #E63B2E with large #F5F3EE Ben-Day dots and a burst of ink speed lines.", "3:4"],
  vf: ["A generic caricature (not a real person) of a female social-media 'AI queen' influencer in her thirties: long glossy hair, huge fake grin, winking, fanning a thick stack of banknotes toward the viewer, a ring light glowing behind her head. Head and shoulders, centred, filling the frame. Background: flat #F5F3EE with #E63B2E Ben-Day dots and ink sunburst rays.", "3:4"],
  vblank: ["A generic caricature (not a real person) of a male influencer in a hoodie shrugging with an empty, clueless smile, standing beside a completely blank, empty whiteboard, holding a marker; nothing is written anywhere. Waist up, centred. Background: flat #F5F3EE with soft #E63B2E Ben-Day dots.", "3:4"],
  reaper: ["A generic caricature (not a real person) of a smug male influencer as a comic-book supervillain: black cape with a high collar, holding a giant grim-reaper scythe whose blade is a smartphone, a ring-light halo behind him, evil grin, dramatic low angle, waist up, centred. Background: flat #E63B2E with ink sunburst rays.", "4:3"],
  hand: "A single human hand and forearm bursting straight up out of cracked earth and flying rubble, fist clutching a digital drawing stylus pen triumphantly, impact lines around it. Plain flat #F5F3EE paper background with a generous empty margin.",
  alivef: ["A generic young female graphic designer (not a real person) working at blazing speed on a drawing tablet with a stylus, focused confident smile, comic speed lines streaking behind her, small sparkle bursts around the screen. Waist up, centred, filling the frame. Background: flat #E63B2E with #F5F3EE Ben-Day dots.", "3:4"],
  alivem: ["A generic male motion designer (not a real person) at a laptop typing at blazing speed, determined grin, comic speed lines streaking behind him, small sparkle bursts. Waist up, centred, filling the frame. Background: flat #F5F3EE with #E63B2E Ben-Day dots.", "3:4"],
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
