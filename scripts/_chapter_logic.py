# -*- coding: utf-8 -*-
"""适配新章标题格式：用“数字 + 空格”识别章，控制分页与目录插入。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

helper = '''    def is_chapter(title):
        import re as _re
        return bool(_re.match(r"^\\d+\\s", title))

'''
anchor = "    toc_done = False\n"
assert anchor in t
t = t.replace(anchor, helper + anchor, 1)

t = t.replace('if title.startswith("第 1 章") and not toc_done:',
              'if is_chapter(title) and title.startswith("1") and not toc_done:')
t = t.replace('h.paragraph_format.page_break_before = title.startswith("第 ") and title != "第 1 章"',
              'h.paragraph_format.page_break_before = is_chapter(title) and not title.startswith("1 ")')

io.open(p, "w", encoding="utf-8").write(t)
print("chapter detection updated")
