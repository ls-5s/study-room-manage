# -*- coding: utf-8 -*-
"""收紧封面字段区：参考的标签列约 2.4 cm、值列约 7.6 cm，整块居中。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
pairs = [
    ("    VALUE_SIZE = 14.5\n    LABEL_SIZE = 15.5\n    W_LABEL, W_VALUE = Cm(3.6), Cm(10.2)",
     "    VALUE_SIZE = 15\n    LABEL_SIZE = 15\n    W_LABEL, W_VALUE = Cm(2.4), Cm(7.6)"),
    ("    table.rows[0].height = Cm(2.0)", "    table.rows[0].height = Cm(0.95)"),
    ("        table.rows[i].height = Cm(1.55)", "        table.rows[i].height = Cm(1.5)"),
    ("    table.rows[0].height = Cm(1.55)\n    widths = [Cm(3.6), Cm(3.2), Cm(2.2), Cm(4.8)]",
     "    table.rows[0].height = Cm(1.5)\n    widths = [Cm(2.4), Cm(2.9), Cm(1.5), Cm(3.2)]"),
    ("    table.rows[0].height = Cm(1.55)\n    style_cell(table.cell(0, 0), \"指导教师\"",
     "    table.rows[0].height = Cm(1.5)\n    style_cell(table.cell(0, 0), \"指导教师\""),
]
for a, b in pairs:
    if a not in t:
        print("miss:", a[:40].replace("\n", " "))
    t = t.replace(a, b)
io.open(p, "w", encoding="utf-8").write(t)
print("cover width tightened")
