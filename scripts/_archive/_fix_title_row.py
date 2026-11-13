# -*- coding: utf-8 -*-
"""题目行改为 2x2 表格：标签跨行居中，两个值单元格各自带下边框。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    # 题目行：两行文字，各带下划线")
end = t.find("    table = doc.add_table(rows=3, cols=2)")
assert start > 0 and end > start

NEW = '''    # 题目行：两行、各带下划线（用表格避免段落边框合并）
    table = doc.add_table(rows=2, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.rows[0].height = Cm(0.95)
    table.rows[1].height = Cm(0.95)
    label_cell = table.cell(0, 0).merge(table.cell(1, 0))
    label_cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    lp = label_cell.paragraphs[0]
    lp.paragraph_format.first_line_indent = Pt(0)
    lp.paragraph_format.space_before = Pt(0)
    lp.paragraph_format.space_after = Pt(0)
    lp.alignment = WD_ALIGN_PARAGRAPH.DISTRIBUTE
    run = lp.add_run("题目")
    set_font(run, SONG, LABEL_SIZE)

    for i, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        cell = table.cell(i, 1)
        cell.width = W_VALUE
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        cell_bottom_border(cell)
        vp = cell.paragraphs[0]
        vp.paragraph_format.first_line_indent = Pt(0)
        vp.paragraph_format.space_before = Pt(2)
        vp.paragraph_format.space_after = Pt(2)
        vp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = vp.add_run(line)
        set_font(run, SONG, VALUE_SIZE)
    fix_layout(table, [W_LABEL, W_VALUE])

'''

t = t[:start] + NEW + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("title block rebuilt")
