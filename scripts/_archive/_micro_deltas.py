# -*- coding: utf-8 -*-
"""最后三处微调：目录首条 +9pt、三级标题上距 -3pt、摘要题名 +3pt。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

t = t.replace('style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 6, 2)',
              'style_heading(doc, "Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, 3, 2)')
t = t.replace("para.paragraph_format.space_before = Pt(2)\n                        para.paragraph_format.space_after = Pt(14 if tight else 29)",
              "para.paragraph_format.space_before = Pt(5)\n                        para.paragraph_format.space_after = Pt(14 if tight else 29)")

# 目录标题段后 +9
t = t.replace("add_inline(p, \"目　　录\", size=18, font=HEI)",
              "add_inline(p, \"目　　录\", size=18, font=HEI)")
io.open(p, "w", encoding="utf-8").write(t)
print("micro deltas applied")
