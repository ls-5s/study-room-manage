# -*- coding: utf-8 -*-
"""修正 tblW / tblLayout 重复元素问题。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    def fix_layout(table, widths):")
end = t.find("    for i, (label, value) in enumerate(", start)
assert start > 0 and end > start

NEW = '''    def fix_layout(table, widths):
        table.autofit = False
        tbl = table._tbl
        tblPr = tbl.tblPr

        total = sum(int(w.twips) for w in widths)
        tblW = tblPr.find(qn("w:tblW"))
        if tblW is None:
            tblW = OxmlElement("w:tblW")
            tblPr.insert(0, tblW)
        tblW.set(qn("w:w"), str(total))
        tblW.set(qn("w:type"), "dxa")

        layout = tblPr.find(qn("w:tblLayout"))
        if layout is None:
            layout = OxmlElement("w:tblLayout")
            tblPr.append(layout)
        layout.set(qn("w:type"), "fixed")

        jc = tblPr.find(qn("w:jc"))
        if jc is None:
            jc = OxmlElement("w:jc")
            tblPr.append(jc)
        jc.set(qn("w:val"), "center")

        mar = tblPr.find(qn("w:tblCellMar"))
        if mar is None:
            mar = OxmlElement("w:tblCellMar")
            tblPr.append(mar)
        for side, val in (("top", "0"), ("bottom", "0"), ("left", "28"), ("right", "28")):
            el = mar.find(qn("w:" + side))
            if el is None:
                el = OxmlElement("w:" + side)
                mar.append(el)
            el.set(qn("w:w"), val)
            el.set(qn("w:type"), "dxa")

        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))
        for j, w in enumerate(widths):
            for cell in table.columns[j].cells:
                cell.width = w

'''

t = t[:start] + NEW + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("fix_layout rewritten")
