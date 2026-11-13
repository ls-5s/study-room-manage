# -*- coding: utf-8 -*-
"""测量第 51～60 页：截图框、代码块、题注。"""
import re
import sys
from collections import Counter

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
        caps, fonts = [], Counter()
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                sp = [s for s in l["spans"] if s["text"].strip()]
                if not sp:
                    continue
                t = "".join(s["text"] for s in sp).strip()
                if re.match(r"^(图|表)\s*\d", t):
                    caps.append((round(sp[0]["bbox"][1], 1), t[:16]))
                for s in sp:
                    fonts[(s["font"], round(s["size"], 1))] += 1
        print(" p%-3d imgs=%s" % (pno, imgs[:2]))
        if caps:
            print("      caps:", caps[:2])
        print("      fonts:", fonts.most_common(3))
    doc.close()


probe(REF, "REF", range(51, 61))
probe(MINE, "MINE 51-60", range(51, 61))
