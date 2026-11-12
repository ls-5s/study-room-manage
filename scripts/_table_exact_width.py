# -*- coding: utf-8 -*-
"""表格宽度写死 14.71cm、单元格边距归零、fixed 布局，使线长与列边界与参考一致。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")'''
new = '''    tbl = table._tbl
    tblPr = tbl.tblPr

    total_twips = int(Cm(14.71).twips)
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.insert(0, tblW)
    tblW.set(qn("w:w"), str(total_twips))
    tblW.set(qn("w:type"), "dxa")

    layout = tblPr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tblPr.append(layout)
    layout.set(qn("w:type"), "fixed")

    margins = OxmlElement("w:tblCellMar")
    for side in ("top", "bottom", "left", "right"):
        el = OxmlElement("w:" + side)
        el.set(qn("w:w"), "0")
        el.set(qn("w:type"), "dxa")
        margins.append(el)
    tblPr.append(margins)

    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        for col in grid.findall(qn("w:gridCol")):
            col.set(qn("w:w"), str(total_twips // cols))

    borders = OxmlElement("w:tblBorders")'''
assert old in t, "table prologue"
t = t.replace(old, new, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("table width/margins/layout fixed")
