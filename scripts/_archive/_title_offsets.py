# -*- coding: utf-8 -*-
"""摘要题名与目录标题各下移 3pt，对齐参考 87.3。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

t = t.replace("para.paragraph_format.space_before = Pt(5)", "para.paragraph_format.space_before = Pt(8)")
t = t.replace('''                h.paragraph_format.space_after = Pt(9)''',
              '''                h.paragraph_format.space_before = Pt(3)
                h.paragraph_format.space_after = Pt(9)''')

io.open(p, "w", encoding="utf-8").write(t)
print("title offsets applied")
