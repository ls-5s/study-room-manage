# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace('''            para.alignment = (WD_ALIGN_PARAGRAPH.DISTRIBUTE
                              if len(text) <= 2 else WD_ALIGN_PARAGRAPH.RIGHT)''',
'''            para.alignment = (WD_ALIGN_PARAGRAPH.DISTRIBUTE
                              if len(text) <= 2 else WD_ALIGN_PARAGRAPH.LEFT)''')
t = t.replace('    p.paragraph_format.space_before = Pt(77)\n', '    p.paragraph_format.space_before = Pt(63)\n', 1)
io.open(p, "w", encoding="utf-8").write(t)
print("cover labels left-aligned, bottom gap tuned")
