# -*- coding: utf-8 -*-
"""表格行高 22 pt（参考实测行距 22.0-22.2），题注间距 8 pt。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 题注：图下间距 8
t = t.replace('''def add_caption(doc, text, keep_next=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)''',
'''def add_caption(doc, text, keep_next=False):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(10)''')

# 表格行高 22pt
anchor = "def three_line_table(doc, rows):"
i = t.find(anchor)
assert i > 0
j = t.find("def ", i + 10)
seg = t[i:j]
if "trHeight" not in seg:
    ins = '''    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        h = OxmlElement("w:trHeight")
        h.set(qn("w:val"), "440")
        h.set(qn("w:hRule"), "atLeast")
        trPr.append(h)
'''
    pos = seg.find("    tbl = table._tbl")
    t = t[:i + pos] + ins + t[i + pos:]

io.open(p, "w", encoding="utf-8").write(t)
print("table row height and caption gaps set")
