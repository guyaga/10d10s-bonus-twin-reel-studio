"""Reel mix: narration + bed + SFX, every gain set against the voice (ebur128), then 1.09x picture and sound together.

usage: python -I mix.py [video.mp4] [reel.mp4]
"""
import glob, json, os, re, subprocess, sys
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
under = {"taiko": 10, "hit": 10, "tear": 9, "kaching": 9, "stamp": 9, "whip": 10, "swipe": 10, "glitch": 9,
         "count": 10, "snip": 9, "sparkle": 9, "slap": 12, "tick": 13, "buzzer": 7,
         "pop": 7, "inflate": 9, "ping": 12, "scream": 8, "crowd": 9,
         "knock": 7, "powerdown": 7, "alarm": 9, "scan": 10, "marker": 9,
         "chime": 8, "bell": 9, "drop": 7, "heart": 8, "scratch": 8, "type": 12, "rip": 7}
if os.path.exists(P + "look/sfx.json"):   # the look's own sounds and their gains
    under.update(json.load(open(P + "look/sfx.json", encoding="utf-8")))
# sounds in this project's audio/ (the look's, plus any made with gen_sfx.mjs) win over the shared library
LOCAL = {os.path.basename(f)[4:-4] for f in glob.glob(A + "sfx_*.mp3")}
src = lambda k: (A if k in LOCAL else S) + f"sfx_{k}.mp3"
# one (name, seconds) per visual event, on the composition's clock (before the 1.09x speed-up)
cues = [
    # ("taiko", 0.2), ("stamp", 1.4), *[("tick", 3.0 + k * 0.14) for k in range(8)],
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
