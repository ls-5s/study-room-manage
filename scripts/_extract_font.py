# -*- coding: utf-8 -*-
"""从参考 PDF 提取内嵌 STXingkai 字体，保存为 TTF。"""
import os
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
OUT_DIR = os.path.join("thesis", "fonts")
os.makedirs(OUT_DIR, exist_ok=True)

doc = pymupdf.open(REF)
seen = {}
for pno in range(min(6, doc.page_count)):
    for f in doc.get_page_fonts(pno):
        xref, ext, ftype, basefont, name = f[0], f[1], f[2], f[3], f[4]
        if "Xingkai" in (basefont or "") and xref not in seen:
            seen[xref] = (basefont, ext, ftype)

print("found:", seen)
for xref, (basefont, ext, ftype) in seen.items():
    info = doc.extract_font(xref)
    name, fext, ftype2, buf = info[0], info[1], info[2], info[3]
    path = os.path.join(OUT_DIR, "STXingkai." + (fext or "ttf"))
    with open(path, "wb") as fp:
        fp.write(buf)
    print("saved", path, len(buf), "bytes", name, fext, ftype2)
doc.close()
