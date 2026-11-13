# -*- coding: utf-8 -*-
"""去掉图内标题（题注由文档生成），分组底色改白、文字改黑。"""
import io
import re

p = "scripts/render_diagrams.py"
t = io.open(p, encoding="utf-8").read()

# 去掉图内标题绘制
t = re.sub(r'\n\s*d\.text\(\(48, 40\), spec\["title"\],[^\n]*\n', "\n", t)
t = re.sub(r'\n\s*d\.text\(\([^)]*\), spec\["title"\],[^\n]*\n', "\n", t)

# 底色与文字
t = t.replace("fill=(248, 250, 252)", "fill=(255, 255, 255)")
t = t.replace("fill=(70, 78, 90)", "fill=(0, 0, 0)")

io.open(p, "w", encoding="utf-8").write(t)
print("in-figure titles removed; fills whitened")
