# -*- coding: utf-8 -*-
"""统一白底、并自动裁掉四周空白（图内标题去掉后留下的上边距）。"""
import io
import re

p = "scripts/render_diagrams.py"
t = io.open(p, encoding="utf-8").read()

for c in ("(228, 236, 245)", "(238, 242, 247)", "(232, 240, 250)"):
    t = t.replace(c, "(255, 255, 255)")

# 所有 img.save(out) 前加自动裁白边
t = t.replace("    img.save(out)", "    _trim(img).save(out)")
t = t.replace("        img.save(out)", "        _trim(img).save(out)")

helper = '''
def _trim(img, pad=24):
    from PIL import ImageOps
    inv = ImageOps.invert(img.convert("RGB"))
    bbox = inv.getbbox()
    if not bbox:
        return img
    l, t_, r, b = bbox
    l = max(0, l - pad); t_ = max(0, t_ - pad)
    r = min(img.width, r + pad); b = min(img.height, b + pad)
    return img.crop((l, t_, r, b))


'''
anchor = "def new_canvas("
i = t.find(anchor)
if i > 0 and "_trim" not in t[:i]:
    t = t[:i] + helper + t[i:]

io.open(p, "w", encoding="utf-8").write(t)
print("whitened fills and added auto-crop")
