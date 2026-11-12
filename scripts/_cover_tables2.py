# -*- coding: utf-8 -*-
"""回到表格方案（已验证列宽正确），行高压到贴近文字，行距用空段补齐。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER")
end_marker = "    p = doc.add_paragraph()\n    p.paragraph_format.first_line_indent = Pt(0)\n    p.paragraph_format.space_before = Pt(92)"
end = t.find(end_marker)
assert start > 0 and end > start, (start, end)

BLOCK = '''    def para_bottom_border(paragraph, sz=6):
        pPr = paragraph._p.get_or_add_pPr()
        pBdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), str(sz))
        bottom.set(qn("w:space"), "0")
        bottom.set(qn("w:color"), "000000")
        pBdr.append(bottom)
        pPr.append(pBdr)

    def fix_layout(table, widths):
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
        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))
        for j, w in enumerate(widths):
            for cell in table.columns[j].cells:
                cell.width = w

    def cell_text(cell, text, width, is_label, size=14):
        cell.width = width
        cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
        para = cell.paragraphs[0]
        pf = para.paragraph_format
        pf.first_line_indent = Pt(0)
        pf.space_before = Pt(0)
        pf.space_after = Pt(0)
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing = Pt(size)
        if is_label:
            para.alignment = (WD_ALIGN_PARAGRAPH.DISTRIBUTE
                              if len(text) <= 2 else WD_ALIGN_PARAGRAPH.RIGHT)
        else:
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para_bottom_border(para)
        run = para.add_run(text)
        set_font(run, SONG, size)

    def spacer(pts):
        sp = doc.add_paragraph()
        sp.paragraph_format.first_line_indent = Pt(0)
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(0)
        sp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        sp.paragraph_format.line_spacing = Pt(pts)

    SIZE = 14
    W_LABEL, W_VALUE = Cm(2.6), Cm(7.4)
    ROW_H = Cm(0.78)

    # 题目两行
    table = doc.add_table(rows=2, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        table.rows[i].height = ROW_H
        if i == 0:
            cell_text(table.cell(0, 0), "题目", W_LABEL, True, SIZE)
        else:
            cell_text(table.cell(1, 0), "", W_LABEL, True, SIZE)
        cell_text(table.cell(i, 1), line, W_VALUE, False, SIZE)
    fix_layout(table, [W_LABEL, W_VALUE])
    spacer(30)

    table = doc.add_table(rows=3, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (label, value) in enumerate([("二级学院", "计算机学院"),
                                       ("专业", "计算机科学与技术"),
                                       ("学生姓名", "李洋")]):
        table.rows[i].height = ROW_H
        cell_text(table.cell(i, 0), label, W_LABEL, True, SIZE)
        cell_text(table.cell(i, 1), value, W_VALUE, False, SIZE)
    fix_layout(table, [W_LABEL, W_VALUE])
    spacer(30)

    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = ROW_H
    widths = [Cm(2.6), Cm(2.9), Cm(1.4), Cm(3.1)]
    cell_text(table.cell(0, 0), "学号", widths[0], True, SIZE)
    cell_text(table.cell(0, 1), "233020152", widths[1], False, SIZE)
    cell_text(table.cell(0, 2), "年级", widths[2], True, SIZE)
    cell_text(table.cell(0, 3), "2023", widths[3], False, SIZE)
    fix_layout(table, widths)
    spacer(30)

    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = ROW_H
    cell_text(table.cell(0, 0), "指导教师", W_LABEL, True, SIZE)
    cell_text(table.cell(0, 1), "黄媛媛", W_VALUE, False, SIZE)
    fix_layout(table, [W_LABEL, W_VALUE])

'''

t = t[:start] + BLOCK + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("cover table variant restored")
