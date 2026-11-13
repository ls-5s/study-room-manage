# -*- coding: utf-8 -*-
"""表格行距/行高按参考 22pt：单元格 12pt 固定行距、零段距、行高精确 22pt；表头不加粗。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

t = t.replace('''        h.set(qn("w:val"), "440")
        h.set(qn("w:hRule"), "atLeast")''',
'''        h.set(qn("w:val"), "440")
        h.set(qn("w:hRule"), "exact")''')

t = t.replace('''            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            add_inline(p, cell_text, size=10.5, bold=(i == 0))''',
'''            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
            p.paragraph_format.line_spacing = Pt(12)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            add_inline(p, cell_text, size=10.5)''')

io.open(p, "w", encoding="utf-8").write(t)
print("table row metrics set")
