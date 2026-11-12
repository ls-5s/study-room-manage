# -*- coding: utf-8 -*-
"""微调声明页两处间距使其与参考对齐。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace("p.paragraph_format.space_after = Pt(15)", "p.paragraph_format.space_after = Pt(22)")
t = t.replace("def decl_body(text, spacing=38, gap_before=44):", "def decl_body(text, spacing=38, gap_before=41):")
io.open(p, "w", encoding="utf-8").write(t)
print("declaration spacing tuned")
