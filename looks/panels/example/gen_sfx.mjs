// New sound effects with ElevenLabs into audio/sfx_<name>.mp3. Add each name to LOCAL in mix.py and give it a gain in `under`.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";
const KEY = needKey("ELEVEN_API_KEY", "elevenlabs.io > Developers > API Keys");
const S = {
  boing: "cartoon comic spring boing, bouncy and springy, single hit, dry, no music",
  punch: "comic book cartoon punch impact, big meaty thwack with a quick whoosh into it, single hit, dry",
  whoosh: "fast short cartoon whoosh, camera whip pan from right to left, airy, no hit at the end",
  crack: "heavy stone gravestone cracking and splitting apart, sharp crack then rubble crumble, short",
  gasp: "small theatre crowd collectively gasping in surprise, short, no speech",
  flip: "single comic book page turning fast, crisp paper flip, close and dry",
};
for (const [k, text] of Object.entries(S)) {
  for (let a = 0; ; a++) {
    const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify({ text, duration_seconds: 1.2, prompt_influence: 0.6 }) });
    if (r.status === 429 && a < 8) { await new Promise((s) => setTimeout(s, 5000)); continue; }
    if (!r.ok) throw new Error(k + " " + r.status + " " + await r.text());
    fs.writeFileSync(`audio/sfx_${k}.mp3`, Buffer.from(await r.arrayBuffer())); console.log(k, "ok"); break;
  }
}
