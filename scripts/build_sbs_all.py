# -*- coding: utf-8 -*-
"""按章节/小节对齐，生成全文逐页并排对比图与 PDF。"""
import io
import os
import re
import sys

import pymupdf
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

MINE = r"thesis\final\论文终稿.pdf"
REF_DIR = r"C:\Users\11385\Desktop"
OUT_DIR = r"thesis\reports\pages\sbs_all"
OUT_PDF = r"thesis\reports\全文并排对比.pdf"
DPI = 90


def find_ref():
    for name in os.listdir(REF_DIR):
        if name.lower().endswith(".pdf") and "223020684" in name:
            return os.path.join(REF_DIR, name)
    raise SystemExit("ref not found")


def headings(path):
    d = pymupdf.open(path)
    out = []
    for i in range(d.page_count):
        p = d.load_page(i)
        best = None
        for b in p.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                sp = [s for s in l["spans"] if s["text"].strip()]
                if not sp:
                    continue
                s = sp[0]
                t = "".join(x["text"] for x in sp).strip()
                if s["size"] >= 11.8 and ("SimHei" in s["font"] or "Hei" in s["font"]):
                    if best is None:
                        best = t[:30]
        if best:
            out.append((i, best))
    d.close()
    return out


mine_h = headings(MINE)
ref_h = headings(find_ref())

# 用标题文本序列做顺序对齐（忽略编号差异）
def norm(t):
    t = re.sub(r"^[\d\.\s]+", "", t)
    return re.sub(r"\s+", "", t)[:12]


ref_map = {}
j = 0
for pno, t in mine_h:
    key = norm(t)
    k = j
    while k < len(ref_h) and key not in norm(ref_h[k][1]):
        k += 1
    if k < len(ref_h):
        ref_map[pno] = ref_h[k][0]
        j = k

# 页映射：某页到下一个已知标题之前，用同一偏移
ref_pages = {}
anchor_mine = sorted(ref_map)
for idx, mp in enumerate(anchor_mine):
    rp = ref_map[mp]
    end = anchor_mine[idx + 1] if idx + 1 < len(anchor_mine) else 10 ** 6
    off = rp - mp
    for p in range(mp, min(end, 124)):
        ref_pages[p] = max(0, p + off)

ref = pymupdf.open(find_ref())
mine = pymupdf.open(MINE)
os.makedirs(OUT_DIR, exist_ok=True)

font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 16)
images = []
for p in range(1, mine.page_count + 1):
    rp = ref_pages.get(p, p)
    rp = min(max(1, rp), ref.page_count)
    a = ref.load_page(rp - 1).get_pixmap(dpi=DPI)
    b = mine.load_page(p - 1).get_pixmap(dpi=DPI)
    ia = Image.frombytes("RGB", (a.width, a.height), a.samples)
    ib = Image.frombytes("RGB", (b.width, b.height), b.samples)
    h = max(ia.height, ib.height)
    s = Image.new("RGB", (ia.width + ib.width + 24, h + 28), "white")
    s.paste(ia, (8, 24))
    s.paste(ib, (ia.width + 16, 24))
    d = ImageDraw.Draw(s)
    d.text((8, 4), "参考 第%d页" % rp, font=font, fill=(200, 0, 0))
    d.text((ia.width + 16, 4), "本稿 第%d页" % p, font=font, fill=(0, 110, 200))
    fn = os.path.join(OUT_DIR, "sbs-%03d.png" % p)
    s.save(fn)
    images.append(s.convert("RGB"))

images[0].save(OUT_PDF, save_all=True, append_images=images[1:], resolution=DPI)
print("pages:", len(images), "pdf:", OUT_PDF)
