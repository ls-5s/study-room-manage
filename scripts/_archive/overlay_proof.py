# -*- coding: utf-8 -*-
"""参考原文 + 本稿格式的验证页与参考页叠图。"""
import sys

import pymupdf
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
PROOF = r"thesis\final\格式验证.pdf"
DPI = 130

a = pymupdf.open(REF).load_page(1).get_pixmap(dpi=DPI)
b = pymupdf.open(PROOF).load_page(0).get_pixmap(dpi=DPI)
ia = Image.frombytes("RGB", (a.width, a.height), a.samples).convert("L")
ib = Image.frombytes("RGB", (b.width, b.height), b.samples).convert("L")
w, h = min(ia.width, ib.width), min(ia.height, ib.height)
ia, ib = ia.crop((0, 0, w, h)), ib.crop((0, 0, w, h))
Image.merge("RGB", (ia, ib, ib)).save("thesis/reports/pages/overlay-proof-p2.png")
print("overlay-proof-p2.png", (w, h))
