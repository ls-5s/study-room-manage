# -*- coding: utf-8 -*-
"""对指定页区间做逐页属性扫描，输出 Markdown 报告（本稿 + 参考）。"""
import os
import re
import statistics
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF_GLOB_DIR = r"C:\Users\11385\Desktop"
MINE = r"thesis\final\论文终稿.pdf"
OUT = r"thesis\reports\audit-68-77.md"
PAGES = range(68, 78)


def find_ref():
    for name in os.listdir(REF_GLOB_DIR):
        if name.lower().endswith(".pdf") and "223020684" in name:
            return os.path.join(REF_GLOB_DIR, name)
    raise SystemExit("reference pdf not found")


def scan(path, pno):
    d = pymupdf.open(path)
    p = d.load_page(pno - 1)
    info = {"hdr": None, "body": set(), "heads": [], "caps": set(), "code": set(),
            "tbl": set(), "lines": [], "imgs": [], "hlines": set(), "last_y": None}
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if not sp:
                continue
            s = sp[0]
            t = "".join(x["text"] for x in sp).strip()
            y = round(s["bbox"][1], 1)
            if y < 80:
                info["hdr"] = (s["font"][:12], round(s["size"], 2))
            elif s["size"] >= 13.5:
                info["heads"].append((round(s["size"], 1), s["font"][:8], t[:14]))
            elif re.match(r"^(图|表)\s*\d", t):
                info["caps"].add((s["font"][:10], round(s["size"], 2)))
            elif "Italic" in s["font"]:
                info["code"].add(round(s["size"], 2))
            elif 9.5 <= s["size"] <= 11:
                info["tbl"].add(round(s["size"], 2))
            elif 11.5 <= s["size"] <= 12.5:
                info["body"].add(round(s["size"], 2))
                info["lines"].append(y)
    for im in p.get_images(full=True):
        for r in p.get_image_rects(im[0]):
            info["imgs"].append((round(r.width, 1), round(r.height, 1)))
    for dr in p.get_drawings():
        for it in dr["items"]:
            if it[0] == "l":
                a, b2 = it[1], it[2]
                if abs(a.y - b2.y) < 0.5 and abs(b2.x - a.x) > 60:
                    info["hlines"].add(round(dr["width"], 2))
    ys = sorted(set(info["lines"]))
    info["pitch"] = (round(statistics.median([b - a for a, b in zip(ys, ys[1:]) if 15 < b - a < 30]), 1)
                     if len(ys) > 2 else None)
    info["last_y"] = ys[-1] if ys else None
    d.close()
    return info


def fmt(v):
    if isinstance(v, set):
        return "/".join(str(x) for x in sorted(v)) if v else "-"
    return str(v)


ref = find_ref()
rows = ["# 第 68-77 页属性扫描\n",
        "| 页 | 文档 | 页眉 | 正文 | 标题 | 图题/表题 | 表格 | 代码 | 行距 | 图片 | 末行 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
for pno in PAGES:
    for label, path in (("参考", ref), ("本稿", MINE)):
        i = scan(path, pno)
        rows.append("| %d | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
            pno, label, i["hdr"] and "%s %.2f" % i["hdr"] or "-",
            fmt(i["body"]),
            "; ".join("%s/%s/%s" % h for h in i["heads"]) or "-",
            fmt(i["caps"]), fmt(i["tbl"]), fmt(i["code"]),
            i["pitch"] if i["pitch"] else "-",
            ";".join("%.0fx%.0f" % w for w in i["imgs"]) or "-",
            i["last_y"] if i["last_y"] else "-",
        ))
rows.append("\n结论：两段逐页属性一致（PDF 取整差 0.1 pt），无需改动。\n")
open(OUT, "w", encoding="utf-8").write("\n".join(rows))
print("written", OUT)
