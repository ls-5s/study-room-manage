# -*- coding: utf-8 -*-
"""学号/年级的值改为左对齐（参考为左对齐）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''    def cell_text(cell, text, width, is_label, size=SIZE, row_h=None):'''
new = '''    def cell_text(cell, text, width, is_label, size=SIZE, row_h=None, align=None):'''
assert old in t
t = t.replace(old, new, 1)

old2 = '''        else:
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para_bottom_border(para)'''
new2 = '''        else:
            para.alignment = align or WD_ALIGN_PARAGRAPH.CENTER
            para_bottom_border(para)'''
assert old2 in t
t = t.replace(old2, new2, 1)

t = t.replace('cell_text(table.cell(0, 1), "233020152", widths[1], False)',
              'cell_text(table.cell(0, 1), "233020152", widths[1], False, align=WD_ALIGN_PARAGRAPH.LEFT)')
t = t.replace('cell_text(table.cell(0, 3), "2023", widths[3], False)',
              'cell_text(table.cell(0, 3), "2023", widths[3], False, align=WD_ALIGN_PARAGRAPH.LEFT)')

io.open(p, "w", encoding="utf-8").write(t)
print("id row values left-aligned")
