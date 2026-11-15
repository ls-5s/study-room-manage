# -*- coding: utf-8 -*-
"""全文逐页一致性检查：按参考规格标出偏差页。"""
import collections
import re
import statistics
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

PDF = r"thesis\final\论文终稿.pdf"
SPEC = {
    "hdr": ("STXingkai", 10.45),
    "pagenum": ("TimesNewRomanPSMT", 10.45),
    "body": ("SimSun", 12.0),
    "cap": ("SimSun", 10.45),
    "cell": ("SimSun", 10.45),
    "code": ("TimesNewRomanPS-ItalicMT", 10.45),
}
BODY_PITCH = 22.0
CODE_PITCH = 20.0
CELL_PITCH = 22.0

d = pymupdf.open(PDF)
problems = collections.defaultdict(list)
for i in range(d.page_count):
    p = d.load_page(i)
    pno = i + 1
    ys, cys, codeys = [], [], []
    rows = []
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if not sp:
                continue
            s = sp[0]
            t = "".join(x["text"] for x in sp).strip()
            y = s["bbox"][1]
            font, size = s["font"], round(s["size"], 2)
            rows.append((y, t, font, size))
            if y < 80:
                if (font, size) != SPEC["hdr"] and pno > 7:
                    problems["hdr"].append((pno, font, size))
            elif y > 760 and t.isdigit():
                if "Times" not in font or abs(size - 10.45) > 0.2:
                    problems["pagenum"].append((pno, font, size))
            elif s["size"] >= 13.5:
                if abs(size - 18) > 0.3 and abs(size - 14) > 0.3:
                    problems["head"].append((pno, round(size, 1), t[:12]))
            elif re.match(r"^(图|表)\s*\d", t):
                if font != "SimSun" or abs(size - 10.45) > 0.2:
                    problems["cap"].append((pno, font, size, t[:12]))
                if abs(s["bbox"][0] + s["bbox"][2] - 609.4) > 30:
                    pass
            elif "Italic" in font:
                if abs(size - 10.45) > 0.2:
                    problems["code"].append((pno, round(size, 2)))
                codeys.append(y)
            elif 9.8 <= s["size"] <= 11:
                if font not in ("SimSun", "TimesNewRomanPSMT") or abs(size - 10.45) > 0.2:
                    problems["cell"].append((pno, font, size))
                cys.append(y)
            elif 11.5 <= s["size"] <= 12.5:
                ys.append(y)
    for arr, name, target in ((ys, "body_pitch", BODY_PITCH), (codeys, "code_pitch", CODE_PITCH), (cys, "cell_pitch", CELL_PITCH)):
        u = sorted(set(round(v, 1) for v in arr))
        gaps = [round(b - a, 1) for a, b in zip(u, u[1:]) if 8 < b - a < 30]
        if gaps:
            m = statistics.median(gaps)
            if abs(m - target) > 0.6:
                problems[name].append((pno, m))

d.close()
print("pages", pymupdf.open(PDF).page_count)
for k in ("hdr", "pagenum", "head", "cap", "cell", "code", "body_pitch", "code_pitch", "cell_pitch"):
    v = problems.get(k, [])
    print("%-10s %3d %s" % (k, len(v), v[:6]))
