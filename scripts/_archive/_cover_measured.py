# -*- coding: utf-8 -*-
"""按实测值重写封面字段区：14pt、下划线贴文字、行距 1.92cm。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    def cell_bottom_border(cell, sz=6):")
end = t.find("    # 声明起另起一节")
assert start > 0 and end > start

NEW = '''    def para_bottom_border(paragraph, sz=6):
        pPr = paragraph._p.get_or_add_pPr()
        pBdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), str(sz))
        bottom.set(qn("w:space"), "0")
        bottom.set(qn("w:color"), "000000")
        pBdr.append(bottom)
        pPr.append(pBdr)

    def style_cell(cell, text, width, is_label, size=None, underline=True):
        cell.width = width
        cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
        p = cell.paragraphs[0]
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        p.paragraph_format.line_spacing = Pt(size if size else VALUE_SIZE)
        if is_label:
            p.alignment = (WD_ALIGN_PARAGRAPH.DISTRIBUTE
                           if len(text) <= 2 else WD_ALIGN_PARAGRAPH.RIGHT)
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if underline:
                para_bottom_border(p)
        run = p.add_run(text)
        set_font(run, SONG, size if size else VALUE_SIZE)

    def fix_layout(table, widths):
        table.autofit = False
        tblPr = table._tbl.tblPr
        layout = OxmlElement("w:tblLayout")
        layout.set(qn("w:type"), "fixed")
        tblPr.append(layout)
        mar = OxmlElement("w:tblCellMar")
        for side, val in (("top", "0"), ("bottom", "0"), ("left", "28"), ("right", "28")):
            el = OxmlElement("w:" + side)
            el.set(qn("w:w"), val)
            el.set(qn("w:type"), "dxa")
            mar.append(el)
        tblPr.append(mar)

    VALUE_SIZE = 14
    LABEL_SIZE = 14
    W_LABEL, W_VALUE = Cm(2.2), Cm(6.9)
    ROW_H = Cm(1.92)
    TITLE_ROW_H = Cm(0.85)

    # 题目行：两行、各带下划线
    table = doc.add_table(rows=2, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = TITLE_ROW_H
    table.rows[1].height = TITLE_ROW_H
    label_cell = table.cell(0, 0).merge(table.cell(1, 0))
    label_cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
    lp = label_cell.paragraphs[0]
    lp.paragraph_format.first_line_indent = Pt(0)
    lp.paragraph_format.space_before = Pt(0)
    lp.paragraph_format.space_after = Pt(0)
    lp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    lp.paragraph_format.line_spacing = Pt(LABEL_SIZE)
    lp.alignment = WD_ALIGN_PARAGRAPH.DISTRIBUTE
    run = lp.add_run("题目")
    set_font(run, SONG, LABEL_SIZE)

    for i, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        cell = table.cell(i, 1)
        cell.width = W_VALUE
        cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
        vp = cell.paragraphs[0]
        vp.paragraph_format.first_line_indent = Pt(0)
        vp.paragraph_format.space_before = Pt(0)
        vp.paragraph_format.space_after = Pt(0)
        vp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        vp.paragraph_format.line_spacing = Pt(VALUE_SIZE)
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
        table.rows[i].height = ROW_H
        style_cell(table.cell(i, 0), label, W_LABEL, True, size=LABEL_SIZE)
        style_cell(table.cell(i, 1), value, W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    # 学号与年级同一行
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = ROW_H
    widths = [Cm(2.2), Cm(2.6), Cm(1.3), Cm(3.0)]
    style_cell(table.cell(0, 0), "学号", widths[0], True, size=LABEL_SIZE)
    style_cell(table.cell(0, 1), "233020152", widths[1], False, size=LABEL_SIZE)
    style_cell(table.cell(0, 2), "年级", widths[2], True, size=LABEL_SIZE)
    style_cell(table.cell(0, 3), "2023", widths[3], False, size=LABEL_SIZE)
    fix_layout(table, widths)

    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = ROW_H
    style_cell(table.cell(0, 0), "指导教师", W_LABEL, True, size=LABEL_SIZE)
    style_cell(table.cell(0, 1), "黄媛媛", W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(92)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "教务处  制表", size=16)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(12)
    add_inline(p, "2026 年 11 月 12 日", size=15)

'''

t = t[:start] + NEW + t[end:]

# 标题字号按实测：第一行 24.5，第二行 26
t = t.replace('set_font(run, "华文行楷", 26, True)', 'set_font(run, "华文行楷", 24.5, True)')
t = t.replace('set_font(run, "华文行楷", 22, True)', 'set_font(run, "华文行楷", 26, True)')

io.open(p, "w", encoding="utf-8").write(t)
print("cover rebuilt with measured values")
