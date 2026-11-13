# -*- coding: utf-8 -*-
"""授权书标题下移用空段落实现（页首段前距会被 WPS 忽略）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''    doc.add_page_break()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(132)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")'''
new = '''    doc.add_page_break()
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(0)
    sp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    sp.paragraph_format.line_spacing = Pt(84)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")'''
assert old in t, "auth block"
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("auth spacer added")
