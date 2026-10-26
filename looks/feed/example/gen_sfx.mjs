// New sound effects with ElevenLabs into audio/sfx_<name>.mp3. Add each name to LOCAL in mix.py and give it a gain in `under`.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";
const KEY = needKey("ELEVEN_API_KEY", "elevenlabs.io > Developers > API Keys");
// name: "prompt"  or  name: ["prompt", seconds]
const S = {
  tap: ["single crisp smartphone screen tap, soft glassy UI click, very short, dry, no reverb", 0.5],
  notif: ["modern smartphone push notification sound, two bright glassy rising tones, clean and short", 1.0],
  flick: ["fast airy swipe whoosh of a phone screen being flicked upward, short UI transition swoosh", 0.7],
  bid: ["tiny bright digital blip for a new bid in an app, soft marimba-like UI pop", 0.5],
  rise: ["clean rising synth tone for a stock chart shooting up, smooth upward pitch sweep building tension, ends on a bright high note, no drums", 3.0],
};
const only = process.argv[2] ? process.argv[2].split(",") : null;
for (const [k, v] of Object.entries(S)) {
  if (only && !only.includes(k)) continue;
  const [text, secs] = Array.isArray(v) ? v : [v, 1.2];
  for (let a = 0; ; a++) {
    const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify({ text, duration_seconds: secs, prompt_influence: 0.6 }) });
    if (r.status === 429 && a < 8) { await new Promise((s) => setTimeout(s, 5000)); continue; }
    if (!r.ok) throw new Error(k + " " + r.status + " " + await r.text());
    fs.writeFileSync(`audio/sfx_${k}.mp3`, Buffer.from(await r.arrayBuffer())); console.log(k, "ok"); break;
  }
}
