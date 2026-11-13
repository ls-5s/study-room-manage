# -*- coding: utf-8 -*-
"""在 3.1 增加“学生用例图”作为图 3-1，并把原图 3-1～3-15 顺延为 3-2～3-16。"""
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

SPEC = "thesis/figures/specs.json"
CH3 = "thesis/drafts/03-需求分析.md"

specs = json.load(open(SPEC, encoding="utf-8"))

# 1) 文件顺延：fig3-N -> fig3-(N+1)，从大到小避免覆盖
for s in sorted(specs, key=lambda x: x["file"], reverse=True):
    m = re.match(r"fig3-(\d+)\.png$", s["file"])
    if m and int(m.group(1)) >= 1:
        s["file"] = "fig3-%d.png" % (int(m.group(1)) + 1)

new = {
    "file": "fig3-1.png",
    "kind": "usecase",
    "title": "学生用例图",
    "actors": ["学生"],
    "usecases": ["账户管理", "座位查询", "预约提交", "签到", "取消与记录", "违约与反馈"],
}
specs.insert(0, new)
json.dump(specs, open(SPEC, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# 2) 正文编号顺延
md = io.open(CH3, encoding="utf-8").read()
for n in range(15, 0, -1):
    md = md.replace("图 3-%d " % n, "图 3-%d " % (n + 1))
    md = md.replace("fig3-%d.png" % n, "fig3-%d.png" % (n + 1))

# 3) 插入新图（放在原“学生功能结构图”段之后、3.1.1 之前）
anchor = "### 3.1.1 学生端功能需求分析"
block = (
    "学生与系统的交互可以概括为一条主链：先建立账户，再查询座位并提交预约，"
    "到场签到完成使用，离开后查看记录；取消与违约处理中途变化，反馈用于上报问题。"
    "学生用例图如图 3-1 所示，图中的用例与后续各小节的功能说明一一对应。\n\n"
    "![图 3-1 学生用例图](../figures/png/fig3-1.png)\n\n"
    "图 3-1 学生用例图\n\n"
)
if anchor in md and "图 3-1 学生用例图" not in md:
    md = md.replace(anchor, block + anchor, 1)
io.open(CH3, "w", encoding="utf-8").write(md)
print("specs updated:", len(specs))
