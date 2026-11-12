# -*- coding: utf-8 -*-
"""图形改为白底黑线，贴近参考的黑白线条图。"""
import io

p = "scripts/render_diagrams.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace("FILL = (252, 252, 253)", "FILL = (255, 255, 255)")
t = t.replace("LINE = (90, 96, 106)", "LINE = (0, 0, 0)")
t = t.replace("width=2,", "width=3,")
io.open(p, "w", encoding="utf-8").write(t)
print("diagram colors set to black on white")
