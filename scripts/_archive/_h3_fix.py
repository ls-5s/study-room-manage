# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
lines = io.open(p, encoding="utf-8").read().split("\n")

for i, ln in enumerate(lines):
    if 'style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 6, 2)' in ln:
        lines[i] = ln.replace("LEFT, 6, 2)", "LEFT, 3, 2)")
    if 'style_heading(doc, "Heading 4"' in ln and "LEFT, 6, 3" in ln:
        lines[i] = ln.replace("LEFT, 6, 3", "LEFT, 3, 3")
    if 'para.paragraph_format.space_before = Pt(2)' in ln and i > 560:
        lines[i] = ln.replace("Pt(2)", "Pt(5)")

io.open(p, "w", encoding="utf-8").write("\n".join(lines))
print("heading/abstract spacing fixed")
