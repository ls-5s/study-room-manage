# -*- coding: utf-8 -*-
"""在 3.1.2 增加“管理员用例图”作为图 3-10，原图 3-10～3-16 顺延为 3-11～3-17。"""
import io
import json
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

SPEC = "thesis/figures/specs.json"
CH3 = "thesis/drafts/03-需求分析.md"

specs = json.load(open(SPEC, encoding="utf-8"))
for s in sorted(specs, key=lambda x: x["file"], reverse=True):
    m = re.match(r"fig3-(\d+)\.png$", s["file"])
    if m and int(m.group(1)) >= 10:
        s["file"] = "fig3-%d.png" % (int(m.group(1)) + 1)

new = {
    "file": "fig3-10.png",
    "kind": "usecase",
    "title": "",
    "actors": ["管理员"],
    "usecases": ["自习室管理", "时段与座位维护", "预约管理", "违约管理", "反馈处理", "统计与设置"],
}
specs.append(new)
specs.sort(key=lambda x: (len(x["file"]), x["file"]))
json.dump(specs, open(SPEC, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

md = io.open(CH3, encoding="utf-8").read()
for n in range(16, 9, -1):
    md = md.replace("图 3-%d " % n, "图 3-%d " % (n + 1))
    md = md.replace("fig3-%d.png" % n, "fig3-%d.png" % (n + 1))

anchor = "管理端的功能围绕资源的可维护性与异常的可处理性展开"
block = (
    "管理端的用例围绕资源维护与异常处理展开：先维护自习室，再配置时段与座位，"
    "日常处理预约、违约与反馈，最后查看统计数据并调整系统设置。管理员用例图如图 3-10 所示，"
    "与后续各小节的功能说明一一对应。\n\n"
    "![图 3-10 管理员用例图](../figures/png/fig3-10.png)\n\n"
    "图 3-10 管理员用例图\n\n"
)
if anchor in md and "图 3-10 管理员用例图" not in md:
    md = md.replace(anchor, block + anchor, 1)
io.open(CH3, "w", encoding="utf-8").write(md)
print("done", len(specs))
