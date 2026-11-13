# -*- coding: utf-8 -*-
"""按参考封面重写字段区：标签分散对齐；题目两行各有下划线；学号行紧凑。"""
import io
import re

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    def cell_bottom_border(cell, sz=6):")
end = t.find("    # 声明起另起一节")
assert start > 0 and end > start

NEW = '''    def cell_bottom_border(cell, sz=6):
        tcPr = cell._tc.get_or_add_tcPr()
        borders = OxmlElement("w:tcBorders")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), str(sz))
        bottom.set(qn("w:color"), "000000")
        borders.append(bottom)
        tcPr.append(borders)

    def para_bottom_border(paragraph, sz=6):
        pPr = paragraph._p.get_or_add_pPr()
        pBdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), str(sz))
        bottom.set(qn("w:space"), "1")
        bottom.set(qn("w:color"), "000000")
        pBdr.append(bottom)
        pPr.append(pBdr)

    def style_cell(cell, text, width, is_label, align=None, size=None):
        cell.width = width
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        if align is not None:
            p.alignment = align
        elif is_label:
            p.alignment = WD_ALIGN_PARAGRAPH.DISTRIBUTE
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if not is_label:
            cell_bottom_border(cell)
        run = p.add_run(text)
        set_font(run, SONG, size if size else VALUE_SIZE)

    def fix_layout(table, widths):
        table.autofit = False
        tblPr = table._tbl.tblPr
        layout = OxmlElement("w:tblLayout")
        layout.set(qn("w:type"), "fixed")
        tblPr.append(layout)
        for j, w in enumerate(widths):
            table.columns[j].width = w
            for cell in table.columns[j].cells:
                cell.width = w

    VALUE_SIZE = 14.5
    LABEL_SIZE = 15.5
    W_LABEL, W_VALUE = Cm(3.6), Cm(10.2)

    rows = [
        ("题目", "计算机学院"),
        ("二级学院", "计算机学院"),
        ("专业", "计算机科学与技术"),
        ("学生姓名", "李洋"),
    ]

    # 题目行：两行文字，各带下划线
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = Cm(2.0)
    label_cell = table.cell(0, 0)
    label_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    lp = label_cell.paragraphs[0]
    lp.paragraph_format.first_line_indent = Pt(0)
    lp.paragraph_format.space_before = Pt(0)
    lp.paragraph_format.space_after = Pt(0)
    lp.alignment = WD_ALIGN_PARAGRAPH.DISTRIBUTE
    run = lp.add_run("题目")
    set_font(run, SONG, LABEL_SIZE)

    value_cell = table.cell(0, 1)
    value_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    for k, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        vp = value_cell.paragraphs[0] if k == 0 else value_cell.add_paragraph()
        vp.paragraph_format.first_line_indent = Pt(0)
        vp.paragraph_format.space_before = Pt(2)
        vp.paragraph_format.space_after = Pt(2)
        vp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para_bottom_border(vp)
        run = vp.add_run(line)
        set_font(run, SONG, VALUE_SIZE)
    fix_layout(table, [W_LABEL, W_VALUE])

    table = doc.add_table(rows=3, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (label, value) in enumerate([("二级学院", "计算机学院"),
                                       ("专业", "计算机科学与技术"),
                                       ("学生姓名", "李洋")]):
        table.rows[i].height = Cm(1.55)
        style_cell(table.cell(i, 0), label, W_LABEL, True, size=LABEL_SIZE)
        style_cell(table.cell(i, 1), value, W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    # 学号与年级同一行
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = Cm(1.55)
    widths = [Cm(3.6), Cm(3.2), Cm(2.2), Cm(4.8)]
    style_cell(table.cell(0, 0), "学号", widths[0], True, size=LABEL_SIZE)
    style_cell(table.cell(0, 1), "233020152", widths[1], False, size=LABEL_SIZE)
    style_cell(table.cell(0, 2), "年级", widths[2], True, size=LABEL_SIZE)
    style_cell(table.cell(0, 3), "2023", widths[3], False, size=LABEL_SIZE)
    fix_layout(table, widths)

    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = Cm(1.55)
    style_cell(table.cell(0, 0), "指导教师", W_LABEL, True, size=LABEL_SIZE)
    style_cell(table.cell(0, 1), "黄媛媛", W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(108)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "教务处  制表", size=15)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(14)
    add_inline(p, "2026 年 11 月 12 日", size=15)

'''

t = t[:start] + NEW + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("cover rebuilt")
