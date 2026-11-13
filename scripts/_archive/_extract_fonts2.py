# -*- coding: utf-8 -*-
"""提取参考 PDF 内嵌的 STXingkai 与 STZhongsong 子集，并检查所需字形。"""
import os
import sys

import pymupdf
from PIL import ImageFont

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
OUT_DIR = os.path.join("thesis", "fonts")
os.makedirs(OUT_DIR, exist_ok=True)

want = {"STXingkai": "成都锦城学院毕业论文（设计）",
        "STZhongsong": "本科生毕业论文（设计）"}

doc = pymupdf.open(REF)
found = {}
for pno in range(min(3, doc.page_count)):
    for f in doc.get_page_fonts(pno):
        xref, ext, ftype, basefont, name = f[0], f[1], f[2], f[3], f[4]
        for key in want:
            if key in (basefont or "") and key not in found:
                try:
                    info = doc.extract_font(xref)
                    buf = info[3]
                    if buf:
                        found[key] = (buf, info[1] or "ttf")
                except Exception as exc:
                    print("extract fail", key, exc)
doc.close()

for key, (buf, ext) in found.items():
    path = os.path.join(OUT_DIR, key + "." + ext)
    with open(path, "wb") as fp:
        fp.write(buf)
    try:
        f = ImageFont.truetype(path, 24)
        missing = [c for c in want[key] if f.getmask(c).size[1] == 0]
    except Exception as exc:
        missing = ["load-error:%s" % exc]
    print(key, len(buf), "bytes", "missing:", missing)
