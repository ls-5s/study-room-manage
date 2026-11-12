# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
pairs = [
    ('style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.LEFT, 0, 8)',
     'style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.LEFT, 0, 2)'),
    ('style_heading(doc, "Heading 2", 14, WD_ALIGN_PARAGRAPH.LEFT, 8, 6)',
     'style_heading(doc, "Heading 2", 14, WD_ALIGN_PARAGRAPH.LEFT, 4, 4)'),
]
for a, b in pairs:
    if a not in t:
        print("miss:", a[:40])
    t = t.replace(a, b, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("heading gaps reduced")
