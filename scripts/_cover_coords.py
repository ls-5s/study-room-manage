# -*- coding: utf-8 -*-
"""封面按参考坐标重排：标题 140/193.9，字段 278.4 起每行 54.5，底部 680.7/711.3。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    # ---- 封面 ----")
end = t.find("    # 声明起另起一节")
assert start > 0 and end > start, (start, end)

BLOCK = '''    # ---- 封面 ----
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(44)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(28)
    run = p.add_run("成都锦城学院")
    set_font(run, "微软雅黑", 24.5, True)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(40)
    run = p.add_run("本科生毕业论文（设计）")
    set_font(run, "华文中宋", 26, False)

    def para_bottom_border(paragraph, sz=6):
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
        jc = tblPr.find(qn("w:jc"))
        if jc is not None:
            tblPr.remove(jc)
        ind = tblPr.find(qn("w:tblInd"))
        if ind is None:
            ind = OxmlElement("w:tblInd")
            tblPr.append(ind)
        ind.set(qn("w:w"), str(Cm(3.69).twips))
        ind.set(qn("w:type"), "dxa")
        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))
        for j, w in enumerate(widths):
            for cell in table.columns[j].cells:
                cell.width = w

    SIZE = 14
    W_LABEL, W_VALUE = Cm(2.2), Cm(7.0)

    def cell_text(cell, text, width, is_label, size=SIZE, row_h=None):
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

    # 题目两行
    table = doc.add_table(rows=2, cols=2)
    for i, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        table.rows[i].height = Cm(0.80)
        cell_text(table.cell(i, 0), "题目" if i == 0 else "", W_LABEL, True)
        cell_text(table.cell(i, 1), line, W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    table = doc.add_table(rows=3, cols=2)
    for i, (label, value) in enumerate([("二级学院", "计算机学院"),
                                       ("专业", "计算机科学与技术"),
                                       ("学生姓名", "李洋")]):
        table.rows[i].height = Cm(1.92)
        cell_text(table.cell(i, 0), label, W_LABEL, True)
        cell_text(table.cell(i, 1), value, W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    table = doc.add_table(rows=1, cols=4)
    table.rows[0].height = Cm(1.92)
    widths = [Cm(2.2), Cm(2.2), Cm(1.3), Cm(3.5)]
    cell_text(table.cell(0, 0), "学号", widths[0], True)
    cell_text(table.cell(0, 1), "233020152", widths[1], False)
    cell_text(table.cell(0, 2), "年级", widths[2], True)
    cell_text(table.cell(0, 3), "2023", widths[3], False)
    fix_layout(table, widths)

    table = doc.add_table(rows=1, cols=2)
    table.rows[0].height = Cm(1.92)
    cell_text(table.cell(0, 0), "指导教师", W_LABEL, True)
    cell_text(table.cell(0, 1), "黄媛媛", W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(58)

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

t = t[:start] + BLOCK + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("cover rebuilt to reference coordinates")
