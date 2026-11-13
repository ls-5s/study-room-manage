# -*- coding: utf-8 -*-
"""合并草稿并按实测版式生成 DOCX。"""
import os
import re

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAFT = os.path.join(ROOT, "thesis", "drafts")
FINAL = os.path.join(ROOT, "thesis", "final")

ORDER = [
    "00-摘要.md", "01-绪论.md", "02-关键技术.md", "03-需求分析.md",
    "04-系统设计.md", "05-详细设计与实现-1.md", "05-详细设计与实现-2.md",
    "06-系统测试.md", "07-结束语.md", "参考文献.md", "08-致谢.md",
]

SONG = "宋体"
HEI = "黑体"
TNR = "Times New Roman"
MONO = "Consolas"


def merge():
    parts = []
    for name in ORDER:
        with open(os.path.join(DRAFT, name), encoding="utf-8-sig") as fp:
            parts.append(fp.read().strip())
    text = "\n\n".join(parts)
    os.makedirs(FINAL, exist_ok=True)
    out = os.path.join(FINAL, "论文终稿.md")
    with open(out, "w", encoding="utf-8") as fp:
        fp.write(text + "\n")
    return out, text


def set_font(run, name=SONG, size=12, bold=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), name)
    rfonts.set(qn("w:ascii"), TNR if name == SONG else name)
    rfonts.set(qn("w:hAnsi"), TNR if name == SONG else name)


def body_style(doc):
    st = doc.styles["Normal"]
    st.font.name = SONG
    st.font.size = Pt(12)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), SONG)
    pf = st.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    pf.line_spacing = Pt(22)
    pf.first_line_indent = Pt(24)
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)


    doc.styles["Normal"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def style_heading(doc, name, size, align, before, after, bold=False):
    st = doc.styles[name]
    st.font.name = HEI
    st.font.size = Pt(size)
    st.font.bold = bold
    st.font.color.rgb = RGBColor(0, 0, 0)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), HEI)
    st.element.rPr.rFonts.set(qn("w:ascii"), TNR)
    st.element.rPr.rFonts.set(qn("w:hAnsi"), TNR)
    pf = st.paragraph_format
    pf.alignment = align
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.first_line_indent = Pt(0)
    pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    pf.line_spacing = Pt(24)


def ensure_toc_styles(doc):
    from docx.oxml import parse_xml
    from docx.oxml.ns import nsdecls

    styles = doc.styles.element
    existing = {s.get(qn("w:styleId")) for s in styles.findall(qn("w:style"))}
    for level in (1, 2, 3):
        sid = "TOC%d" % level
        if sid in existing:
            continue
        name = "toc %d" % level
        left = 0 if level == 1 else (2 if level == 2 else 4)
        xml = (
            '<w:style %s w:type="paragraph" w:styleId="%s">'
            '<w:name w:val="%s"/><w:basedOn w:val="Normal"/>'
            '<w:pPr><w:spacing w:before="0" w:after="0" w:line="400" w:lineRule="exact"/>'
            '<w:ind w:left="%d" w:firstLine="0"/>'
            '</w:pPr>'
            '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="黑体"/>'
            '<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'
            '</w:style>'
        ) % (nsdecls("w"), sid, name, [0, 442, 878][level - 1])
        styles.append(parse_xml(xml))


def add_field(paragraph, instr, size=9):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = instr
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr_el)
    run._r.append(fld_sep)
    run._r.append(fld_end)
    set_font(run, SONG, size)


def page_number_format(section, fmt="decimal", start=1):
    sectPr = section._sectPr
    pg = sectPr.find(qn("w:pgNumType"))
    if pg is None:
        pg = OxmlElement("w:pgNumType")
        sectPr.append(pg)
    pg.set(qn("w:fmt"), fmt)
    pg.set(qn("w:start"), str(start))


def setup_header_footer(section):
    section.header_distance = Cm(2.0)
    section.footer_distance = Cm(1.94)
    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run("成都锦城学院毕业论文（设计）")
    set_font(run, "华文行楷", 10.5)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "double")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "2")
    bottom.set(qn("w:color"), "000000")
    pBdr.append(bottom)
    pPr.append(pBdr)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_field(fp, "PAGE", size=10.5)


def clear_runs(p):
    for r in list(p.runs):
        r._element.getparent().remove(r._element)


