# -*- coding: utf-8 -*-
"""给封面表格加固定布局，保证列宽与上方表格对齐。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

helper = '''    def fix_layout(table, widths):
        table.autofit = False
        tblPr = table._tbl.tblPr
        layout = OxmlElement("w:tblLayout")
        layout.set(qn("w:type"), "fixed")
        tblPr.append(layout)
        for j, w in enumerate(widths):
            table.columns[j].width = w
            for cell in table.columns[j].cells:
                cell.width = w

    VALUE_SIZE = 14.5'''

t = t.replace("    VALUE_SIZE = 14.5", helper, 1)

t = t.replace('''        style_cell(table.cell(i, 0), label, W_LABEL, True)
        style_cell(table.cell(i, 1), value, W_VALUE, False)''',
'''        style_cell(table.cell(i, 0), label, W_LABEL, True)
        style_cell(table.cell(i, 1), value, W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])''')

t = t.replace('''    for j, (text, is_label, width) in enumerate(cols):
        style_cell(table.cell(0, j), text, width, is_label)''',
'''    for j, (text, is_label, width) in enumerate(cols):
        style_cell(table.cell(0, j), text, width, is_label)
    fix_layout(table, [c[2] for c in cols])''')

t = t.replace('''    style_cell(table.cell(0, 0), "指导教师", W_LABEL, True)
    style_cell(table.cell(0, 1), "黄媛媛", W_VALUE, False)''',
'''    style_cell(table.cell(0, 0), "指导教师", W_LABEL, True)
    style_cell(table.cell(0, 1), "黄媛媛", W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])''')

io.open(p, "w", encoding="utf-8").write(t)
print("layout fixed added")
