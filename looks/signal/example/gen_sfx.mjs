// New sound effects with ElevenLabs into audio/sfx_<name>.mp3. Add each name to LOCAL in mix.py and give it a gain in `under`.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";
const KEY = needKey("ELEVEN_API_KEY", "elevenlabs.io > Developers > API Keys");
const S = {
  // name: "prompt"  or  name: ["prompt", seconds]
  ident: ["TV news broadcast ident: two short bright electronic sine beeps then a punchy synth stab, clean, no music bed", 1.2],
  chirp: ["very short digital data chirp, modem-like high blip burst, computer telemetry, dry", 0.5],
  static: ["harsh analog TV static burst with a sharp signal-loss crackle, cuts off abruptly", 0.8],
  sub: ["deep cinematic sub bass drop, a low boom that falls in pitch, clean, no reverb tail", 1.5],
  radar: ["sonar radar sweep: one soft electronic ping with a rising swoosh, military control room", 1.6],
  lock: ["target lock-on: three fast rising electronic beeps ending in a solid confirm tone, HUD targeting", 0.8],
};
for (const [k, v] of Object.entries(S)) {
  const [text, secs] = Array.isArray(v) ? v : [v, 1.2];
  for (let a = 0; ; a++) {
    const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify({ text, duration_seconds: secs, prompt_influence: 0.6 }) });
    if (r.status === 429 && a < 8) { await new Promise((s) => setTimeout(s, 5000)); continue; }
    if (!r.ok) throw new Error(k + " " + r.status + " " + await r.text());
    fs.writeFileSync(`audio/sfx_${k}.mp3`, Buffer.from(await r.arrayBuffer())); console.log(k, "ok"); break;
  }
}
