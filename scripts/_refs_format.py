# -*- coding: utf-8 -*-
"""参考文献：独立起页、条目五号、悬挂缩进 0.65cm；致谢独立起页。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 参考文献 / 致谢 另起页
old = 'h.paragraph_format.page_break_before = is_chapter(title) and not title.startswith("1 ")'
new = 'h.paragraph_format.page_break_before = (is_chapter(title) and not title.startswith("1 ")) or title in ("参考文献", "致谢")'
assert old in t
t = t.replace(old, new, 1)

# 2) 参考文献条目特殊排版
old2 = '''        p = doc.add_paragraph()
        text = line.strip()'''
new2 = '''        p = doc.add_paragraph()
        text = line.strip()
        if text.startswith("[") and "] " in text[:8]:
            p.paragraph_format.left_indent = Cm(0.65)
            p.paragraph_format.first_line_indent = Cm(-0.65)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
            p.paragraph_format.line_spacing = Pt(22)
            add_inline(p, text, size=10.5)
            i += 1
            continue'''
assert old2 in t
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("references formatting patched")
