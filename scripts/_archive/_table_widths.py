# -*- coding: utf-8 -*-
"""表格列宽按内容长度分配，减少字符级换行。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

i = t.find("def three_line_table(doc, rows):")
assert i > 0
j = t.find("\n    tbl = table._tbl", i)
assert j > i

ins = '''    cols = len(rows[0])
    lens = []
    for c in range(cols):
        longest = max((len(r[c]) if c < len(r) else 0) for r in rows)
        lens.append(max(longest, 2) ** 0.6)
    total = sum(lens)
    widths = [max(1.1, 15.5 * v / total) for v in lens]
    scale = 15.5 / sum(widths)
    widths = [w * scale for w in widths]
'''
# 在 cols = len(rows[0]) 之后插入宽度计算
t = t[:i] + t[i:].replace("    cols = len(rows[0])", ins.rstrip("\n"), 1)

# 应用宽度：在表格创建后设置列宽
k = t.find("    tbl = table._tbl", i)
apply = '''    for idx_w, wcm in enumerate(widths):
        for cell in table.columns[idx_w].cells:
            cell.width = Cm(wcm)
'''
t = t[:k] + apply + t[k:]

io.open(p, "w", encoding="utf-8").write(t)
print("table column widths by content")
