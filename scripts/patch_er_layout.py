# -*- coding: utf-8 -*-
"""重排整体 E-R 图：加宽画布，反馈工单放到右下空白，联系位置调整。"""
import json
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "thesis/figures/specs.json"
data = json.load(io.open(p, encoding="utf-8"))

for s in data:
    if s["file"] != "fig4-3.png":
        continue
    s["w"], s["h"] = 2500, 1900
    for e in s["entities"]:
        if e["label"] == "反馈工单":
            e["x"], e["y"] = 2180, 1500
            e["attrs"] = [["反馈ID*", 2400, 1500], ["状态", 2180, 1750],
                          ["内容", 1950, 1650], ["回复", 1980, 1330]]
    for r in s["relations"]:
        if r["label"] == "提交":
            r["x"], r["y"] = 1830, 1229

json.dump(data, io.open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("layout adjusted")
