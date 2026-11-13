# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''                run = h.add_run("目  录")
                set_font(run, HEI, 18, False)'''
new = '''                h.paragraph_format.space_after = Pt(9)
                run = h.add_run("目  录")
                set_font(run, HEI, 18, False)'''
assert old in t, "toc title"
t = t.replace(old, new, 1)

# 校验前面两处是否已生效
print("H3 before=3:", 'style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 3, 2)' in t)
print("abstract title before=5:", "space_before = Pt(5)" in t)

io.open(p, "w", encoding="utf-8").write(t)
print("toc title spacing added")
