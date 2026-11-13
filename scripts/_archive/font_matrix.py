# -*- coding: utf-8 -*-
"""按元素类别统计字体与字号：页眉/标题/正文/题注/表格/页码。"""
import re
import sys
from collections import Counter, defaultdict

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def classify(span, text):
    y = span["bbox"][1]
    size = round(span["size"], 2)
    font = span["font"]
    if y < 80:
        cat = "页眉"
    elif y > 740:
        cat = "页码/页脚"
    elif re.match(r"^(图|表)\s*\d", text):
        cat = "题注"
    elif size >= 17.5:
        cat = "章标题"
    elif size >= 13.8:
        cat = "节标题"
    elif size >= 11.8 and font == "SimHei":
        cat = "小节标题"
    elif size <= 10.8:
        cat = "表格/小字"
    else:
        cat = "正文"
    return cat, (font, size)


def report(path, label, pages):
    doc = pymupdf.open(path)
    agg = defaultdict(Counter)
    for pno in pages:
        page = doc.load_page(pno - 1)
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                sp = [s for s in l["spans"] if s["text"].strip()]
                if not sp:
                    continue
                text = "".join(s["text"] for s in sp).strip()
                cat, key = classify(sp[0], text)
                agg[cat][key] += 1
    doc.close()
    print("=====", label)
    for cat in ("页眉", "页码/页脚", "章标题", "节标题", "小节标题", "正文", "题注", "表格/小字"):
        if cat in agg:
            top = agg[cat].most_common(3)
            print("  %-8s %s" % (cat, ", ".join("%s %.2fpt ×%d" % (f, s, n) for (f, s), n in top)))


report(REF, "REF 21-30", range(21, 31))
report(MINE, "MINE 21-30", range(21, 31))
