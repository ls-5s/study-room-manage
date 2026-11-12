# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
old = '    page_number_format(body_sec, "upperRoman", 1)\n\n    doc.add_page_break()\n'
new = '    page_number_format(body_sec, "upperRoman", 1)\n'
assert old in t, "pattern not found"
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("blank page break removed")
