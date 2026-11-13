# -*- coding: utf-8 -*-
"""封面：补单元格边距、加宽标签/值列、调整标题与底部间距。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 单元格边距 0.5mm
old = '''        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))'''
new = '''        mar = tblPr.find(qn("w:tblCellMar"))
        if mar is None:
            mar = OxmlElement("w:tblCellMar")
            tblPr.append(mar)
        for side, val in (("top", "0"), ("bottom", "0"), ("left", "28"), ("right", "28")):
            el = mar.find(qn("w:" + side))
            if el is None:
                el = OxmlElement("w:" + side)
                mar.append(el)
            el.set(qn("w:w"), val)
            el.set(qn("w:type"), "dxa")
        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for col, w in zip(grid.findall(qn("w:gridCol")), widths):
                col.set(qn("w:w"), str(int(w.twips)))'''
assert old in t, "fix_layout grid"
t = t.replace(old, new, 1)

t = t.replace('W_LABEL, W_VALUE = Cm(2.2), Cm(7.0)', 'W_LABEL, W_VALUE = Cm(2.4), Cm(6.8)')
t = t.replace('widths = [Cm(2.2), Cm(2.2), Cm(1.3), Cm(3.5)]', 'widths = [Cm(2.4), Cm(2.6), Cm(1.3), Cm(2.9)]')

t = t.replace('p.paragraph_format.space_after = Pt(28)\n    run = p.add_run("成都锦城学院")',
              'p.paragraph_format.space_after = Pt(32)\n    run = p.add_run("成都锦城学院")')
t = t.replace('p.paragraph_format.space_after = Pt(40)\n    run = p.add_run("本科生毕业论文（设计）")',
              'p.paragraph_format.space_after = Pt(50)\n    run = p.add_run("本科生毕业论文（设计）")')
t = t.replace('    p.paragraph_format.space_before = Pt(58)\n', '    p.paragraph_format.space_before = Pt(77)\n', 1)

io.open(p, "w", encoding="utf-8").write(t)
print("cover metrics adjusted")
