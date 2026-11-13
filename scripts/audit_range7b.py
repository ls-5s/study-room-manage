# -*- coding: utf-8 -*-
"""指定页区间的七项属性统计：字体/字号/行距/表格/代码/图题/页眉页码。"""
import collections
import os
import re
import statistics
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

MINE = r"thesis\final\论文终稿.pdf"
PAGES = range(38, 48)


def find_ref():
    for name in os.listdir(r"C:\Users\11385\Desktop"):
        if name.lower().endswith(".pdf") and "223020684" in name:
            return os.path.join(r"C:\Users\11385\Desktop", name)
    raise SystemExit("ref not found")


def scan(path, pages):
    d = pymupdf.open(path)
    r = collections.Counter()
    out = {"hdr": collections.Counter(), "pagenum": collections.Counter(),
           "body": collections.Counter(), "cap": collections.Counter(),
           "cell": collections.Counter(), "code": collections.Counter(),
           "head": collections.Counter()}
    pitch, code_pitch, cell_pitch, cap_gap = [], [], [], []
    for pno in pages:
        if pno < 1 or pno > d.page_count:
            continue
        p = d.load_page(pno - 1)
        rows, ys, cys, codeys = [], [], [], []
        for b in p.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                sp = [s for s in l["spans"] if s["text"].strip()]
                if not sp:
                    continue
                s = sp[0]
                t = "".join(x["text"] for x in sp).strip()
                y = s["bbox"][1]
                size = round(s["size"], 2)
                font = s["font"]
                rows.append((y, t, size, font))
                if y < 80:
                    out["hdr"][(font, size)] += 1
                elif y > 760 and t.isdigit():
                    out["pagenum"][(font, size, round(y, 1))] += 1
                elif s["size"] >= 13.5:
                    out["head"][(round(s["size"], 1), font)] += 1
                elif re.match(r"^(图|表)\s*\d", t):
                    out["cap"][(font, size)] += 1
                elif "Italic" in font:
                    out["code"][(font, size)] += 1
                    codeys.append(y)
                elif 9.8 <= s["size"] <= 11:
                    out["cell"][(font, size)] += 1
                    cys.append(y)
                elif 11.5 <= s["size"] <= 12.5:
                    out["body"][(font, size)] += 1
                    ys.append(y)
        for arr, dst in ((ys, pitch), (codeys, code_pitch), (cys, cell_pitch)):
            u = sorted(set(round(v, 1) for v in arr))
            dst += [round(b - a, 1) for a, b in zip(u, u[1:]) if 8 < b - a < 30]
        rows.sort()
        for j, (y, t, size, font) in enumerate(rows):
            if j + 1 < len(rows) and re.match(r"^(图|表)\s*\d", t):
                g = round(rows[j + 1][0] - y, 1)
                if 10 < g < 40:
                    cap_gap.append(g)
    d.close()
    return out, pitch, code_pitch, cell_pitch, cap_gap


def top(c, n=2):
    return ", ".join("%s %s×%d" % (k[0], k[1], v) for k, v in c.most_common(n))


def med(v):
    return statistics.median(v) if v else None


for label, path in (("参考", find_ref()), ("本稿", MINE)):
    out, pitch, cp, tcp, cg = scan(path, PAGES)
    print("####", label, "页", PAGES.start, "-", PAGES.stop - 1)
    print(" 页眉:", top(out["hdr"]))
    print(" 页码:", top(out["pagenum"]))
    print(" 标题:", top(out["head"], 3))
    print(" 正文:", top(out["body"]), "| 行距", med(pitch))
    print(" 图题/表题:", top(out["cap"]), "| 题注后间距", med(cg))
    print(" 表格:", top(out["cell"]), "| 行距", med(tcp))
    print(" 代码:", top(out["code"]), "| 行距", med(cp))
