# -*- coding: utf-8 -*-
"""ER 图收尾：下划线加粗、回复与座位编号属性避让连线。"""
import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

# 1) 渲染器：下划线 3px、位置上移
p = "scripts/render_diagrams.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace('''                uy = ay + 16
                d.line([ax - tw / 2, uy, ax + tw / 2, uy], fill=LINE, width=2)''',
'''                uy = ay + 14
                d.line([ax - tw / 2, uy, ax + tw / 2, uy], fill=LINE, width=3)''')
io.open(p, "w", encoding="utf-8").write(t)

# 2) 规格：属性避让
sp = "thesis/figures/specs.json"
data = json.load(io.open(sp, encoding="utf-8"))
for s in data:
    if s["file"] != "fig4-3.png":
        continue
    s["h"] = 1800
    for e in s["entities"]:
        if e["label"] == "座位":
            e["attrs"] = [["座位ID*", 80, 690], ["座位编号", 150, 560],
                          ["行号", 70, 865], ["列号", 210, 965]]
        if e["label"] == "反馈工单":
            e["attrs"] = [["反馈ID*", 2400, 1500], ["状态", 2180, 1760],
                          ["内容", 1950, 1690], ["回复", 2360, 1640]]
json.dump(data, io.open(sp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("patched")
