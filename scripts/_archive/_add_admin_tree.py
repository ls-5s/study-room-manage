# -*- coding: utf-8 -*-
"""1) 第 3 章补管理端功能结构图（图 3-8），其后图号顺延；
2) 修正第 5 章插入截图造成的图表顺序错乱。"""
import io
import re

# ---------- 1. 第 3 章图号顺延 ----------
p = "thesis/drafts/03-需求分析.md"
t = io.open(p, encoding="utf-8").read()


def bump(m):
    n = int(m.group(1))
    return "图 3-%d" % (n + 1 if 8 <= n <= 14 else n)


def bumpf(m):
    n = int(m.group(1))
    return "fig3-%d.png" % (n + 1 if 8 <= n <= 14 else n)


t = re.sub(r"图 3-(\d+)", bump, t)
t = re.sub(r"fig3-(\d+)\.png", bumpf, t)

BLOCK = """管理端的功能可归为六个方面，其结构如图 3-8 所示。资源部分由自习室、开放时段与座位三层构成；业务部分围绕预约与违约展开；服务部分处理反馈与运营数据。六个方面共用同一套数据，但在权限上彼此隔离，管理员只能在自己的职责范围内操作。

![图 3-8 管理员功能结构图](../figures/png/fig3-8.png)

图 3-8 管理员功能结构图

"""

anchor = "### 3.1.2 管理端功能需求分析\n\n"
i = t.find(anchor)
assert i > 0
t = t[: i + len(anchor)] + BLOCK + t[i + len(anchor):]
io.open(p, "w", encoding="utf-8").write(t)
print("ch3 tree inserted")

# ---------- 2. spec：新增管理端功能结构图 ----------
p2 = "scripts/build_specs.py"
s = io.open(p2, encoding="utf-8").read()
s = re.sub(r'"fig3-(\d+)\.png"', lambda m: '"fig3-%d.png"' % (int(m.group(1)) + 1 if 8 <= int(m.group(1)) <= 14 else int(m.group(1))), s)
TREE = '''specs.append({"file": "fig3-8.png", "kind": "tree", "title": "管理员功能结构图",
              "root": "管理员",
              "items": ["自习室管理", "时段与座位维护", "预约管理", "违约管理", "反馈处理", "统计与报表"]})

'''
j = s.find('uc("fig3-9.png"')
assert j > 0
s = s[:j] + TREE + s[j:]
io.open(p2, "w", encoding="utf-8").write(s)
print("spec added")

# ---------- 3. 第 5 章：题注回到图下方 ----------
CAPS = ["图 5-2 学生登录页面", "图 5-5 学生选座页面", "图 5-12 取消预约确认弹窗",
        "图 5-17 管理端仪表盘", "图 5-20 座位管理页面", "图 5-23 预约管理页面",
        "图 5-28 工单详情页面", "图 5-31 系统设置页面"]

for name in ["05-详细设计与实现-1.md", "05-详细设计与实现-2.md"]:
    path = "thesis/drafts/" + name
    lines = io.open(path, encoding="utf-8").read().split("\n")
    for cap in CAPS:
        img_idx = next((i for i, l in enumerate(lines) if l.startswith("![" + cap + "]")), None)
        cap_idx = next((i for i, l in enumerate(lines) if l.strip() == cap), None)
        if img_idx is None or cap_idx is None:
            continue
        if cap_idx > img_idx + 2:
            del lines[cap_idx]
            lines[img_idx + 1: img_idx + 1] = [cap, ""]
    # 合并多余空行
    out = []
    for l in lines:
        if l == "" and out and out[-1] == "":
            continue
        out.append(l)
    io.open(path, "w", encoding="utf-8").write("\n".join(out))
print("ch5 captions reordered")
