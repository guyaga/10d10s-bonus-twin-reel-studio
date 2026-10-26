"""Build the reel: captions from word timings, hand positions, brand colours, assets -> comp/."""
import json, pathlib, re, shutil
from PIL import Image
root = pathlib.Path(__file__).parent.parent
src, out = root / "src", root / "comp"
R = json.loads((root / "reel.json").read_text(encoding="utf-8"))
T = json.loads((root / "audio" / "timing.json").read_text())
DUR = round(T["total"], 2)

hp = root / "track" / "hands.json"
hands = json.loads(hp.read_text()) if hp.exists() else []
H = [[f["t"], [[h["x"], h["y"]] for h in sorted(f["hands"], key=lambda h: h["top"])]] for f in hands if f["hands"]] or [[0, [[1150, 700]]]]

# whisper words -> script spelling (FIX), split tokens joined back (MERGE), then chunks of up to 3 words
W = json.loads((root / "audio" / "words.json").read_text(encoding="utf-8"))
FIX = {}       # {"heard": "written"}
MERGE = []     # [(["Chat", "GPT"], "ChatGPT")]
AT = {}        # {word index in words.json: "written"} for a fix that depends on where the word is
W = [[AT.get(k, w[0]), *w[1:]] for k, w in enumerate(W)]
words, i = [], 0
while i < len(W):
    for parts, joined in MERGE:
        if [w[0] for w in W[i:i + len(parts)]] == parts:
            words.append([joined, W[i][1], W[i + len(parts) - 1][2]]); i += len(parts); break
    else:
        words.append([FIX.get(W[i][0], W[i][0]), W[i][1], W[i][2]]); i += 1
BEATS = [b + 0.15 for b in T["starts"][1:]]   # beat starts are hard caption breaks
NUM = set()    # words that open a numbered point ("One,") always start a new chunk
caps, cur = [], []
for k, (w, t, e) in enumerate(words):
    nxt = words[k + 1] if k + 1 < len(words) else None
    cur.append([w.rstrip(","), t])
    if re.search(r"[,.?!:]$", w) or len(cur) == 3 or (nxt and (nxt[1] - e > 0.3 or nxt[0] in NUM or any(t < b <= nxt[1] + 0.3 for b in BEATS))):
        caps.append(cur); cur = []
if cur: caps.append(cur)


def rgb(h):
    h = h.lstrip("#")
    return ",".join(str(int(h[k:k + 2], 16)) for k in (0, 2, 4))


page = (src / "index.src.html").read_text(encoding="utf-8")
# the look: its theme CSS and helper functions (look/look.css, look/look.js)
look = lambda f: (root / "look" / f).read_text(encoding="utf-8") if (root / "look" / f).exists() else ""
page = page.replace("{{LOOKCSS}}", look("look.css")).replace("{{LOOKJS}}", look("look.js"))
page = (page.replace("{{FONTS}}", (src / "fonts.css.html").read_text(encoding="utf-8"))
            .replace("{{CAPSTYLE}}", (src / "caps_A.css").read_text(encoding="utf-8"))
            .replace("{{HANDS}}", json.dumps(H)).replace("{{CAPS}}", json.dumps(caps, ensure_ascii=False))
            .replace("{{DUR}}", str(DUR)).replace("{{HEADER}}", R.get("header") or R.get("name") or ""))
# brand colours: the template is written in the default palette, swapped here for the creator's
b = R["brand"]
for old, new in [("#111111", b["ink"]), ("#F5F3EE", b["paper"]), ("#E63B2E", b["accent"])]:
    page = re.sub(re.escape(old), new, page, flags=re.I)
page = page.replace("rgba(17,17,17,", f"rgba({rgb(b['ink'])},").replace("rgba(245,243,238,", f"rgba({rgb(b['paper'])},")
if R.get("direction") == "ltr":
    page = page.replace("direction:rtl", "direction:ltr").replace('lang="he"', f'lang="{R["language"]}"')

A = out / "assets"
A.mkdir(parents=True, exist_ok=True)
(out / "index.html").write_text(page, encoding="utf-8")
for f in ["hyperframes.json", "package.json"]:
    shutil.copy(src / f, out / f)
if not (A / "fonts").exists():
    shutil.copytree(src / "fonts", A / "fonts")
# every sticker in img/ (downsized for the renderer) and every trimmed clip
for f in (root / "img").glob("*.png"):
    im = Image.open(f)
    im.thumbnail((900, 900) if im.width * im.height < 2_000_000 else (1080, 1920), Image.LANCZOS)
    im.save(A / f.name, optimize=True)
# finished panel art (art/, as-is: cutouts from keyout.py and full panels) -> assets/art/
if (root / "art").exists():
    shutil.copytree(root / "art", A / "art", dirs_exist_ok=True)
for f in (root / "img").glob("*.mp4"):
    shutil.copy(f, A / f.name)
shutil.copy(pathlib.Path(R["skill_dir"]) / "assets" / "grain.png", A / "grain.png")
if (root / "presenter.webm").exists():
    shutil.copy(root / "presenter.webm", A / "presenter.webm")
ids = re.findall(r'id="([^"]+)"', page)
dup = sorted({x for x in ids if ids.count(x) > 1})
print("built comp/ with", len(H), "hand frames,", len(caps), "caption chunks", f"- DUPLICATE IDS: {dup}" if dup else "")
