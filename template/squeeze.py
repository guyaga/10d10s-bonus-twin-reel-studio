"""Cut every pause longer than 0.25s in a{i}.wav down to KEEP seconds -> b{i}.wav."""
import re, subprocess, sys
KEEP = 0.18
for i in range(1, int(sys.argv[1]) + 1):
    src, dst = f"audio/a{i}.wav", f"audio/b{i}.wav"
    log = subprocess.run(["ffmpeg", "-i", src, "-af", "silencedetect=n=-40dB:d=0.25", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
    keep, t = [], 0.0
    for s, e in zip(st, en):
        if s < 0.05 or e > dur - 0.05:   # leading/trailing silence: trim fully
            if s < 0.05: t = max(t, e - 0.04)
            else: keep.append((t, s + 0.06)); t = dur
            continue
        mid = (s + e) / 2
        keep.append((t, mid - KEEP / 2)); t = mid + KEEP / 2
    if t < dur: keep.append((t, dur))
    fc = "".join(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={b-a-0.01:.3f}:d=0.01[p{k}];" for k, (a, b) in enumerate(keep))
    fc += "".join(f"[p{k}]" for k in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[o]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[o]", dst], check=True)
    nd = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst], capture_output=True, text=True).stdout)
    print(f"b{i}: {dur:.2f} -> {nd:.2f}")
