# -*- coding: utf-8 -*-
"""宽表列宽与表头检测按参考调整。"""
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old_head = 'if head[:3] == ["字段名", "数据类型", "主键"]:'
new_head = 'if head[:3] in (["字段名称", "数据类型", "是否为主键"], ["字段名", "数据类型", "主键"]):'
if old_head in t:
    t = t.replace(old_head, new_head)

old_w = "widths = [3.4, 4.4, 1.15, 1.15, 5.4]"
new_w = "widths = [3.0, 3.9, 2.6, 2.6, 3.4]"
if old_w in t:
    t = t.replace(old_w, new_w)

io.open(p, "w", encoding="utf-8").write(t)
print("head patched:", old_head not in t, "| width patched:", old_w not in t)
