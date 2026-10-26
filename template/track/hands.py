import sys, json, glob
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
opts = vision.HandLandmarkerOptions(base_options=BaseOptions(model_asset_path="hand_landmarker.task"), num_hands=2, min_hand_detection_confidence=0.3)
det = vision.HandLandmarker.create_from_options(opts)
out = []
for i, f in enumerate(sorted(glob.glob("f_*.png"))):
    im = Image.open(f).convert("RGBA")
    bg = Image.new("RGBA", im.size, (40, 40, 40, 255)); bg.alpha_composite(im)
    arr = np.asarray(bg.convert("RGB"))
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=arr))
    hands = []
    for lm in r.hand_landmarks:
        xs = [p.x for p in lm]; ys = [p.y for p in lm]
        hands.append({"x": round(float(np.mean(xs)) * 1920, 1), "y": round(float(np.mean(ys)) * 1080, 1), "top": round(min(ys) * 1080, 1)})
    out.append({"t": round(i / 10, 2), "hands": hands})
json.dump(out, open("hands.json", "w"))
# gesture moments: hands rise well above the resting clasp (~y 950) or spread apart
ev = []
for k, fr in enumerate(out):
    hs = fr["hands"]
    hi = [h for h in hs if h["top"] < 820]
    if hi: ev.append((fr["t"], min(h["top"] for h in hi), [ (h["x"], h["y"]) for h in hi]))
print(len(out), "frames;", sum(1 for f in out if f["hands"]), "with hands;", len(ev), "raised")
last = -9
for t, top, pts in ev:
    if t - last > 0.6: print(f"gesture @ {t:.1f}s top={top:.0f} pts={pts}")
    last = t
