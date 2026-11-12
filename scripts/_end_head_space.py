# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
anchor = '''            h.paragraph_format.page_break_before = (is_chapter(title) and not title.startswith("1 ")) or title in ("参考文献", "致谢")'''
assert anchor in t, "anchor"
add = anchor + '''
            if title in ("参考文献", "致谢"):
                h.paragraph_format.space_before = Pt(0)'''
t = t.replace(anchor, add, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("end headings spacing set")
