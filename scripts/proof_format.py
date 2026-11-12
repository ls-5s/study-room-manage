# -*- coding: utf-8 -*-
"""用参考页 2 的原文、本稿的格式设置生成对照 DOCX，用于叠图验证格式一致性。"""
import io
import os

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

OUT_DIR = "thesis/final"
DOCX = os.path.join(OUT_DIR, "格式验证.docx")

BODY = (
    "本人郑重声明：所呈交的毕业论文（设计），是本人在导师的指导下，独立进行研究工作所取得的成果。"
    "除文中已经注明引用的内容外，本论文（设计）不包含任何其他个人或集体已经发表或撰写过的作品成果。"
    "对本文的研究做出重要贡献的个人和集体，均已在文中以明确方式标明。"
    "本人完全意识到本声明的法律结果由本人承担。"
)

doc = Document()
sec = doc.sections[0]
sec.page_width = Cm(21.0)
sec.page_height = Cm(29.7)
sec.left_margin = Cm(3.0)
sec.right_margin = Cm(2.5)
sec.top_margin = Cm(2.9)
sec.bottom_margin = Cm(2.5)
sec.header_distance = Cm(2.0)
sec.footer_distance = Cm(1.27)

# 页眉：行楷 10.5 + 双线
hp = sec.header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
hr = hp.add_run("成都锦城学院毕业论文（设计）")
hr.font.name = "华文行楷"
hr._element.rPr.rFonts.set(qn("w:eastAsia"), "华文行楷")
hr.font.size = Pt(10.5)
pPr = hp._p.get_or_add_pPr()
pBdr = OxmlElement("w:pBdr")
bottom = OxmlElement("w:bottom")
bottom.set(qn("w:val"), "double")
bottom.set(qn("w:sz"), "6")
bottom.set(qn("w:space"), "2")
bottom.set(qn("w:color"), "000000")
pBdr.append(bottom)
pPr.append(pBdr)

# 页码 I
fp = sec.footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = fp.add_run("I")
run.font.size = Pt(10.5)

# 标题
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent = Pt(0)
p.paragraph_format.space_before = Pt(2)
p.paragraph_format.space_after = Pt(21)
r = p.add_run("成都锦城学院")
r.font.name = "黑体"
r._element.rPr.rFonts.set(qn("w:eastAsia"), "黑体")
r.font.size = Pt(18)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent = Pt(0)
p.paragraph_format.space_after = Pt(14)
r = p.add_run("毕业论文（设计）学术诚信声明")
r.font.name = "黑体"
r._element.rPr.rFonts.set(qn("w:eastAsia"), "黑体")
r.font.size = Pt(18)

# 正文：等线 14，行距固定 38，首行缩进 28
p = doc.add_paragraph()
pf = p.paragraph_format
pf.first_line_indent = Pt(28)
pf.space_before = Pt(44)
pf.space_after = Pt(0)
pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY
pf.line_spacing = Pt(38)
pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
r = p.add_run(BODY)
r.font.name = "等线"
r._element.rPr.rFonts.set(qn("w:eastAsia"), "等线")
r.font.size = Pt(14)

# 签名
for _ in range(9):
    doc.add_paragraph()
p = doc.add_paragraph()
p.paragraph_format.left_indent = Cm(6.9)
p.paragraph_format.first_line_indent = Pt(0)
r = p.add_run("作者签名：")
r.font.name = "等线"
r._element.rPr.rFonts.set(qn("w:eastAsia"), "等线")
r.font.size = Pt(14)

doc.save(DOCX)
print("saved", DOCX)
