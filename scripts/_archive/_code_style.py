# -*- coding: utf-8 -*-
"""代码块按参考：Times New Roman 斜体 10.5、行距 20、左缩进 5.6pt、无底纹。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

i = t.find("def add_code(doc, lines):")
assert i > 0
j = t.find("\ndef ", i + 10)
seg = t[i:j]

new = '''def add_code(doc, lines):
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

'''
t = t[:i] + new + t[j + 1:]

io.open(p, "w", encoding="utf-8").write(t)
print("code block style set to reference")
