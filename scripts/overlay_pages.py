# -*- coding: utf-8 -*-
"""参考页（红）与本稿（青）半透明叠加，错位会显示成红/青色。"""
import sys

import pymupdf
from PIL import Image, ImageChops

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"
DPI = 130


def render(path, pno):
    doc = pymupdf.open(path)
    page = doc.load_page(pno - 1)
    pix = page.get_pixmap(dpi=DPI)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples).convert("L")
    doc.close()
    return img


for pno in (2, 4, 6, 9):
    a = render(REF, pno)
    b = render(MINE, pno)
    w = min(a.width, b.width)
    h = min(a.height, b.height)
    a = a.crop((0, 0, w, h))
    b = b.crop((0, 0, w, h))
    out = Image.merge("RGB", (a, b, b))
    out.save("thesis/reports/pages/overlay-p%03d.png" % pno)
    print("overlay-p%03d.png" % pno, out.size)
