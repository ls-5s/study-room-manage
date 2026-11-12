# -*- coding: utf-8 -*-
"""测量参考与本稿第 21～30 页：图片框、图题位置、表格线。"""
import re
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def probe(path, label, pages):
    doc = pymupdf.open(path)
    print("\n########", label)
    for pno in pages:
        page = doc.load_page(pno - 1)
        imgs = []
        for img in page.get_images(full=True):
            for r in page.get_image_rects(img[0]):
                imgs.append((round(r.x0, 1), round(r.y0, 1), round(r.width, 1), round(r.height, 1)))
        caps = []
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                sp = [s for s in l["spans"] if s["text"].strip()]
                if not sp:
                    continue
                t = "".join(s["text"] for s in sp).strip()
                if re.match(r"^(图|表)\s*\d", t):
                    caps.append((round(sp[0]["bbox"][1], 1), round(sp[0]["size"], 2), t[:18]))
        lines = []
        for dr in page.get_drawings():
            for it in dr["items"]:
                if it[0] == "l":
                    a, b = it[1], it[2]
                    if abs(a.y - b.y) < 0.5 and abs(b.x - a.x) > 100:
                        lines.append((round(a.y, 1), round(dr["width"], 2)))
        print(" p%-3d imgs=%s" % (pno, imgs))
        if caps:
            print("      caps=%s" % caps)
        if lines:
            print("      hlines=%s" % sorted(lines)[:6])
    doc.close()


probe(REF, "REF", range(21, 31))
probe(MINE, "MINE", range(21, 31))
