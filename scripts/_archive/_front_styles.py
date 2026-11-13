# -*- coding: utf-8 -*-
"""一次性调整：页眉双线/字号、页码字号、章标题左对齐、声明与授权书字号行距、摘要页结构。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 章标题左对齐（参考 x=85.1）
t = t.replace('style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.CENTER, 12, 12)',
              'style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.LEFT, 12, 18)')

# 2) 页眉：五号 + 双线；页码五号
old_hdr = '''def setup_header_footer(section):
    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("成都锦城学院毕业论文（设计）")
    set_font(run, SONG, 9)

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_field(fp, "PAGE")'''
new_hdr = '''def setup_header_footer(section):
    section.header_distance = Cm(1.55)
    header = section.header
    p = header.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run("成都锦城学院毕业论文（设计）")
    set_font(run, SONG, 10.5)
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
    add_field(fp, "PAGE", size=10.5)'''
assert old_hdr in t, "header block"
t = t.replace(old_hdr, new_hdr)

# 3) 声明与授权书：标题 18、正文 14、行距 38/28.5
old_decl = t[t.find("    doc.add_page_break()\n    p = doc.add_paragraph()\n    p.alignment = WD_ALIGN_PARAGRAPH.CENTER\n    p.paragraph_format.first_line_indent = Pt(0)\n    run = p.add_run(\"成都锦城学院\")"):]
assert old_decl
end_decl = old_decl.find("    # ---- 正文 Markdown ----")
decl_block = old_decl[:end_decl]

new_decl = '''    doc.add_page_break()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(28)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")
    set_font(run, HEI, 18, False)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(16)
    run = p.add_run("毕业论文（设计）学术诚信声明")
    set_font(run, HEI, 18, False)

    def decl_body(text, spacing=38, gap_before=44):
        para = doc.add_paragraph()
        pf = para.paragraph_format
        pf.first_line_indent = Pt(28)
        pf.space_before = Pt(gap_before)
        pf.space_after = Pt(0)
        pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
        pf.line_spacing = Pt(spacing)
        add_inline(para, text, size=14)
        return para

    decl_body("本人郑重声明：所呈交的毕业论文（设计），是本人在导师的指导下，独立进行研究工作所取得的成果。除文中已经注明引用的内容外，本论文（设计）不包含任何其他个人或集体已经发表或撰写过的作品成果。对本文的研究做出重要贡献的个人和集体，均已在文中以明确方式标明。本人完全意识到本声明的法律结果由本人承担。")

    for _ in range(5):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.left_indent = Cm(4.6)
    add_inline(p, "作者签名：____________", size=14)
    for _ in range(2):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.left_indent = Cm(4.6)
    add_inline(p, "日期：      年    月    日", size=14)

    doc.add_page_break()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(84)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")
    set_font(run, HEI, 18, False)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(16)
    run = p.add_run("毕业论文（设计）版权使用授权书")
    set_font(run, HEI, 18, False)
    decl_body("本毕业论文（设计）作者同意学校保留并向国家有关部门或机构送交论文的复印件和电子版，允许论文被查阅和借阅。本人授权成都锦城学院可以将本毕业论文（设计）的全部或部分内容编入有关数据库进行检索，可以采用影印、缩印或扫描等复制手段保存和汇编本毕业论文（设计）。", spacing=28.5)

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

'''

t = t.replace(decl_block, new_decl)
io.open(p, "w", encoding="utf-8").write(t)
print("styles patched")
