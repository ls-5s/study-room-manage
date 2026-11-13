# -*- coding: utf-8 -*-
"""检查加粗标志与行距（flags 位 4 = bold / 位 5 = italic）。"""
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def show(path, pno, label, limit=8):
    doc = pymupdf.open(path)
    page = doc.load_page(pno - 1)
    spans = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                if s["text"].strip():
                    spans.append(s)
    spans.sort(key=lambda s: (round(s["bbox"][1], 1), s["bbox"][0]))
    print("\n== %s p%d ==" % (label, pno))
    for s in spans[:limit]:
        flags = s["flags"]
        bold = bool(flags & 16)
        print("  y=%6.1f size=%5.2f font=%-20s bold=%-5s %r" % (
            s["bbox"][1], s["size"], s["font"], bold, s["text"][:18]))
    doc.close()


for pno in (2, 4, 9):
    show(REF, pno, "REF")
    show(MINE, pno, "MINE")
