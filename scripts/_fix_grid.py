# -*- coding: utf-8 -*-
"""直接写 tblGrid 的列宽，保证表格按设定宽度排版。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''        for j, w in enumerate(widths):
            table.columns[j].width = w
            for cell in table.columns[j].cells:
                cell.width = w'''
new = '''        for j, w in enumerate(widths):
            table.columns[j].width = w
            for cell in table.columns[j].cells:
                cell.width = w
        grid = table._tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))'''
assert old in t
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("grid widths set")
