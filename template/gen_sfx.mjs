// New sound effects with ElevenLabs into audio/sfx_<name>.mp3. mix.py picks them up by itself; give each a gain in `under` there.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";
const KEY = needKey("ELEVEN_API_KEY", "elevenlabs.io > Developers > API Keys");
const S = {
  // name: "prompt"  or  name: ["prompt", seconds]
  // whoosh: ["short fast cartoon whoosh, left to right", 0.8],
};
const only = process.argv[2] ? process.argv[2].split(",") : null;   // node gen_sfx.mjs name1,name2 -> just those
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
