# -*- coding: utf-8 -*-
"""把第 3 章图号整体后移一位，为新插入的图 3-1 让位；并把局部 E-R 图与实体属性图放到第 4 章正确位置。"""
import io
import os

# 1) 草稿中的图号与文件名整体后移（从大到小替换，避免串号）
p = "thesis/drafts/03-需求分析.md"
t = io.open(p, encoding="utf-8").read()
for n in range(10, 0, -1):
    t = t.replace(f"图 3-{n}", f"图 3-{n + 1}")
    t = t.replace(f"fig3-{n}.png", f"fig3-{n + 1}.png")
io.open(p, "w", encoding="utf-8").write(t)
print("chapter 3 renumbered")

# 2) specs 中的文件名后移
p2 = "scripts/build_specs.py"
s = io.open(p2, encoding="utf-8").read()
for n in range(10, 0, -1):
    s = s.replace(f'"fig3-{n}.png"', f'"fig3-{n + 1}.png"')
io.open(p2, "w", encoding="utf-8").write(s)
print("spec files renumbered")

# 3) 删除旧图，避免残留
for f in os.listdir("thesis/figures/png"):
    if f.startswith("fig3-"):
        os.remove(os.path.join("thesis/figures/png", f))
print("old fig3 png removed")
