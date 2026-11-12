# -*- coding: utf-8 -*-
"""封面横向对位：按参考实测 2.27/6.98 cm，学号四段 2.27/3.22/0.99/2.72，底部右移。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

t = t.replace("W_LABEL, W_VALUE = Cm(2.4), Cm(6.8)", "W_LABEL, W_VALUE = Cm(2.27), Cm(6.98)")
t = t.replace("widths = [Cm(2.4), Cm(2.6), Cm(1.3), Cm(2.9)]",
              "widths = [Cm(2.27), Cm(3.22), Cm(0.99), Cm(2.72)]")

t = t.replace('["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]',
              '["基于 Vue3 的校园自习室", "预约管理系统的设计与实现"]')

old_bottom = '''    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "教务处  制表", size=16)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(12)
    add_inline(p, "2026 年 11 月 12 日", size=15)'''
new_bottom = '''    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(8.24)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "教务处  制表", size=16)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(8.85)
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(12)
    add_inline(p, "2026 年 11 月 12 日", size=15)'''
assert old_bottom in t, "bottom block"
t = t.replace(old_bottom, new_bottom, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("cover horizontal alignment patched")
