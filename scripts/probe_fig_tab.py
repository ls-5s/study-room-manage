# -*- coding: utf-8 -*-
"""统计参考与本稿的图题、表题、表格线、图片尺寸、代码块格式。"""
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def summarize(path, label, p0, p1):
    doc = pymupdf.open(path)
    caps = []
    tables = 0
    images = []
    for pno in range(p0, min(p1, doc.page_count) + 1):
        page = doc.load_page(pno - 1)
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                sp = [s for s in l["spans"] if s["text"].strip()]
                if not sp:
                    continue
                t = "".join(s["text"] for s in sp).strip()
                if t.startswith("图 ") or t.startswith("表 "):
                    caps.append((round(sp[0]["size"], 2), sp[0]["font"], round(sp[0]["bbox"][0], 1),
                                 round(sp[0]["bbox"][1], 1), t[:22]))
        for dr in page.get_drawings():
            types = {it[0] for it in dr["items"]}
            if "l" in types or "re" in types:
                pass
        for img in page.get_images(full=True):
            rects = page.get_image_rects(img[0])
            for r in rects:
                images.append((round(r.width, 1), round(r.height, 1)))
    doc.close()
    print("== %s p%d-%d ==" % (label, p0, p1))
    print("  图/表题 %d 条，示例：" % len(caps))
    for c in caps[:10]:
        print("   size=%.2f font=%-10s x=%6.1f y=%6.1f %r" % c)
    print("  图片 %d 张，尺寸示例：" % len(images), images[:6])


summarize(REF, "REF", 10, 30)
summarize(MINE, "MINE", 10, 30)