def add_inline(paragraph, text, size=12, bold=False, font=SONG):
    tokens = re.split(r"(<sup>.*?</sup>|\*\*.*?\*\*|`[^`]*`)", text)
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("<sup>"):
            run = paragraph.add_run(tok[5:-6])
            set_font(run, font, max(size - 3, 8))
            run.font.superscript = True
        elif tok.startswith("`") and tok.endswith("`") and len(tok) > 2:
            run = paragraph.add_run(tok[1:-1])
            set_font(run, font, size)
        elif tok.startswith("**") and tok.endswith("**") and len(tok) > 4:
            run = paragraph.add_run(tok[2:-2])
            set_font(run, font, size, True)
        else:
            run = paragraph.add_run(tok)
            set_font(run, font, size, bold)


def three_line_table(doc, rows):
    cols = len(rows[0])
    head = [c.strip() for c in rows[0]]
    if head[:3] == ["字段名", "数据类型", "主键"]:
        widths = [3.8, 3.4, 1.2, 1.2, 5.9]
    else:
        lens = []
        for c in range(cols):
            longest = max((len(r[c]) if c < len(r) else 0) for r in rows)
            lens.append(max(longest, 3) ** 0.75)
        total = sum(lens)
        widths = [max(1.4, 15.5 * v / total) for v in lens]
        scale = 15.5 / sum(widths)
        widths = [w * scale for w in widths]
    table = doc.add_table(rows=len(rows), cols=cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    for idx_w, wcm in enumerate(widths):
        for cell in table.columns[idx_w].cells:
            cell.width = Cm(wcm)
    for ri, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        trPr.append(cant)
        if ri < len(table.rows) - 1:
            for cell in row.cells:
                for para in cell.paragraphs:
                    para.paragraph_format.keep_with_next = True

    tbl = table._tbl
    tblPr = tbl.tblPr

    total_twips = int(Cm(15.5).twips)
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.insert(0, tblW)
    tblW.set(qn("w:w"), str(total_twips))
    tblW.set(qn("w:type"), "dxa")

    layout = tblPr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tblPr.append(layout)
    layout.set(qn("w:type"), "fixed")

    margins = OxmlElement("w:tblCellMar")
    for side in ("top", "bottom", "left", "right"):
        el = OxmlElement("w:" + side)
        el.set(qn("w:w"), "0")
        el.set(qn("w:type"), "dxa")
        margins.append(el)
    tblPr.append(margins)

    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        cols_el = grid.findall(qn("w:gridCol"))
        for idx_w, wcm in enumerate(widths[:len(cols_el)]):
            cols_el[idx_w].set(qn("w:w"), str(int(Cm(wcm).twips)))

    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tblPr.append(borders)

    for i, row in enumerate(rows):
        for j, cell_text in enumerate(row):
            cell = table.cell(i, j)
            cell.text = ""
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            add_inline(p, cell_text, size=10.5)
        if i == 0:
            for cell in table.rows[0].cells:
                tcPr = cell._tc.get_or_add_tcPr()
                tcB = OxmlElement("w:tcBorders")
                bottom = OxmlElement("w:bottom")
                bottom.set(qn("w:val"), "single")
                bottom.set(qn("w:sz"), "4")
                bottom.set(qn("w:color"), "000000")
                tcB.append(bottom)
                tcPr.append(tcB)
    return table


def add_caption(doc, text, keep_next=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(9)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if keep_next:
        p.paragraph_format.keep_with_next = True
    add_inline(p, text, size=10.5)


def add_code(doc, lines):
    for line in lines:
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.left_indent = Pt(5.6)
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        p.paragraph_format.line_spacing = Pt(20)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(line if line else " ")
        set_font(run, "Times New Roman", 10.5)
        run.font.italic = True

def add_image(doc, path, width_cm=15.5):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.keep_with_next = True
    from PIL import Image as _Img
    with _Img.open(path) as im:
        w, h = im.size
    target = width_cm
    path_norm = path.replace("\\", "/")
    if w and h and re.search(r"fig4-(?:[4-9]|1[0-3])\.png$", path_norm):
        # 实体属性图按高度 283.5 pt（参考 275-291）
        target = min(width_cm, 10.0 * w / h)
    elif w and h and (h / w) * target > 18.3:
        target = 18.3 * w / h
    run = p.add_run()
    run.add_picture(path, width=Cm(target))


def build_docx(md_path, out_path):
    doc = Document()
    body_style(doc)
    ensure_toc_styles(doc)
    style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.LEFT, 11, 2)
    style_heading(doc, "Heading 2", 14, WD_ALIGN_PARAGRAPH.LEFT, 4, 2)
    style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 3, 2)
    style_heading(doc, "Heading 4", 12, WD_ALIGN_PARAGRAPH.LEFT, 3, 3, bold=True)

    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.left_margin = Cm(3.0)
    sec.right_margin = Cm(2.5)
    sec.top_margin = Cm(2.9)
    sec.bottom_margin = Cm(2.5)

    # 封面独立成节：无页眉、无页码
    sec.header.is_linked_to_previous = False
    sec.footer.is_linked_to_previous = False
    for p in sec.header.paragraphs:
        p.text = ""
    for p in sec.footer.paragraphs:
        p.text = ""

    # ---- 封面 ----
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(44)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(32)
    run = p.add_run("成都锦城学院")
    set_font(run, "微软雅黑", 24.5, True)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(46)
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
        mar = tblPr.find(qn("w:tblCellMar"))
        if mar is None:
            mar = OxmlElement("w:tblCellMar")
            tblPr.append(mar)
        for side, val in (("top", "0"), ("bottom", "0"), ("left", "28"), ("right", "28")):
            el = mar.find(qn("w:" + side))
            if el is None:
                el = OxmlElement("w:" + side)
                mar.append(el)
            el.set(qn("w:w"), val)
            el.set(qn("w:type"), "dxa")
        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))
        for j, w in enumerate(widths):
            for cell in table.columns[j].cells:
                cell.width = w

    SIZE = 14
    W_LABEL, W_VALUE = Cm(2.27), Cm(6.98)

    def cell_text(cell, text, width, is_label, size=SIZE, row_h=None, align=None):
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
                              if len(text) <= 2 else WD_ALIGN_PARAGRAPH.LEFT)
        else:
            para.alignment = align or WD_ALIGN_PARAGRAPH.CENTER
            para_bottom_border(para)
        run = para.add_run(text)
        set_font(run, SONG, size)

    # 题目两行
    table = doc.add_table(rows=2, cols=2)
    for i, line in enumerate(["基于 Vue3 的校园自习室", "预约管理系统的设计与实现"]):
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
    widths = [Cm(2.27), Cm(3.22), Cm(1.15), Cm(2.56)]
    cell_text(table.cell(0, 0), "学号", widths[0], True)
    cell_text(table.cell(0, 1), "233020152", widths[1], False, align=WD_ALIGN_PARAGRAPH.LEFT)
    cell_text(table.cell(0, 2), "年级", widths[2], True)
    cell_text(table.cell(0, 3), "2023", widths[3], False, align=WD_ALIGN_PARAGRAPH.LEFT)
    fix_layout(table, widths)

    table = doc.add_table(rows=1, cols=2)
    table.rows[0].height = Cm(1.92)
    cell_text(table.cell(0, 0), "指导教师", W_LABEL, True)
    cell_text(table.cell(0, 1), "黄媛媛", W_VALUE, False)
    fix_layout(table, [W_LABEL, W_VALUE])

    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(63)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(8.24)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "教务处  制表", size=16)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(8.85)
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(12)
    add_inline(p, "2026 年 11 月 12 日", size=15)

    # 声明起另起一节：有页眉、罗马页码
    body_sec = doc.add_section(WD_SECTION.NEW_PAGE)
    body_sec.left_margin = Cm(3.0)
    body_sec.right_margin = Cm(2.5)
    body_sec.top_margin = Cm(2.9)
    body_sec.bottom_margin = Cm(2.5)
    body_sec.header.is_linked_to_previous = False
    body_sec.footer.is_linked_to_previous = False
    setup_header_footer(body_sec)
    page_number_format(body_sec, "upperRoman", 1)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(22)
    p.paragraph_format.left_indent = Cm(0.66)
    run = p.add_run("成都锦城学院")
    set_font(run, HEI, 18, False)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(14)
    p.paragraph_format.left_indent = Cm(0.66)
    run = p.add_run("毕业论文（设计）学术诚信声明")
    set_font(run, HEI, 18, False)

    def decl_body(text, spacing=38, gap_before=41):
        para = doc.add_paragraph()
        pf = para.paragraph_format
        pf.first_line_indent = Pt(28)
        pf.space_before = Pt(gap_before)
        pf.space_after = Pt(0)
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing = Pt(spacing)
        add_inline(para, text, size=14, font="等线")
        return para

    decl_body("本人郑重声明：所呈交的毕业论文（设计），是本人在导师的指导下，独立进行研究工作所取得的成果。除文中已经注明引用的内容外，本论文（设计）不包含任何其他个人或集体已经发表或撰写过的作品成果。对本文的研究做出重要贡献的个人和集体，均已在文中以明确方式标明。本人完全意识到本声明的法律结果由本人承担。")

    for _ in range(9):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(6.67)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "作者签名：", size=14, font="等线")
    for _ in range(3):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(6.67)
    p.paragraph_format.first_line_indent = Pt(0)
    for pos in (Cm(9.63), Cm(10.86), Cm(12.09)):
        p.paragraph_format.tab_stops.add_tab_stop(pos)
    add_inline(p, "日期：\t年\t月\t日", size=14, font="等线")

    doc.add_page_break()
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(0)
    sp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    sp.paragraph_format.line_spacing = Pt(84)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")
    set_font(run, HEI, 18, False)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(16)
    run = p.add_run("毕业论文（设计）版权使用授权书")
    set_font(run, HEI, 18, False)
    decl_body("本毕业论文（设计）作者同意学校保留并向国家有关部门或机构送交论文的复印件和电子版，允许论文被查阅和借阅。本人授权成都锦城学院可以将本毕业论文（设计）的全部或部分内容编入有关数据库进行检索，可以采用影印、缩印或扫描等复制手段保存和汇编本毕业论文（设计）。", spacing=28.5, gap_before=56)

    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "作者签名：____________        指导教师签名：____________", size=14)
    for _ in range(2):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "日期：    年  月  日            日期：    年  月  日", size=14)

    # ---- 正文 Markdown ----
    with open(md_path, encoding="utf-8") as fp:
        lines = fp.read().split("\n")

    i = 0
    in_body = False
    def is_chapter(title):
        import re as _re
        return bool(_re.match(r"^\d+\s", title))

    toc_done = False
    n = len(lines)

    doc.add_page_break()

    while i < n:
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue

        if line.startswith("# "):
            title = line[2:].strip()
            if is_chapter(title) and title.startswith("1") and not toc_done:
                doc.add_page_break()
                sp1 = doc.add_paragraph()
                sp1.paragraph_format.space_before = Pt(0)
                sp1.paragraph_format.space_after = Pt(0)
                sp1.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
                sp1.paragraph_format.line_spacing = Pt(3)
                h = doc.add_paragraph()
                h.alignment = WD_ALIGN_PARAGRAPH.CENTER
                h.paragraph_format.first_line_indent = Pt(0)
                h.paragraph_format.space_before = Pt(0)
                h.paragraph_format.space_after = Pt(6.8)
                run = h.add_run("目  录")
                set_font(run, HEI, 18, False)
                p = doc.add_paragraph()
                p.paragraph_format.first_line_indent = Pt(0)
                add_field(p, 'TOC \\o "1-3" \\h \\z \\u', size=12)

                new_sec = doc.add_section(WD_SECTION.NEW_PAGE)
                new_sec.left_margin = Cm(3.0)
                new_sec.right_margin = Cm(2.5)
                new_sec.top_margin = Cm(2.9)
                new_sec.bottom_margin = Cm(2.5)
                new_sec.header.is_linked_to_previous = True
                new_sec.footer.is_linked_to_previous = True
                page_number_format(new_sec, "decimal", 1)
                toc_done = True
                in_body = True

            if title in ("摘要", "Abstract"):
                i += 1
                picked = []
                while i < n and len(picked) < 3:
                    if lines[i].strip():
                        picked.append(lines[i].strip())
                    i += 1
                tight = title == "Abstract"
                for k, txt in enumerate(picked):
                    if k == 0:
                        sp0 = doc.add_paragraph()
                        sp0.paragraph_format.space_before = Pt(0)
                        sp0.paragraph_format.space_after = Pt(0)
                        sp0.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
                        sp0.paragraph_format.line_spacing = Pt(3)
                    para = doc.add_paragraph()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    para.paragraph_format.first_line_indent = Pt(0)
                    if k == 0:
                        para.paragraph_format.space_before = Pt(0)
                        para.paragraph_format.space_after = Pt(31 if tight else 29)
                        add_inline(para, txt, size=18, font=HEI)
                    elif tight:
                        para.paragraph_format.space_after = Pt(22)
                        add_inline(para, txt, size=14, bold=True, font="Times New Roman")
                    else:
                        para.paragraph_format.space_after = Pt(22)
                        add_inline(para, txt, size=14, font="楷体")
                continue

            top_offset = ((is_chapter(title) and not title.startswith("1 "))
                          or title in ("参考文献", "致谢"))

            h = doc.add_paragraph(style="Heading 1")
            h.paragraph_format.page_break_before = (is_chapter(title) and not title.startswith("1 ")) or title in ("参考文献", "致谢")
            if is_chapter(title):
                h.paragraph_format.space_before = Pt(11) if title.startswith("1 ") else Pt(0)
            if title in ("参考文献", "致谢"):
                h.paragraph_format.space_before = Pt(0)
            if title == "参考文献":
                h.paragraph_format.space_after = Pt(6.8)
            if title == "致谢":
                h.paragraph_format.space_after = Pt(6)
            if top_offset:
                h.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
                h.paragraph_format.line_spacing = Pt(25.5)
            add_inline(h, title, size=18, font=HEI)
            i += 1
            continue

        if line.startswith("## "):
            h = doc.add_paragraph(style="Heading 2")
            add_inline(h, line[3:].strip(), size=14, font=HEI)
            i += 1
            continue

        if line.startswith("### "):
            h = doc.add_paragraph(style="Heading 3")
            add_inline(h, line[4:].strip(), size=12, font=HEI)
            i += 1
            continue

        if line.startswith("#### "):
            h = doc.add_paragraph(style="Heading 4")
            add_inline(h, line[5:].strip(), size=12, font=HEI)
            i += 1
            continue

        m = re.match(r"^\*\*（[一二三四五六]）.*\*\*$", line.strip())
        if m:
            h = doc.add_paragraph(style="Heading 4")
            add_inline(h, line.strip().strip("*"), size=12, font=HEI)
            i += 1
            continue

        if line.strip() == "<!--break-->":
            doc.add_page_break()
            i += 1
            continue

        if line.startswith("!["):
            m = re.match(r"^!\[(.*?)\]\((.*?)\)$", line.strip())
            if m:
                img = os.path.normpath(os.path.join(FINAL, m.group(2)))
                if os.path.exists(img):
                    add_image(doc, img)
                i += 1
                continue

        if line.startswith("图 ") and re.match(r"^图 \d+-\d+", line.strip()):
            add_caption(doc, line.strip())
            i += 1
            continue

        if line.startswith("表 ") and re.match(r"^表 \d+-\d+", line.strip()):
            caption = line.strip()
            j = i + 1
            while j < n and not lines[j].strip():
                j += 1
            if j < n and lines[j].lstrip().startswith("|"):
                add_caption(doc, caption, keep_next=True)
                rows = []
                while j < n and lines[j].lstrip().startswith("|"):
                    raw = lines[j].strip().strip("|")
                    cells = [c.strip() for c in raw.split("|")]
                    if not re.match(r"^:?-{2,}", cells[0]):
                        rows.append(cells)
                    j += 1
                if rows:
                    three_line_table(doc, rows)
                i = j
                continue
            add_caption(doc, caption)
            i += 1
            continue

        if line.strip().startswith("```"):
            j = i + 1
            block = []
            while j < n and not lines[j].strip().startswith("```"):
                block.append(lines[j].rstrip())
                j += 1
            add_code(doc, block)
            i = j + 1
            continue

        if line.lstrip().startswith("|"):
            rows = []
            j = i
            while j < n and lines[j].lstrip().startswith("|"):
                raw = lines[j].strip().strip("|")
                cells = [c.strip() for c in raw.split("|")]
                if not re.match(r"^:?-{2,}", cells[0]):
                    rows.append(cells)
                j += 1
            if rows:
                three_line_table(doc, rows)
            i = j
            continue

        p = doc.add_paragraph()
        text = line.strip()
        if re.match(r"^\[\d+\]", text):
            p.paragraph_format.left_indent = Cm(0.65)
            p.paragraph_format.first_line_indent = Cm(-0.65)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
            p.paragraph_format.line_spacing = Pt(22)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            add_inline(p, text, size=10.5)
            i += 1
            continue
        label_specs = [
            ("摘要：", 12, False, HEI),
            ("关键词：", 12, False, HEI),
            ("Abstract:", 12, True, "Times New Roman"),
            ("Key Words:", 12, True, "Times New Roman"),
        ]
        matched = False
        for label, size, bold, font in label_specs:
            if text.startswith(label):
                r1 = p.add_run(label)
                set_font(r1, font, size)
                r1.font.bold = bold
                rest = text[len(label):]
                if rest.startswith(" "):
                    rest = rest[1:]
                    r1.text = label + " "
                add_inline(p, rest, size=size)
                matched = True
                break
        if not matched:
            add_inline(p, text)
        i += 1

    doc.save(out_path)
    return out_path


if __name__ == "__main__":
    md, _ = merge()
    out = build_docx(md, os.path.join(FINAL, "论文终稿.docx"))
    print("docx:", out, os.path.getsize(out), "bytes")
