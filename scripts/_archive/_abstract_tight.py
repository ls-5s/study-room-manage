# -*- coding: utf-8 -*-
"""摘要与 Abstract 再收紧：减小行距与段间距，确保各占一页。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''                    if k == 0:
                        para.paragraph_format.space_before = Pt(6)
                        para.paragraph_format.space_after = Pt(18 if tight else 28)
                        add_inline(para, txt, size=18, font=HEI)
                    else:
                        para.paragraph_format.space_after = Pt(14 if tight else 22)
                        add_inline(para, txt, size=14, font="楷体")'''
new = '''                    if k == 0:
                        para.paragraph_format.space_before = Pt(2)
                        para.paragraph_format.space_after = Pt(10 if tight else 16)
                        add_inline(para, txt, size=18, font=HEI)
                    else:
                        para.paragraph_format.space_after = Pt(8 if tight else 14)
                        add_inline(para, txt, size=14, font="楷体")'''
assert old in t
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("abstract gaps tightened")

p2 = "thesis/drafts/00-摘要.md"
s = io.open(p2, encoding="utf-8").read()
s = s.replace("The system implements seven student and six administrator functions. Testing covered 56 interface checks, 49 back-end tests, 3 front-end time-rule tests and 16 lifecycle checks, all passed; four defects were found and fixed. Results show the system covers the complete reservation process and keeps state consistent under concurrent and abnormal conditions.",
              "The system implements seven student and six administrator functions. Testing covered 56 interface checks, 49 back-end tests, 3 front-end time-rule tests and 16 lifecycle checks, all passed, and four defects were fixed. Results show the system covers the complete reservation process and keeps state consistent under concurrent conditions.")
io.open(p2, "w", encoding="utf-8").write(s)
print("abstract trimmed")
