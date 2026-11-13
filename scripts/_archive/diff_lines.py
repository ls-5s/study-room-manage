# -*- coding: utf-8 -*-
"""逐行对齐参考与当前 PDF，输出字号/字体/x/y 偏差。"""
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def lines_of(doc, pno):
    page = doc.load_page(pno - 1)
    out = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans:
                continue
            text = "".join(s["text"] for s in spans).strip()
            first = spans[0]
            out.append({
                "y": round(first["bbox"][1], 1),
                "x": round(first["bbox"][0], 1),
                "size": round(first["size"], 2),
                "font": first["font"],
                "text": text[:26],
            })
    out.sort(key=lambda d: (d["y"], d["x"]))
    return out


ref = pymupdf.open(REF)
mine = pymupdf.open(MINE)

for pno in (2, 4, 6, 9):
    r = lines_of(ref, pno)
    m = lines_of(mine, pno)
    print("\n===== page %d =====" % pno)
    print("%-26s %-28s | %-26s %-28s" % ("REF", "", "MINE", ""))
    n = max(len(r), len(m))
    for i in range(min(n, 14)):
        a = r[i] if i < len(r) else None
        b = m[i] if i < len(m) else None
        sa = ("%5.1f %5.1f %4.1f %s" % (a["y"], a["x"], a["size"], a["font"])) if a else ""
        sb = ("%5.1f %5.1f %4.1f %s" % (b["y"], b["x"], b["size"], b["font"])) if b else ""
        ta = a["text"] if a else ""
        tb = b["text"] if b else ""
        print("%-26s %-28s | %-26s %-28s" % (ta, sa, tb, sb))
ref.close()
mine.close()
