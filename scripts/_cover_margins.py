# -*- coding: utf-8 -*-
"""给封面表格设置单元格边距，避免 4 字标签换行。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''    def fix_layout(table, widths):
        table.autofit = False
        tblPr = table._tbl.tblPr
        layout = OxmlElement("w:tblLayout")
        layout.set(qn("w:type"), "fixed")
        tblPr.append(layout)'''

new = '''    def fix_layout(table, widths):
        table.autofit = False
        tblPr = table._tbl.tblPr
        layout = OxmlElement("w:tblLayout")
        layout.set(qn("w:type"), "fixed")
        tblPr.append(layout)
        mar = OxmlElement("w:tblCellMar")
        for side, val in (("left", "28"), ("right", "28")):
            el = OxmlElement("w:" + side)
            el.set(qn("w:w"), val)
            el.set(qn("w:type"), "dxa")
            mar.append(el)
        tblPr.append(mar)'''

assert old in t
t = t.replace(old, new)
t = t.replace("W_LABEL, W_VALUE = Cm(2.4), Cm(7.6)", "W_LABEL, W_VALUE = Cm(2.6), Cm(7.4)")
t = t.replace("widths = [Cm(2.4), Cm(2.9), Cm(1.5), Cm(3.2)]", "widths = [Cm(2.6), Cm(2.8), Cm(1.4), Cm(3.2)]")
io.open(p, "w", encoding="utf-8").write(t)
print("margins added")
