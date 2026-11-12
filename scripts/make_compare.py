# -*- coding: utf-8 -*-
"""生成“参考 | 本稿”并排对比图。"""
import sys

import pymupdf
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"
DPI = 120

pairs = [(41, 47, "table"), (33, 34, "er"), (50, 62, "code")]

for ref_p, my_p, tag in pairs:
    a = pymupdf.open(REF).load_page(ref_p - 1).get_pixmap(dpi=DPI)
    b = pymupdf.open(MINE).load_page(my_p - 1).get_pixmap(dpi=DPI)
    ia = Image.frombytes("RGB", (a.width, a.height), a.samples)
    ib = Image.frombytes("RGB", (b.width, b.height), b.samples)
    h = max(ia.height, ib.height)
    sheet = Image.new("RGB", (ia.width + ib.width + 30, h + 30), "white")
    sheet.paste(ia, (10, 24))
    sheet.paste(ib, (ia.width + 20, 24))
    d = ImageDraw.Draw(sheet)
    font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 16)
    d.text((10, 4), "参考 第 %d 页" % ref_p, font=font, fill=(200, 0, 0))
    d.text((ia.width + 20, 4), "本稿 第 %d 页" % my_p, font=font, fill=(0, 110, 200))
    out = "thesis/reports/pages/cmp-%s.png" % tag
    sheet.save(out)
    print(out, sheet.size)
