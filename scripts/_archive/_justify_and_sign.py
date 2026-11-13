# -*- coding: utf-8 -*-
"""关键修正：全文两端对齐；声明页签名与日期用制表位精确对位。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) Normal 样式两端对齐
old_body = "def body_style(doc):"
i = t.find(old_body)
assert i > 0
j = t.find("def ", i + 10)
seg = t[i:j]
if "JUSTIFY" not in seg:
    t = t[:j] + '    doc.styles["Normal"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY\n\n\n' + t[j:]

# 2) 声明标题一后距 21 -> 15
t = t.replace("p.paragraph_format.space_after = Pt(21)", "p.paragraph_format.space_after = Pt(15)")

# 3) 作者签名：去下划线，缩进 6.67cm；日期用制表位
old = '''    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(6.6)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "作者签名：__________", size=14, font="等线")
    for _ in range(3):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(6.6)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "日期：    年   月   日", size=14, font="等线")'''
new = '''    p = doc.add_paragraph()
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
    add_inline(p, "日期：\\t年\\t月\\t日", size=14, font="等线")'''
assert old in t, "sign block"
t = t.replace(old, new, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("justify + signature tabs patched")
