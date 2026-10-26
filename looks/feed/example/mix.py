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
         # FEED look (generated into audio/)
         "tap": 11, "notif": 8, "flick": 9, "bid": 12, "rise": 9}
LOCAL = {"tap", "notif", "flick", "bid", "rise"}   # names generated into this project's audio/ by gen_sfx.mjs
src = lambda k: (A if k in LOCAL else S) + f"sfx_{k}.mp3"
# one (name, seconds) per visual event, on the composition's clock (before the 1.09x speed-up)
cues = [
    # beat 1: thumbnail clears, Logan Paul notification, bubble docks, listing out of the hand, $5M
    ("flick", 0.06), ("notif", 0.34), ("flick", 1.08), ("pop", 1.22), ("sparkle", 1.78), ("count", 2.3),
    # live auction: bids ping in while the price climbs, then SOLD
    ("tap", 3.74), *[("bid", t) for t in (4.45, 4.8, 5.15, 5.5, 5.95)], ("count", 5.06), ("kaching", 6.28), ("pop", 6.38),
    # beat 2: swipe up, the bubble opens into his story, binder + memory stickers out of his hands
    ("flick", 6.68), ("whip", 6.86), ("tap", 7.2), ("pop", 8.2), ("chime", 9.06), ("tap", 9.9),
    # beat 3: swipe to the group chat, messages land, 99+, swipe to the chart, tap 2020, the rise, the breakout
    ("flick", 10.38), ("notif", 10.66), ("ping", 10.98), ("ping", 11.28), ("pop", 11.04), ("flick", 11.62),
    ("tap", 11.98), ("rise", 12.84), ("hit", 15.14), ("kaching", 15.16), ("pop", 15.3),
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
