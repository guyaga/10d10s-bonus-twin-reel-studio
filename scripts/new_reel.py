"""Start a new reel: copy the template, lay the chosen look over it, point every script at the folder, freeze the profile into reel.json.

usage: python -I new_reel.py <name> [--look signal|panels|feed]   -> <projects_root>/<name>
       python -I new_reel.py D:/reels/<name> [--look ...]          -> that exact folder
The look defaults to the profile's "look".
"""
import argparse, json, pathlib, shutil, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import SKILL, fail, load

LOOKS = sorted(p.name for p in (SKILL / "looks").iterdir() if (p / "LOOK.md").exists())
ap = argparse.ArgumentParser()
ap.add_argument("name")
ap.add_argument("--look", choices=LOOKS)
a = ap.parse_args()
prof = load()
look = a.look or prof["look"]
if look not in LOOKS:
    fail(f"look '{look}' not found", "choose one of: " + ", ".join(LOOKS))
L = SKILL / "looks" / look
arg = pathlib.Path(a.name)
dst = arg if arg.is_absolute() or not prof["projects_root"] else pathlib.Path(prof["projects_root"]) / arg
if dst.exists() and any(dst.iterdir()):
    fail(f"{dst} already has files in it", "choose another name, or delete that folder first")

# the image style: the creator's own prompt if set, else the look's
b = prof["brand"]
style = (prof["style_prompt"] or (L / "style.txt").read_text(encoding="utf-8")).strip()
style = style.replace("{ink}", b["ink"]).replace("{accent}", b["accent"]).replace("{paper}", b["paper"])

shutil.copytree(SKILL / "template", dst, dirs_exist_ok=True)
# the look: starter composition, captions, fonts, its design notes + helpers, its sounds
shutil.copy(L / "starter.html", dst / "src" / "index.src.html")
shutil.copy(L / "caps_A.css", dst / "src" / "caps_A.css")
shutil.copy(L / "fonts.css.html", dst / "src" / "fonts.css.html")
shutil.rmtree(dst / "src" / "fonts", ignore_errors=True)
shutil.copytree(L / "fonts", dst / "src" / "fonts")
(dst / "look").mkdir(exist_ok=True)
for f in ["LOOK.md", "look.css", "look.js", "style.txt", "sfx.json"]:
    shutil.copy(L / f, dst / "look" / f)
for d in ["audio", "img", "web", "clips", "twin"]:
    (dst / d).mkdir(exist_ok=True)
# the look's demo art (panel images the starter shows until this reel's own art replaces them)
if (L / "art").exists():
    shutil.copytree(L / "art", dst / "art", dirs_exist_ok=True)
for f in (L / "sfx").glob("sfx_*.mp3"):
    shutil.copy(f, dst / "audio" / f.name)
proj = dst.as_posix()
for f in dst.rglob("*"):
    if f.suffix in {".mjs", ".py", ".html"}:
        s = f.read_text(encoding="utf-8")
        if "{{PROJECT}}" in s:
            f.write_text(s.replace("{{PROJECT}}", proj), encoding="utf-8")
reel = {**prof, "look": look, "style_prompt": style, "skill_dir": SKILL.as_posix(), "project": proj}
(dst / "reel.json").write_text(json.dumps(reel, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"new reel at {proj} in the {look} look; read look/LOOK.md before you compose")
