# -*- coding: utf-8 -*-
"""逐页关键版式指标对比：页眉、页码、首行、行距、右端。"""
import statistics
import sys

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")

REF = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
MINE = r"thesis\final\论文终稿.pdf"


def metrics(path, pno):
    doc = pymupdf.open(path)
    page = doc.load_page(pno - 1)
    spans = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if sp:
                spans.append(sp)
    spans.sort(key=lambda sp: (round(sp[0]["bbox"][1], 1), sp[0]["bbox"][0]))
    header = next((sp[0] for sp in spans if sp[0]["bbox"][1] < 80), None)
    pageno = next((sp[0] for sp in spans if sp[0]["bbox"][1] > 740), None)
    body = [sp[0] for sp in spans if 90 < sp[0]["bbox"][1] < 740]
    pitch = None
    if len(body) > 3:
        ys = [round(s["bbox"][1], 1) for s in body[1:6]]
        diffs = [round(b - a, 1) for a, b in zip(ys, ys[1:])]
        pitch = statistics.median(diffs) if diffs else None
    right = None
    if body:
        rights = [round(max(s["bbox"][2] for s in sp), 1) for sp in spans[2:8]]
        right = statistics.median(rights)
    lines = []
    for dr in page.get_drawings():
        for it in dr["items"]:
            if it[0] == "re" and it[1].height < 3 and it[1].width > 200:
                lines.append(round(it[1].y0, 1))
    doc.close()
    return {
        "hdr_y": round(header["bbox"][1], 1) if header else None,
        "hdr_size": round(header["size"], 1) if header else None,
        "pn_y": round(pageno["bbox"][1], 1) if pageno else None,
        "first_y": round(body[0]["bbox"][1], 1) if body else None,
        "first_x": round(body[0]["bbox"][0], 1) if body else None,
        "pitch": pitch,
        "right": right,
        "rule_y": lines[0] if lines else None,
    }


print("%-3s %-38s %-38s" % ("pg", "REF", "MINE"))
for pno in range(2, 11):
    a, b = metrics(REF, pno), metrics(MINE, pno)
    fmt = lambda d: "hdr%s/%s pn%s y%s x%s p%s r%s" % (
        d["hdr_y"], d["hdr_size"], d["pn_y"], d["first_y"], d["first_x"], d["pitch"], d["right"])
    print("%-3d %-38s %-38s" % (pno, fmt(a), fmt(b)))
