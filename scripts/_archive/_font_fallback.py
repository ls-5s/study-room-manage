# -*- coding: utf-8 -*-
"""本机无行楷字体：页眉与封面改用楷体；Abstract 间距单独收紧以免溢出。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

t = t.replace('"华文行楷"', '"楷体"')

# Abstract 专用间距：title 20、Major/Student 16
old = '''                for k, txt in enumerate(picked):
                    para = doc.add_paragraph()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    para.paragraph_format.first_line_indent = Pt(0)
                    if k == 0:
                        para.paragraph_format.space_before = Pt(6)
                        para.paragraph_format.space_after = Pt(28)
                        add_inline(para, txt, size=18, font=HEI)
                    else:
                        para.paragraph_format.space_after = Pt(22)
                        add_inline(para, txt, size=14, font="楷体")'''
new = '''                tight = title == "Abstract"
                for k, txt in enumerate(picked):
                    para = doc.add_paragraph()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    para.paragraph_format.first_line_indent = Pt(0)
                    if k == 0:
                        para.paragraph_format.space_before = Pt(6)
                        para.paragraph_format.space_after = Pt(18 if tight else 28)
                        add_inline(para, txt, size=18, font=HEI)
                    else:
                        para.paragraph_format.space_after = Pt(14 if tight else 22)
                        add_inline(para, txt, size=14, font="楷体")'''
assert old in t
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("font fallback + abstract spacing patched")
