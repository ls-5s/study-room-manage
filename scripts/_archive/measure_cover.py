# -*- coding: utf-8 -*-
"""测量封面文字字号与下划线间距。"""
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")


def dump(path, label):
    doc = pymupdf.open(path)
    page = doc.load_page(0)
    print("=====", label, "=====")
    d = page.get_text("dict")
    for block in d["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                txt = span["text"].strip()
                if not txt:
                    continue
                bb = span["bbox"]
                print("text=%r size=%.2f bbox_y0=%.1f y1=%.1f x0=%.1f" % (txt, span["size"], bb[1], bb[3], bb[0]))
    print("--- horizontal lines ---")
    for dr in page.get_drawings():
        for item in dr["items"]:
            if item[0] == "l":
                p1, p2 = item[1], item[2]
                if abs(p1.y - p2.y) < 0.5 and abs(p2.x - p1.x) > 40:
                    print("line y=%.1f x=%.1f..%.1f width=%.2f" % (p1.y, min(p1.x, p2.x), max(p1.x, p2.x), dr.get("width", 0)))
            elif item[0] == "re":
                r = item[1]
                if r.height < 1.5 and r.width > 40:
                    print("rect y=%.1f x=%.1f..%.1f h=%.2f" % (r.y0, r.x0, r.x1, r.height))
    doc.close()


dump(r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf", "REF")
dump(r"thesis\final\论文终稿-排版版.pdf", "MINE")
