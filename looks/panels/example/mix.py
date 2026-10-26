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
         "boing": 8, "punch": 5, "whoosh": 11, "crack": 5, "gasp": 9, "flip": 9}   # PANELS look sounds
LOCAL = {"boing", "punch", "whoosh", "crack", "gasp", "flip"}   # names generated into this project's audio/ by gen_sfx.mjs
src = lambda k: (A if k in LOCAL else S) + f"sfx_{k}.mp3"
# one (name, seconds) per visual event, on the composition's clock (before the 1.09x speed-up)
cues = [
    ("punch", 0.12),                                   # cover prints
    ("boing", 1.54),                                   # "מוגזם": the title inflates
    ("flip", 2.08),                                    # cover page turns
    ("swipe", 2.46), ("pop", 2.76), ("pop", 3.06),      # FOLLOWING tag from his hand, CLICK!, second tag
    ("ping", 3.64),                                    # +1
    ("whoosh", 4.08),                                  # travel to the 3-panel gag
    ("punch", 4.26), ("scream", 4.42),                 # panel 1: scares you, AAAH!
    ("slap", 5.32), ("kaching", 5.56),                 # panel 2: promises, KA-CHING!
    ("slap", 6.5), *[("tick", 6.9 + k * 0.18) for k in range(3)],   # panel 3 + the three dots
    ("boing", 7.56),                                   # כלום!
    ("whoosh", 7.88),                                  # travel to the lineup
    ("swipe", 8.14), ("ping", 8.44),                   # magnifier flies from his hand and lands
    ("punch", 8.84),                                   # GOTCHA!
    *[("tick", 9.14 + k * 0.07) for k in range(6)],    # six panels 1..6
    ("whoosh", 10.08), ("taiko", 10.42),               # dive into panel 1, giant "1"
    ("whip", 11.8), ("punch", 11.82),                  # SLASH!
    ("whoosh", 12.86),                                 # travel to the graveyard
    ("taiko", 13.27), ("taiko", 14.61),                # THUD! THUD!
    ("scratch", 15.6),                                 # "למה?" record scratch + giant ?
    ("pop", 16.12), *[("count", 16.3 + k * 0.25) for k in range(4)],   # views card + counter
    ("crack", 17.88),                                  # crack lines draw
    ("punch", 18.34), ("rip", 18.36),                  # KRAK! stones split
    ("gasp", 18.58),                                   # חיים!
    ("whoosh", 19.12),                                 # travel to the alive designers
    ("swipe", 20.3),                                   # ZOOM!
    ("pop", 20.84),                                    # AI burst from his hand
    ("whip", 21.26),                                   # faster
    ("flip", 21.45),                                   # to be continued...
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
