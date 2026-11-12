# -*- coding: utf-8 -*-
"""改用「下划线格式化的制表符」画填写线：线贴文字、可控制起止。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    def field_para(label, value, stops")
end_marker = "    p = doc.add_paragraph()\n    p.paragraph_format.first_line_indent = Pt(0)\n    p.paragraph_format.space_before = Pt(92)"
end = t.find(end_marker)
assert start > 0 and end > start, (start, end)

BLOCK = '''    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER

    LINE_STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (8.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
    ]

    def field_para(label, value, gap=40.5, size=14, first=False):
        para = doc.add_paragraph()
        pf = para.paragraph_format
        pf.first_line_indent = Pt(0)
        pf.space_before = Pt(58 if first else 0)
        pf.space_after = Pt(gap)
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing = Pt(size)
        for pos, align, leader in LINE_STOPS:
            pf.tab_stops.add_tab_stop(Cm(pos), align, leader)
        if label:
            run = para.add_run(label)
            set_font(run, SONG, size)
        run = para.add_run("\\t\\t")
        set_font(run, SONG, size)
        run = para.add_run(value)
        set_font(run, SONG, size)
        run.font.underline = True
        run = para.add_run("\\t")
        set_font(run, SONG, size)
        run.font.underline = True
        return para

    field_para("题　　目", "基于 Vue3 的校园自习室预约", gap=8.7, first=True)
    field_para("", "管理系统的设计与实现")
    field_para("二级学院", "计算机学院")
    field_para("专　　业", "计算机科学与技术")
    field_para("学生姓名", "李洋")

    # 学号与年级同一行
    ID_STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (8.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (11.6, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (12.2, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
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

    def seg(text, underline=False):
        run = para.add_run(text)
        set_font(run, SONG, 14)
        if underline:
            run.font.underline = True

    seg("学　　号")
    seg("\\t\\t")
    seg("233020152", underline=True)
    seg("\\t")
    seg("年　　级")
    seg("\\t\\t")
    seg("2023", underline=True)
    seg("\\t", underline=True)

    field_para("指导教师", "黄媛媛")

'''

t = t[:start] + BLOCK + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("underline-tab variant written")
