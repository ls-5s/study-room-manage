# -*- coding: utf-8 -*-
"""对比参考与本稿的三线表：线宽、线长、行距、单元格对齐。"""
import sys
from collections import Counter

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def probe(path, pno, label):
    doc = pymupdf.open(path)
    page = doc.load_page(pno - 1)
    print("\n==== %s p%d ====" % (label, pno))
    hl, vl = [], []
    for dr in page.get_drawings():
        for it in dr["items"]:
            if it[0] == "l":
                a, b = it[1], it[2]
                if abs(a.y - b.y) < 0.5 and abs(b.x - a.x) > 50:
                    hl.append((round(a.y, 1), round(min(a.x, b.x), 1), round(max(a.x, b.x), 1), round(dr["width"], 2)))
                if abs(a.x - b.x) < 0.5 and abs(b.y - a.y) > 5:
                    vl.append((round(a.x, 1), round(dr["width"], 2)))
            elif it[0] == "re":
                r = it[1]
                if r.height < 3 and r.width > 50:
                    hl.append((round(r.y0, 1), round(r.x0, 1), round(r.x1, 1), round(r.height, 2)))
    print("  横线:", sorted(set(hl))[:8])
    print("  竖线:", sorted(set(vl))[:8])
    rows = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if sp:
                rows.append((round(sp[0]["bbox"][1], 1), round(sp[0]["bbox"][0], 1),
                             round(sp[0]["size"], 1), "".join(s["text"] for s in sp)[:12]))
    rows.sort()
    print("  文本:", rows[:10])
    doc.close()


probe(REF, 41, "REF")
probe(MINE, 47, "MINE")
probe(MINE, 48, "MINE")
