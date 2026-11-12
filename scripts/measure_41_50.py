# -*- coding: utf-8 -*-
"""测量第 41～50 页：截图框、代码块字体、题注、正文。"""
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
        fonts = Counter()
        caps = []
        code = []
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
                    if s["font"] in ("Consolas", "CourierNewPSMT", "Courier"):
                        code.append((s["font"], round(s["size"], 1), round(sp[0]["bbox"][1], 1)))
        print(" p%-3d imgs=%s caps=%s" % (pno, imgs[:2], caps[:2]))
        if code:
            print("      code:", code[:3])
        print("      fonts:", fonts.most_common(3))
    doc.close()


probe(REF, "REF", range(41, 51))
probe(MINE, "MINE", range(41, 51))
