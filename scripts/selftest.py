"""Free self-test: no HeyGen, no Gemini, no ElevenLabs, nothing spent.

  python -I -X utf8 selftest.py [--look signal|panels|feed] [--out folder]

Starts a real reel project with new_reel.py, puts a stand-in presenter (a silhouette in your brand colours) and sample
word timings in it, builds the composition, lints it with HyperFrames and takes two snapshots in headless Chrome.
If that works, everything except the paid steps works on this machine. The first run downloads HyperFrames and its
Chrome (a few minutes, once). Default output: ./twin-reel-selftest
"""
import argparse, json, os, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import SKILL, fail, load, which

sys.stdout.reconfigure(encoding="utf-8")
LOOKS = sorted(p.name for p in (SKILL / "looks").iterdir() if (p / "LOOK.md").exists())
ap = argparse.ArgumentParser()
ap.add_argument("--look", choices=LOOKS)
ap.add_argument("--out", default=os.path.join(os.getcwd(), "twin-reel-selftest"))
a = ap.parse_args()
for t in ("ffmpeg", "node", "npx"):
    which(t) or fail(f"{t} is not installed", "run setup.py")
prof = load()
look = a.look or prof["look"]
dst = Path(a.out) / look
if dst.exists():
    shutil.rmtree(dst)
py = [sys.executable, "-I", "-X", "utf8"]
npx = which("npx")


def step(label, cmd, cwd=None):
    print(f"-- {label}", flush=True)
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        fail(f"{label} failed:\n{(r.stderr or r.stdout)[-800:]}")
    return r.stdout


step("new reel project", py + [str(HERE / "new_reel.py"), str(dst), "--look", look])

# a stand-in presenter: 6 s, transparent, landscape like a HeyGen render
from PIL import Image, ImageDraw
W, H = 1920, 1080
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.ellipse([W // 2 - 150, 180, W // 2 + 150, 520], fill=prof["brand"]["ink"])
d.rounded_rectangle([W // 2 - 380, 560, W // 2 + 380, H + 200], 220, fill=prof["brand"]["ink"])
img.save(dst / "twin" / "stand_in.png")
step("stand-in presenter", ["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", "25", "-i", str(dst / "twin" / "stand_in.png"),
                            "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "6", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                            "-b:v", "1M", "-c:a", "libopus", "-shortest", str(dst / "presenter.webm")])

# sample timings in the shape gen_beats.mjs and words.py write
sample = ("זו בדיקה של הסטודיו. אין כאן עלות. הכל עובד." if prof.get("direction", "rtl") == "rtl"
          else "This is a studio test. Nothing is spent. It all works.").split()
words = [[w, round(0.3 + i * 0.6, 2), round(0.8 + i * 0.6, 2)] for i, w in enumerate(sample)]
(dst / "audio" / "words.json").write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
(dst / "audio" / "timing.json").write_text(json.dumps({"starts": [0.25, 3.0], "total": 6.0}), encoding="utf-8")

step("build", py + ["src/build.py"], cwd=dst)
step("HyperFrames lint (first run downloads HyperFrames)", [npx, "-y", "hyperframes@0.6.82", "lint"], cwd=dst / "comp")
step("snapshots in headless Chrome (first run downloads Chrome)",
     [npx, "-y", "hyperframes@0.6.82", "snapshot", "--at", "1.5,4.5", "--describe", "false", "--timeout", "30000"], cwd=dst / "comp")
shots = sorted((dst / "comp").rglob("*.png"), key=lambda p: p.stat().st_mtime)[-2:]
if not shots:
    fail("HyperFrames ran but made no snapshot", "run setup.py, then try again; if it repeats, restart the computer (a stuck Chrome)")
for s in shots:
    print(f"  [OK] {s}")
print(f"\nSELFTEST OK ({look}): project, build, lint and headless render work. The project is {dst}.\n"
      "Only the paid steps are left (voice, HeyGen twin, images): a real reel shows its price first.")
