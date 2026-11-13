# -*- coding: utf-8 -*-
"""字段表用固定列宽：3.0/3.2/1.4/1.4/6.5 cm，避免 BIGINT UNSIGNED 折行。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''    cols = len(rows[0])
    lens = []'''
new = '''    cols = len(rows[0])
    head = [c.strip() for c in rows[0]]
    if head[:3] == ["字段名", "数据类型", "主键"]:
        widths = [3.0, 3.2, 1.4, 1.4, 6.5]
    else:
        lens = []'''
assert old in t
t = t.replace(old, new, 1)

# 原来的 content 计算需要缩进到 else 分支
old2 = '''    for c in range(cols):
        longest = max((len(r[c]) if c < len(r) else 0) for r in rows)
        lens.append(max(longest, 3) ** 0.75)
    total = sum(lens)
    widths = [max(1.4, 15.5 * v / total) for v in lens]
    scale = 15.5 / sum(widths)
    widths = [w * scale for w in widths]'''
new2 = '''        for c in range(cols):
            longest = max((len(r[c]) if c < len(r) else 0) for r in rows)
            lens.append(max(longest, 3) ** 0.75)
        total = sum(lens)
        widths = [max(1.4, 15.5 * v / total) for v in lens]
        scale = 15.5 / sum(widths)
        widths = [w * scale for w in widths]'''
assert old2 in t
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("schema table widths fixed")
