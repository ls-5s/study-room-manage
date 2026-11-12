# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
lines = io.open(p, encoding="utf-8").read().split("\n")

# 摘要分支内的 space_before = Pt(2) -> Pt(5)
for i, l in enumerate(lines):
    if 'para.paragraph_format.space_before = Pt(2)' in l:
        prev = "\n".join(lines[max(0, i - 3):i])
        if "tight" in prev or "picked" in prev:
            lines[i] = l.replace("Pt(2)", "Pt(5)")
            print("abstract title before -> 5 at line", i + 1)

# 声明标题缩进 0.44 -> 0.66，第一标题段后 18 -> 21
for i, l in enumerate(lines):
    if "Cm(0.44)" in l:
        lines[i] = l.replace("Cm(0.44)", "Cm(0.66)")
    if l.strip() == "p.paragraph_format.space_after = Pt(18)" and i in range(450, 470):
        lines[i] = l.replace("Pt(18)", "Pt(21)")

io.open(p, "w", encoding="utf-8").write("\n".join(lines))
print("final micro nudges applied")
