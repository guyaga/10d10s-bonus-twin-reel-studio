"""usage: python -I keyout.py name1 name2 ...   (web/<name>.png -> art/<name>.png)
Art on plain paper -> transparent PNG: only paper connected to the image border is removed, so paper inside the object stays."""
import sys, numpy as np, cv2
from PIL import Image
import os
os.makedirs("art", exist_ok=True)
for name in sys.argv[1:]:
    im = np.array(Image.open(f"web/{name}.png").convert("RGB")).astype(np.int16)
    h, w, _ = im.shape
    bg = np.median(np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3), im[:, :8].reshape(-1, 3), im[:, -8:].reshape(-1, 3)]), 0)
    near = (np.abs(im - bg).sum(2) < 60).astype(np.uint8)
    ff = near.copy() * 255
    mask = np.zeros((h + 2, w + 2), np.uint8)
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if ff[y, x] == 255: cv2.floodFill(ff, mask, (x, y), 128)
    out = (ff == 128).astype(np.uint8)
    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    alpha = 255 - cv2.GaussianBlur(out * 255, (3, 3), 0)
    rgba = np.dstack([im.astype(np.uint8), alpha])
    ys, xs = np.where(alpha > 10)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(rgba).save(f"art/{name}.png"); print(name, rgba.shape)
