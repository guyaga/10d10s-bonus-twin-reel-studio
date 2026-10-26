"""Reel mix: narration + bed + SFX, every gain set against the voice (ebur128), then 1.09x picture and sound together.

usage: python -I mix.py [video.mp4] [reel.mp4]
"""
import json, re, subprocess, sys
P = "{{PROJECT}}/"
R = json.load(open(P + "reel.json", encoding="utf-8"))
A = P + "audio/"
S = R["skill_dir"] + "/assets/sfx/"   # shared SFX library + music bed
VIDEO = sys.argv[1] if len(sys.argv) > 1 else P + "video.mp4"
OUT = sys.argv[2] if len(sys.argv) > 2 else P + "reel.mp4"
DUR = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", VIDEO], capture_output=True, text=True).stdout)


def mmax(f):
    r = subprocess.run(["ffmpeg", "-nostats", "-i", f, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return max(float(x) for x in re.findall(r"M:\s*(-?[\d.]+)", r) if float(x) > -120)


V = mmax(A + "narration.wav")
# dB under the voice's loudest moment: big hits close, small ticks far
under = {"taiko": 3.5, "hit": 3.5, "tear": 4, "kaching": 6, "stamp": 9, "whip": 10, "swipe": 10, "glitch": 9,
         "count": 10, "snip": 9, "sparkle": 9, "slap": 12, "tick": 13, "buzzer": 7,
         "pop": 4, "inflate": 9, "ping": 12, "scream": 8, "crowd": 9,
         "knock": 4, "powerdown": 5, "alarm": 9, "scan": 10, "marker": 9,
         "chime": 6, "bell": 9, "drop": 5, "heart": 6, "scratch": 8, "type": 12, "rip": 4,
         # SIGNAL look sounds (audio/sfx_*.mp3 from gen_sfx.mjs)
         "ident": 6, "chirp": 14, "static": 8, "sub": 3.5, "radar": 10, "lock": 9}
LOCAL = {"ident", "chirp", "static", "sub", "radar", "lock"}   # names generated into this project's audio/ by gen_sfx.mjs
src = lambda k: (A if k in LOCAL else S) + f"sfx_{k}.mp3"
# one (name, seconds) per visual event, on the composition's clock (before the 1.09x speed-up)
cues = [
    # beat 1: BREAKING
    ("ident", 0.15), ("glitch", 1.82),                                    # LIVE ident; "מטורף" chroma jolt
    ("static", 3.18), ("scan", 3.3),                                      # glitch cut -> map scans in
    *[("chirp", 3.62 + k * 0.12) for k in range(7)],                      # government sites ping online
    *[("tick", 4.62 + k * 0.105) for k in range(14) if k not in (9, 11, 13)],   # ...and go dark one by one
    ("glitch", 5.05), ("glitch", 5.35), ("glitch", 5.65),                 # UK / NL / FI OFFLINE chips
    ("buzzer", 5.9),                                                      # status -> OFFLINE
    ("powerdown", 6.1), ("sub", 6.12),                                    # "בכוונה": the plug is pulled from his hand
    ("static", 6.84), ("radar", 6.95),                                    # back to the monitor, radar sweep
    *[("ping", 7.4 + k * 0.2) for k in range(4)],                         # blip
    ("lock", 8.16), ("sub", 8.16), ("hit", 8.16),                         # "AI": target locked
    # beat 2: THE CITY
    ("static", 8.84), ("glitch", 8.93),                                   # signal loss -> NO SIGNAL bars
    ("scan", 9.1), *[("chirp", 9.2 + k * 0.32) for k in range(5)],         # wireframe city draws in
    ("swipe", 11.64),                                                     # 7/10 counter out of his hand
    *[("chirp", 11.8 + k * 0.17) for k in range(7)],                      # 7 buildings light up
    ("scan", 13.8), ("count", 13.85),                                     # the foundation draws under them
    ("lock", 15.14),                                                      # lock on the foundation
    ("sub", 16.3), ("hit", 16.3), ("glitch", 16.28),                      # "PHP" slams in
]
if not cues:
    sys.exit("add the cues first: one (sfx name, time) per visual event")
gain = {k: 10 ** ((V - under[k] - mmax(src(k))) / 20) for k in {k for k, _ in cues}}
M = 10 ** ((V - 17 - mmax(S + "music.mp3")) / 20)
ins = ["-i", VIDEO, "-i", A + "narration.wav", "-stream_loop", "-1", "-i", S + "music.mp3"]
fc = [f"[1:a]apad=whole_dur={DUR}[nar]"]
for i, (k, t) in enumerate(cues):
    ins += ["-i", src(k)]
    ms = int(t * 1000)
    fc.append(f"[{3 + i}:a]volume={gain[k]:.4f},adelay={ms}|{ms}[s{i}]")
# the bed loops under the whole film and fades out on the last line
fc.append(f"[2:a]atrim=0:{DUR},volume={M:.4f},afade=t=out:st={DUR - 1.2}:d=1.2[mus]")
fc.append("[nar][mus]" + "".join(f"[s{i}]" for i in range(len(cues))) + f"amix=inputs={len(cues) + 2}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[mix]")
fc.append("[0:v]setpts=PTS/1.09[v]")
fc.append("[mix]atempo=1.09[a]")
cmd = ["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]",
       "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]
subprocess.run(cmd, check=True)
print(f"voice Mmax {V:.1f}; music gain {M:.3f}; {len(cues)} cues -> {OUT}")
