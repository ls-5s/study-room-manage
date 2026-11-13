# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
old = 'p.paragraph_format.space_after = Pt(50)\n    run = p.add_run("本科生毕业论文（设计）")'
new = 'p.paragraph_format.space_after = Pt(46)\n    run = p.add_run("本科生毕业论文（设计）")'
assert old in t, "title2 space"
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("title2 gap -4pt")
