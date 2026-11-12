# -*- coding: utf-8 -*-
"""值前加下划线前导制表位，使文字落在参考的位置（约 10.4 cm）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

start = t.find("    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER")
end_marker = "    p = doc.add_paragraph()\n    p.paragraph_format.first_line_indent = Pt(0)\n    p.paragraph_format.space_before = Pt(92)"
end = t.find(end_marker)
assert start > 0 and end > start, (start, end)

BLOCK = '''    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER

    def base_stops(para, extra):
        pf = para.paragraph_format
        for pos, align in [(8.6, WD_TAB_ALIGNMENT.RIGHT), (8.9, WD_TAB_ALIGNMENT.LEFT)]:
            pf.tab_stops.add_tab_stop(Cm(pos), align, WD_TAB_LEADER.SPACES)
        for pos in extra:
            pf.tab_stops.add_tab_stop(Cm(pos), WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES)
        pf.tab_stops.add_tab_stop(Cm(15.9), WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES)

    def field_para(label, value, lead=10.2, gap=40.5, size=14, first=False):
        para = doc.add_paragraph()
        pf = para.paragraph_format
        pf.first_line_indent = Pt(0)
        pf.space_before = Pt(58 if first else 0)
        pf.space_after = Pt(gap)
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing = Pt(size)
        base_stops(para, [lead] if lead > 8.9 else [])
        if label:
            run = para.add_run(label)
            set_font(run, SONG, size)
        run = para.add_run("\\t\\t")
        set_font(run, SONG, size)
        if lead > 8.9:
            run = para.add_run("\\t")
            set_font(run, SONG, size)
            run.font.underline = True
        run = para.add_run(value)
        set_font(run, SONG, size)
        run.font.underline = True
        run = para.add_run("\\t")
        set_font(run, SONG, size)
        run.font.underline = True
        return para

    field_para("题　　目", "基于 Vue3 的校园自习室预约", lead=8.9, gap=8.7, first=True)
    field_para("", "管理系统的设计与实现", lead=8.9)
    field_para("二级学院", "计算机学院")
    field_para("专　　业", "计算机科学与技术")
    field_para("学生姓名", "李洋")

    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.first_line_indent = Pt(0)
    pf.space_before = Pt(0)
    pf.space_after = Pt(40.5)
    pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    pf.line_spacing = Pt(14)
    base_stops(para, [11.6, 12.5])

    def seg(text, underline=False):
        run = para.add_run(text)
        set_font(run, SONG, 14)
        if underline:
            run.font.underline = True

    seg("学　　号")
    seg("\\t\\t")
    seg("233020152", underline=True)
    seg("\\t", underline=True)
    seg("年　　级")
    seg("\\t")
    seg("2023", underline=True)
    seg("\\t", underline=True)

    field_para("指导教师", "黄媛媛")

'''

t = t[:start] + BLOCK + t[end:]
io.open(p, "w", encoding="utf-8").write(t)
print("cover final variant written")
