# -*- coding: utf-8 -*-
"""参考页与本稿页并排（同比例），便于直接看差距。"""
import sys

import pymupdf
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"
DPI = 110


def render(path, pno):
    doc = pymupdf.open(path)
    pix = doc.load_page(pno - 1).get_pixmap(dpi=DPI)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()
    return img


for pno in (1, 2, 4, 9):
    a, b = render(REF, pno), render(MINE, pno)
    h = max(a.height, b.height)
    sheet = Image.new("RGB", (a.width + b.width + 30, h + 30), "white")
    sheet.paste(a, (10, 20))
    sheet.paste(b, (a.width + 20, 20))
    ImageDraw.Draw(sheet).text((10, 4), "REF p%d" % pno, fill=(200, 0, 0))
    ImageDraw.Draw(sheet).text((a.width + 20, 4), "MINE p%d" % pno, fill=(0, 120, 200))
    sheet.save("thesis/reports/pages/sbs-p%03d.png" % pno)
    print("sbs-p%03d.png" % pno, sheet.size)
