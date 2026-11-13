# -*- coding: utf-8 -*-
"""按参考改为网格表：四边与内部横竖线 0.5pt，行高自适应，列宽按内容，单元格居中，表宽满版心。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 列宽：内容比例，总宽 15.5cm
old_w = '''    cols = len(rows[0])
    widths = [14.7 / cols] * cols'''
new_w = '''    cols = len(rows[0])
    lens = []
    for c in range(cols):
        longest = max((len(r[c]) if c < len(r) else 0) for r in rows)
        lens.append(max(longest, 3) ** 0.75)
    total = sum(lens)
    widths = [max(1.4, 15.5 * v / total) for v in lens]
    scale = 15.5 / sum(widths)
    widths = [w * scale for w in widths]'''
assert old_w in t, "width block"
t = t.replace(old_w, new_w, 1)

# 2) 去掉固定行高（自适应）
old_h = '''    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        h = OxmlElement("w:trHeight")
        h.set(qn("w:val"), "450")
        h.set(qn("w:hRule"), "exact")
        trPr.append(h)
'''
assert old_h in t, "row height block"
t = t.replace(old_h, "", 1)

# 3) 边框：改为完整网格（四边 + 内部横竖线）
old_b = '''    for edge, sz in (("top", 4), ("bottom", 4)):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:color"), "000000")
        borders.append(el)
    for edge in ("left", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "none")
        borders.append(el)'''
new_b = '''    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), "000000")
        borders.append(el)'''
assert old_b in t, "borders block"
t = t.replace(old_b, new_b, 1)

# 4) 表宽满版心
t = t.replace('total_twips = int(Cm(14.71).twips)', 'total_twips = int(Cm(15.5).twips)')

# 5) 单元格行距恢复自适应（单倍），不要 12pt 固定
t = t.replace('''            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.EXACTLY
            p.paragraph_format.line_spacing = Pt(12)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)''',
'''            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)''')

io.open(p, "w", encoding="utf-8").write(t)
print("grid table applied")
