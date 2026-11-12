# -*- coding: utf-8 -*-
"""表格行禁止跨页拆分，并让表格与题注保持在同一页。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

anchor = '''    tbl = table._tbl
    tblPr = tbl.tblPr
'''
ins = '''    for ri, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        trPr.append(cant)
        if ri < len(table.rows) - 1:
            for cell in row.cells:
                for para in cell.paragraphs:
                    para.paragraph_format.keep_with_next = True

    tbl = table._tbl
    tblPr = tbl.tblPr
'''
assert anchor in t
t = t.replace(anchor, ins, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("table split protection added")
