# -*- coding: utf-8 -*-
"""三线表按参考：等宽列、0.5pt 细线、全单元格居中、表宽 14.7cm 居中、行距 22.5pt。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 列宽改为等宽，总宽 14.7cm
old_w = '''    cols = len(rows[0])
    lens = []
    for c in range(cols):
        longest = max((len(r[c]) if c < len(r) else 0) for r in rows)
        lens.append(max(longest, 2) ** 0.6)
    total = sum(lens)
    widths = [max(1.1, 15.5 * v / total) for v in lens]
    scale = 15.5 / sum(widths)
    widths = [w * scale for w in widths]'''
new_w = '''    cols = len(rows[0])
    widths = [14.7 / cols] * cols'''
assert old_w in t, "width block"
t = t.replace(old_w, new_w, 1)

# 2) 行高 22.5pt（450 twips）
t = t.replace('h.set(qn("w:val"), "440")', 'h.set(qn("w:val"), "450")')

# 3) 线宽：顶/底/表头都 0.5pt（sz=4）
t = t.replace('''    for edge, sz in (("top", 12), ("bottom", 12)):''',
              '''    for edge, sz in (("top", 4), ("bottom", 4)):''')
t = t.replace('''                bottom.set(qn("w:sz"), "8")''',
              '''                bottom.set(qn("w:sz"), "4")''')

# 4) 单元格全部居中
t = t.replace('p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT',
              'p.alignment = WD_ALIGN_PARAGRAPH.CENTER')

io.open(p, "w", encoding="utf-8").write(t)
print("table style aligned to reference")
