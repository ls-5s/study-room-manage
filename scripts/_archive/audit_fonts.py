# -*- coding: utf-8 -*-
"""全文审计：每页出现的字体/字号组合，标出不属于预期集合的情况。"""
import sys
from collections import Counter

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

MINE = r"thesis\final\论文终稿.pdf"
EXPECT_SIZE = {18.0, 14.05, 12.0, 10.45, 10.5, 9.0, 5.75, 6.0, 15.0, 15.95, 16.0, 24.5, 26.0, 10.4}
EXPECT_FONT = {"SimSun", "SimHei", "KaiTi", "DengXian", "STXingkai", "STZhongsong",
               "TimesNewRomanPSMT", "TimesNewRomanPS-BoldMT", "MicrosoftYaHei-Bold",
               "MicrosoftYaHei", "SimSun-Bold", "SimHei-Bold"}

doc = pymupdf.open(MINE)
odd_pages = []
for pno in range(1, doc.page_count + 1):
    page = doc.load_page(pno - 1)
    sizes, fonts = Counter(), Counter()
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                if s["text"].strip():
                    sizes[round(s["size"], 2)] += 1
                    fonts[s["font"]] += 1
    bad_sizes = {k: v for k, v in sizes.items() if k not in EXPECT_SIZE and v > 3}
    bad_fonts = {k: v for k, v in fonts.items() if k not in EXPECT_FONT and v > 3}
    if bad_sizes or bad_fonts:
        odd_pages.append((pno, bad_sizes, bad_fonts))

print("异常页数:", len(odd_pages))
for pno, bs, bf in odd_pages[:20]:
    print(" p%d sizes=%s fonts=%s" % (pno, bs, bf))
doc.close()
