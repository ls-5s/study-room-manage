# -*- coding: utf-8 -*-
"""支持 <!--break--> 手动分页；在表 3-2 前插入，避免表格被切到页底。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

anchor = '''        if line.startswith("!["):'''
ins = '''        if line.strip() == "<!--break-->":
            doc.add_page_break()
            i += 1
            continue

'''
assert anchor in t
t = t.replace(anchor, ins + anchor, 1)
io.open(p, "w", encoding="utf-8").write(t)

md = "thesis/drafts/03-需求分析.md"
s = io.open(md, encoding="utf-8").read()
if "表 3-2 预约状态迁移表" in s and "<!--break-->" not in s:
    s = s.replace("表 3-2 预约状态迁移表", "<!--break-->\n\n表 3-2 预约状态迁移表", 1)
    io.open(md, "w", encoding="utf-8").write(s)
    print("page break inserted before table 3-2")
print("done")
