# -*- coding: utf-8 -*-
"""封面字段改用制表位 + 下划线前导符（对齐参考的贴文字下划线）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    def para_bottom_border(paragraph, sz=6):")
end_marker = "    p = doc.add_paragraph()\n    p.paragraph_format.first_line_indent = Pt(0)\n    p.paragraph_format.space_before = Pt(92)"
end = t.find(end_marker)
assert start > 0 and end > start, (start, end)

BLOCK = '''    def field_para(label, value, stops, size=14, gap=40.5):
        para = doc.add_paragraph()
        pf = para.paragraph_format
        pf.first_line_indent = Pt(0)
        pf.space_before = Pt(0)
        pf.space_after = Pt(gap)
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing = Pt(size)
        for pos, align, leader in stops:
            pf.tab_stops.add_tab_stop(Cm(pos), align, leader)
        if label:
            run = para.add_run(label)
            set_font(run, SONG, size)
        run = para.add_run("\\t")
        set_font(run, SONG, size)
        if value:
            run = para.add_run(value)
            set_font(run, SONG, size)
        run = para.add_run("\\t")
        set_font(run, SONG, size)
        return para

    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER

    STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (12.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.UNDERSCORE),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.UNDERSCORE),
    ]

    # 题目两行
    p1 = field_para("题　　目", "基于 Vue3 的校园自习室预约", STOPS, gap=8.7)
    p1.paragraph_format.space_before = Pt(58)
    p2 = field_para("", "管理系统的设计与实现", STOPS, gap=40.5)

    field_para("二级学院", "计算机学院", STOPS)
    field_para("专　　业", "计算机科学与技术", STOPS)
    field_para("学生姓名", "李洋", STOPS)

    ID_STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (10.0, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.UNDERSCORE),
        (12.4, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (13.8, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.UNDERSCORE),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.UNDERSCORE),
    ]
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.first_line_indent = Pt(0)
    pf.space_before = Pt(0)
    pf.space_after = Pt(40.5)
    pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    pf.line_spacing = Pt(14)
    for pos, align, leader in ID_STOPS:
        pf.tab_stops.add_tab_stop(Cm(pos), align, leader)
    for txt in ("学　　号", "\\t", "233020152", "\\t", "年　　级", "\\t", "2023", "\\t"):
        run = para.add_run(txt)
        set_font(run, SONG, 14)

    field_para("指导教师", "黄媛媛", STOPS)

'''

t = t[:start] + BLOCK + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("cover switched to tab leaders")
