# -*- coding: utf-8 -*-
"""摘要/Abstract 页按参考结构渲染：题名 18、专业与学生 14、正文以“摘要：”起。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

anchor = '''            h = doc.add_paragraph(style="Heading 1")
            h.paragraph_format.page_break_before = title.startswith("第 ") and title != "第 1 章"
            add_inline(h, title, size=18)
            i += 1
            continue'''
assert anchor in t

new = '''            if title in ("摘要", "Abstract"):
                i += 1
                picked = []
                while i < n and len(picked) < 3:
                    if lines[i].strip():
                        picked.append(lines[i].strip())
                    i += 1
                for k, txt in enumerate(picked):
                    para = doc.add_paragraph()
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    para.paragraph_format.first_line_indent = Pt(0)
                    if k == 0:
                        para.paragraph_format.space_before = Pt(6)
                        para.paragraph_format.space_after = Pt(20)
                        add_inline(para, txt, size=18)
                    else:
                        para.paragraph_format.space_after = Pt(16)
                        add_inline(para, txt, size=14)
                continue

''' + anchor

t = t.replace(anchor, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("abstract branch added")
