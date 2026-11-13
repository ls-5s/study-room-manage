# -*- coding: utf-8 -*-
"""修正摘要/Abstract 页的标签字体：中文标签黑体，英文标签 Times 加粗；Abstract 信息行 Times 加粗。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) Abstract 页：Major/Student/标题行用 Times 加粗
old = '''                    if k == 0:
                        para.paragraph_format.space_before = Pt(5)
                        para.paragraph_format.space_after = Pt(14 if tight else 29)
                        add_inline(para, txt, size=18, font=HEI)
                    else:
                        para.paragraph_format.space_after = Pt(12 if tight else 22)
                        add_inline(para, txt, size=14, font="楷体")'''
new = '''                    if k == 0:
                        para.paragraph_format.space_before = Pt(5)
                        para.paragraph_format.space_after = Pt(14 if tight else 29)
                        add_inline(para, txt, size=18, font=HEI)
                    elif tight:
                        para.paragraph_format.space_after = Pt(12 if tight else 22)
                        add_inline(para, txt, size=14, bold=True, font="Times New Roman")
                    else:
                        para.paragraph_format.space_after = Pt(12 if tight else 22)
                        add_inline(para, txt, size=14, font="楷体")'''
assert old in t, "abstract branch"
t = t.replace(old, new, 1)

# 2) 正文段落：按标签拆分字体
old_p = '''        p = doc.add_paragraph()
        add_inline(p, line.strip())
        i += 1'''
new_p = '''        p = doc.add_paragraph()
        text = line.strip()
        label_specs = [
            ("摘要：", 12, False, HEI),
            ("关键词：", 12, False, HEI),
            ("Abstract:", 12, True, "Times New Roman"),
            ("Key Words:", 12, True, "Times New Roman"),
        ]
        matched = False
        for label, size, bold, font in label_specs:
            if text.startswith(label):
                r1 = p.add_run(label)
                set_font(r1, font, size)
                r1.font.bold = bold
                rest = text[len(label):]
                if rest.startswith(" "):
                    rest = rest[1:]
                    r1.text = label + " "
                add_inline(p, rest, size=size)
                matched = True
                break
        if not matched:
            add_inline(p, text)
        i += 1'''
assert old_p in t, "paragraph branch"
t = t.replace(old_p, new_p, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("label fonts patched")
