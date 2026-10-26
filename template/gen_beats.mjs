// Narration per beat in the creator's cloned voice (reel.json: voice.provider elevenlabs | heygen), tempo-up, squeeze pauses, stitch.
// usage: node gen_beats.mjs          all beats
//        node gen_beats.mjs 2,5      re-voice beats 2 and 5 only, then re-stitch
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { envKey, needKey } from "./keys.mjs";

const DIR = "{{PROJECT}}";
const R = JSON.parse(fs.readFileSync(`${DIR}/reel.json`, "utf8"));
const OUT = `${DIR}/audio`;
const only = process.argv[2] ? process.argv[2].split(",").map(Number) : null;

// one beat per idea (2-4 sentences). Spell risky foreign words the way they should sound.
const beats = [
  // "the hook line. the second line.",
];
if (!beats.length) throw new Error("write the beats first (one string per beat)");

const V = R.voice, LANG = R.language;
fs.mkdirSync(OUT, { recursive: true });
for (let i = 0; i < beats.length; i++) {
  if (only && !only.includes(i + 1)) continue;
  for (let a = 0; ; a++) {
    let r;
    if (V.provider === "heygen") {
      r = await fetch("https://api.heygen.com/v3/voices/speech", {
        method: "POST",
        headers: { "x-api-key": envKey("HEYGEN_API_KEY"), "Content-Type": "application/json" },
        body: JSON.stringify({ text: beats[i], voice_id: V.voice_id || R.heygen.voice_id, language: LANG }),
      });
      if (r.ok) r = await fetch((await r.json()).data.audio_url);
    } else {
      r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${V.voice_id}?output_format=mp3_44100_192`, {
        method: "POST",
        headers: { "xi-api-key": envKey("ELEVEN_API_KEY"), "Content-Type": "application/json" },
        body: JSON.stringify({ text: beats[i], model_id: V.model || "eleven_v4", language_code: LANG, voice_settings: { stability: 0.45, similarity_boost: 0.85 } }),
      });
    }
    if (r.status === 429 && a < 6) { await new Promise((s) => setTimeout(s, 4000)); continue; }
    if (!r.ok) throw new Error(`beat ${i + 1}: ${r.status} ${await r.text()}`);
    fs.writeFileSync(`${OUT}/raw${i + 1}.mp3`, Buffer.from(await r.arrayBuffer()));
    console.log(`b${i + 1} ok`);
    break;
  }
}
for (let i = 0; i < beats.length; i++) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${OUT}/raw${i + 1}.mp3`, "-af", `atempo=${V.tempo || 1.1}`, "-ar", "44100", "-ac", "2", `${OUT}/a${i + 1}.wav`]);
}
execFileSync("python", ["-I", "squeeze.py", String(beats.length)], { cwd: DIR, stdio: "inherit" });

const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
const files = beats.map((_, i) => `${OUT}/b${i + 1}.wav`);
const LEAD = 0.25, GAP = 0.3, TAIL = 1.2;
let t = LEAD; const starts = [];
files.forEach((f, i) => { if (i) t += GAP; starts.push(+t.toFixed(3)); t += dur(f); });
const fc = files.map((_, i) => `[${i}:a]aresample=44100,adelay=${(i ? GAP : LEAD) * 1000}|${(i ? GAP : LEAD) * 1000}${i === files.length - 1 ? `,apad=pad_dur=${TAIL}` : ""}[s${i}]`).join(";")
  + ";" + files.map((_, i) => `[s${i}]`).join("") + `concat=n=${files.length}:v=0:a=1[out]`;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...files.flatMap((f) => ["-i", f]), "-filter_complex", fc, "-map", "[out]", "-ar", "44100", "-ac", "2", `${OUT}/narration.wav`]);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${OUT}/narration.wav`, "-b:a", "192k", `${OUT}/narration.mp3`]);
const total = dur(`${OUT}/narration.wav`);
fs.writeFileSync(`${OUT}/timing.json`, JSON.stringify({ starts, durs: files.map(dur), total }, null, 1));
console.log(JSON.stringify({ starts, total }));
