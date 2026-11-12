# -*- coding: utf-8 -*-
"""页首段前距被忽略：用 3pt 空段落把摘要题名与目录标题下推。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 摘要题名下移
old = '''                for k, txt in enumerate(picked):
                    para = doc.add_paragraph()'''
new = '''                for k, txt in enumerate(picked):
                    if k == 0:
                        sp0 = doc.add_paragraph()
                        sp0.paragraph_format.space_before = Pt(0)
                        sp0.paragraph_format.space_after = Pt(0)
                        sp0.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
                        sp0.paragraph_format.line_spacing = Pt(3)
                    para = doc.add_paragraph()'''
assert old in t
t = t.replace(old, new, 1)

# 目录标题下移
old2 = '''                h = doc.add_paragraph()
                h.alignment = WD_ALIGN_PARAGRAPH.CENTER'''
new2 = '''                sp1 = doc.add_paragraph()
                sp1.paragraph_format.space_before = Pt(0)
                sp1.paragraph_format.space_after = Pt(0)
                sp1.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
                sp1.paragraph_format.line_spacing = Pt(3)
                h = doc.add_paragraph()
                h.alignment = WD_ALIGN_PARAGRAPH.CENTER'''
assert old2 in t
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("top spacers added")
