# -*- coding: utf-8 -*-
"""修正整体 E-R 图规格：主键标记、去重、补反馈工单实体。"""
import json
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "thesis/figures/specs.json"
data = json.load(io.open(p, encoding="utf-8"))

for s in data:
    if s["file"] != "fig4-3.png":
        continue
    # 1) 主键加 *
    key_names = {"自习室ID", "座位ID", "时段ID", "预约ID", "用户ID", "违约ID", "签到ID", "反馈ID"}
    for e in s["entities"]:
        for a in e["attrs"]:
            if a[0] in key_names and not a[0].endswith("*"):
                a[0] = a[0] + "*"
    # 2) 座位属性去重：改为 座位编号 + 行号 + 列号
    for e in s["entities"]:
        if e["label"] == "座位":
            e["attrs"] = [["座位ID*", 80, 690], ["座位编号", 190, 585],
                          ["行号", 70, 865], ["列号", 210, 965]]
    # 3) 补反馈工单实体与联系
    if not any(e["label"] == "反馈工单" for e in s["entities"]):
        s["entities"].append({
            "id": "f", "label": "反馈工单", "x": 1830, "y": 1470,
            "attrs": [["反馈ID*", 2035, 1470], ["状态", 1830, 1640],
                      ["内容", 1625, 1560], ["回复", 1650, 1330]],
        })
        s["relations"].append({
            "from": "u", "to": "f", "label": "提交", "c1": "1", "c2": "N",
            "x": 1620, "y": 1170,
        })

json.dump(data, io.open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("fig4-3 spec updated")
