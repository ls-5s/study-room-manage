# -*- coding: utf-8 -*-
"""声明页签名位置与字体、标题右移微调。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '''    for _ in range(6):
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
new = '''    for _ in range(9):
        doc.add_paragraph()
    p = doc.add_paragraph()
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
assert old in t, "sign block"
t = t.replace(old, new, 1)

# 声明两行标题右移 0.44cm（参考标题中心偏右）
t = t.replace('''    p.paragraph_format.space_after = Pt(18)
    run = p.add_run("成都锦城学院")''',
'''    p.paragraph_format.space_after = Pt(18)
    p.paragraph_format.left_indent = Cm(0.44)
    run = p.add_run("成都锦城学院")''')
t = t.replace('''    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("毕业论文（设计）学术诚信声明")''',
'''    p.paragraph_format.space_after = Pt(14)
    p.paragraph_format.left_indent = Cm(0.44)
    run = p.add_run("毕业论文（设计）学术诚信声明")''')

io.open(p, "w", encoding="utf-8").write(t)
print("declaration page tuned")
