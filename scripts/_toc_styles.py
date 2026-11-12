# -*- coding: utf-8 -*-
"""注入 TOC1/TOC2/TOC3 样式：五号？不，参考为小四 12pt、行距 20pt、缩进 0/2/4 字符。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

anchor = "def add_field(paragraph, instr, size=9):"
assert anchor in t

helper = '''def ensure_toc_styles(doc):
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
            '<w:ind w:leftChars="%d" w:left="%d" w:firstLineChars="0" w:firstLine="0"/>'
            '</w:pPr>'
            '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/>'
            '<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'
            '</w:style>'
        ) % (nsdecls("w"), sid, name, left, left * 120)
        styles.append(parse_xml(xml))


def add_field(paragraph, instr, size=9):'''

t = t.replace(anchor, helper, 1)

# 调用：打开文档后
t = t.replace('    body_style(doc)\n', '    body_style(doc)\n    ensure_toc_styles(doc)\n', 1)

io.open(p, "w", encoding="utf-8").write(t)
print("toc styles injected")
