# -*- coding: utf-8 -*-
"""图片按参考占满版心 15.5 cm（过高时按高度上限回退）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''def add_image(doc, path, width_cm=14.5):'''
new = '''def add_image(doc, path, width_cm=15.5):'''
assert old in t
t = t.replace(old, new, 1)

old2 = '''    run = p.add_run()
    run.add_picture(path, width=Cm(width_cm))'''
new2 = '''    from PIL import Image as _Img
    with _Img.open(path) as im:
        w, h = im.size
    target = width_cm
    if w and h and (h / w) * target > 19.0:
        target = 19.0 * w / h
    run = p.add_run()
    run.add_picture(path, width=Cm(target))'''
assert old2 in t
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("image width set to 15.5cm with height cap")
