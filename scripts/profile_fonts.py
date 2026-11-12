# -*- coding: utf-8 -*-
"""对比字体名（判断宋体/黑体/加粗）与字号、行距。"""
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")


def dump(path, pages, label):
    doc = pymupdf.open(path)
    for pno in pages:
        page = doc.load_page(pno - 1)
        print("\n===== %s p%d =====" % (label, pno))
        spans = []
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for s in line["spans"]:
                    if s["text"].strip():
                        spans.append(s)
        spans.sort(key=lambda s: (round(s["bbox"][1], 1), s["bbox"][0]))
        for s in spans[:10]:
            print("  y=%6.1f size=%5.2f font=%-22s %r" % (
                s["bbox"][1], s["size"], s["font"], s["text"][:20]))
    doc.close()


REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿-排版版.pdf"
dump(REF, [2, 4, 6, 9], "REF")
dump(MINE, [2, 4, 6, 9], "MINE")
