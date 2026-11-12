# -*- coding: utf-8 -*-
"""年级单元格偏窄导致换行：2.27/3.22/1.15/2.56。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace("widths = [Cm(2.27), Cm(3.22), Cm(0.99), Cm(2.72)]",
              "widths = [Cm(2.27), Cm(3.22), Cm(1.15), Cm(2.56)]")
io.open(p, "w", encoding="utf-8").write(t)
print("grade cell widened")
