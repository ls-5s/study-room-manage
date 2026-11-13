# -*- coding: utf-8 -*-
"""按实测偏差修正：页眉高度、章标题上间距、声明签名行、摘要段间距、目录缩进。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 页眉下移 12.6pt
t = t.replace("section.header_distance = Cm(1.55)", "section.header_distance = Cm(2.0)")

# 2) 章标题上间距 +11pt
t = t.replace('style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.LEFT, 0, 2)',
              'style_heading(doc, "Heading 1", 18, WD_ALIGN_PARAGRAPH.LEFT, 11, 2)')

# 3) 小节段后距 4 -> 2
t = t.replace('style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 6, 4)',
              'style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 6, 2)')

# 4) 声明签名行：用缩进定位，避免换行
old_sign = '''    for _ in range(5):
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
    add_inline(p, "日期：      年    月    日", size=14)'''
new_sign = '''    for _ in range(6):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(6.6)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "作者签名：__________", size=14)
    for _ in range(1):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Cm(6.6)
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "日期：    年   月   日", size=14)'''
assert old_sign in t, "sign block"
t = t.replace(old_sign, new_sign, 1)

# 5) 摘要段间距对齐参考：题名后 24、专业/学生后 18
t = t.replace('para.paragraph_format.space_after = Pt(10 if tight else 16)',
              'para.paragraph_format.space_after = Pt(14 if tight else 24)')
t = t.replace('para.paragraph_format.space_after = Pt(8 if tight else 14)',
              'para.paragraph_format.space_after = Pt(12 if tight else 18)')

# 6) 目录缩进改用 twips（0 / 0.78cm / 1.55cm）
t = t.replace('<w:ind w:leftChars="%d" w:left="%d" w:firstLineChars="0" w:firstLine="0"/>',
              '<w:ind w:left="%d" w:firstLine="0"/>')
t = t.replace('left, left * 120)', 'left, [0, 442, 878][level - 1])')

io.open(p, "w", encoding="utf-8").write(t)
print("layout deltas patched")
