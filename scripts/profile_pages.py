# -*- coding: utf-8 -*-
"""逐页采集字号、位置、页眉与线条信息，用于 2～11 页版式比对。"""
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿-排版版.pdf"


def profile(path, pages, label):
    doc = pymupdf.open(path)
    for pno in pages:
        page = doc.load_page(pno - 1)
        print("\n===== %s p%d =====" % (label, pno))
        d = page.get_text("dict")
        spans = []
        for block in d["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    if span["text"].strip():
                        spans.append(span)
        # 按 y 排序，取前 14 个
        spans.sort(key=lambda s: (round(s["bbox"][1], 1), s["bbox"][0]))
        for s in spans[:14]:
            print("  y=%6.1f x=%6.1f size=%5.2f %r" % (s["bbox"][1], s["bbox"][0], s["size"], s["text"][:26]))
        lines = []
        for dr in page.get_drawings():
            for item in dr["items"]:
                if item[0] == "l":
                    p1, p2 = item[1], item[2]
                    if abs(p1.y - p2.y) < 0.6 and abs(p2.x - p1.x) > 200:
                        lines.append(p1.y)
                elif item[0] == "re":
                    r = item[1]
                    if r.height < 2 and r.width > 200:
                        lines.append(r.y0)
        if lines:
            print("  long-lines y:", sorted(set(round(y, 1) for y in lines))[:6])
    doc.close()


profile(REF, range(2, 12), "REF")
profile(MINE, range(2, 12), "MINE")
