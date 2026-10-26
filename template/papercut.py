"""Real photo -> paper-cut sticker: cutout, scissor-cut polygon border in off-white paper, grain, hard shadow.

usage: python -I papercut.py src=name[:hull|:shape][@x0,y0,x1,y1] ...
  hull  (default) fill the convex hull of the cutout: cards, slabs, packs, boxes
  shape keep the real outline: people, irregular objects
  full  the non-white rectangle of a flat scan (no rembg mask)
  @box  crop the source first (fractions of width/height)
"""
import sys, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

sess = new_session("isnet-general-use")
rng = np.random.default_rng(11)


def scissor(poly, step, jitter):
    # resample the outline every ~step px and jitter vertices: short straight cuts
    pts, out = poly.reshape(-1, 2).astype(float), []
    for a, b in zip(pts, np.roll(pts, -1, 0)):
        n = max(1, int(np.linalg.norm(b - a) / step))
        for k in range(n):
            out.append(a + (b - a) * k / n + rng.normal(0, jitter, 2))
    return np.array(out, dtype=np.int32)


def sticker(src, dst, mode="hull", crop=None, border=24, maxside=1400):
    im = Image.open(src).convert("RGB")
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    cut = remove(im, session=sess, post_process_mask=True)
    a = (np.asarray(cut.getchannel("A")) > 128).astype(np.uint8)
    pad = border * 3
    a = np.pad(a, pad)
    rgb = np.pad(np.asarray(im), ((pad, pad), (pad, pad), (0, 0)), constant_values=255)
    cs, _ = cv2.findContours(a, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cs = [c for c in cs if cv2.contourArea(c) > a.sum() * 0.02]
    body = np.zeros_like(a)
    if mode == "full":   # flat scan: the object is the non-white rectangle
        nz = np.argwhere(rgb.min(2) < 235)
        (y0, x0), (y1, x1) = nz.min(0), nz.max(0)
        body[y0:y1, x0:x1] = 1
    elif mode == "hull":
        cv2.fillPoly(body, [cv2.convexHull(np.vstack(cs))], 1)
    else:
        cv2.drawContours(body, cs, -1, 1, cv2.FILLED)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (border * 2 + 1, border * 2 + 1))
    grown = cv2.dilate(body, k)
    gc, _ = cv2.findContours(grown, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    paper = np.zeros_like(a)
    for c in gc:
        c = cv2.approxPolyDP(c, 5 if mode == "shape" else 3, True)
        cv2.fillPoly(paper, [scissor(c, 70 if mode == "hull" else 38, 3.2)], 1)
    paper = np.maximum(paper, cv2.dilate(body, np.ones((7, 7), np.uint8)))
    H, W = a.shape
    out = np.zeros((H + 20, W + 20, 4), float)
    out[14:H + 14, 10:W + 10, 3] = paper * 140          # hard shadow, offset down-right
    out[..., :3] = 18
    sheet = np.full((H, W, 3), (250, 247, 240), float) + rng.normal(0, 5, (H, W, 1))
    photo = rgb.astype(float) + rng.normal(0, 4, (H, W, 1))
    col = np.where(body[..., None] == 1, photo, sheet)
    al = paper[..., None].astype(float)
    top = out[:H, :W]
    top[..., :3] = col * al + top[..., :3] * (1 - al)
    top[..., 3] = np.maximum(top[..., 3], paper * 255)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    img = img.crop(img.getbbox())
    img.save(dst)
    print(dst, img.size)


for arg in sys.argv[1:]:
    s, d = arg.split("=")
    crop = None
    if "@" in d:
        d, c = d.split("@")
        crop = [float(v) for v in c.split(",")]
    mode = "hull"
    if ":" in d:
        d, mode = d.split(":")
    sticker(f"web/{s}", f"img/{d}.png", mode, crop)
