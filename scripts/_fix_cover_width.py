# -*- coding: utf-8 -*-
"""修正封面表格总宽与题目标签位置。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 表格总宽写死，避免按版心撑满
old_layout = '''        mar = OxmlElement("w:tblCellMar")'''
new_layout = '''        total = sum(int(w.twips) for w in widths)
        tblW = OxmlElement("w:tblW")
        tblW.set(qn("w:w"), str(total))
        tblW.set(qn("w:type"), "dxa")
        tblPr.append(tblW)
        mar = OxmlElement("w:tblCellMar")'''
assert old_layout in t
t = t.replace(old_layout, new_layout, 1)

# 2) 题目行不再合并单元格，标签与第一行对齐
old_merge = '''    label_cell = table.cell(0, 0).merge(table.cell(1, 0))
    label_cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
    lp = label_cell.paragraphs[0]'''
new_merge = '''    label_cell = table.cell(0, 0)
    label_cell.width = W_LABEL
    label_cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
    table.cell(1, 0).width = W_LABEL
    lp = label_cell.paragraphs[0]'''
assert old_merge in t
t = t.replace(old_merge, new_merge, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("table width fixed")
