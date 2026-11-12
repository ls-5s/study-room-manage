# -*- coding: utf-8 -*-
import io

lines = io.open("scripts/build_thesis_docx.py", encoding="utf-8").read().split("\n")
for i, l in enumerate(lines, 1):
    s = l.strip()
    if ("学术诚信声明" in l or "space_after = Pt(18)" in l
            or "Cm(0.44)" in l or s.startswith('run = p.add_run("成都锦城学院")')):
        print(i, s[:70])
