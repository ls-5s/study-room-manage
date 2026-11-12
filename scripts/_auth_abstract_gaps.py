# -*- coding: utf-8 -*-
"""授权书正文与签名下移、Abstract 段间距对齐参考。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 授权书正文 gap 41 -> 56
old_body = 'decl_body("本毕业论文（设计）作者同意学校保留'
i = t.find(old_body)
assert i > 0
j = t.find(")", i)
seg = t[i:j]
if "spacing=28.5" in seg and "gap_before" not in seg:
    t = t[:j] + ", gap_before=56" + t[j:]

# 2) 授权书签名 / 日期下移
t = t.replace('''    for _ in range(4):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "作者签名：__________        指导教师签名：__________", size=14)''',
'''    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(0)
    sp.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
    sp.paragraph_format.line_spacing = Pt(38)
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    add_inline(p, "作者签名：__________        指导教师签名：__________", size=14)''')

# 3) Abstract 段间距：标题后 31、信息行后 22
t = t.replace("para.paragraph_format.space_after = Pt(14 if tight else 29)",
              "para.paragraph_format.space_after = Pt(31 if tight else 29)")
t = t.replace("para.paragraph_format.space_after = Pt(12 if tight else 22)",
              "para.paragraph_format.space_after = Pt(22)")

io.open(p, "w", encoding="utf-8").write(t)
print("auth body/signature and abstract gaps patched")
