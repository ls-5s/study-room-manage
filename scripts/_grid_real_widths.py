# -*- coding: utf-8 -*-
"""tblGrid 按实际列宽设置（之前被平均分配覆盖，导致列宽不生效）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
old = '''    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        for col in grid.findall(qn("w:gridCol")):
            col.set(qn("w:w"), str(total_twips // cols))'''
new = '''    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        cols_el = grid.findall(qn("w:gridCol"))
        for idx_w, wcm in enumerate(widths[:len(cols_el)]):
            cols_el[idx_w].set(qn("w:w"), str(int(Cm(wcm).twips)))'''
assert old in t, "grid block"
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("grid columns now use real widths")
