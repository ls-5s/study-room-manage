# -*- coding: utf-8 -*-
"""ER 整体图：主键属性加下划线；基数标注贴近实体端。"""
import io

p = "scripts/render_diagrams.py"
t = io.open(p, encoding="utf-8").read()

old = '''            sx, sy = box_edge(e["x"], e["y"], EW, EH, ax, ay)
            d.line([sx, sy, ax, ay], fill=LINE, width=2)
            ellipse(d, ax, ay, AW, AH, name, size=22)'''
new = '''            is_key = name.endswith("*")
            name = name.rstrip("*")
            sx, sy = box_edge(e["x"], e["y"], EW, EH, ax, ay)
            d.line([sx, sy, ax, ay], fill=LINE, width=2)
            ellipse(d, ax, ay, AW, AH, name, size=22)
            if is_key:
                f22 = font(22)
                tw = d.textlength(name, font=f22)
                uy = ay + 16
                d.line([ax - tw / 2, uy, ax + tw / 2, uy], fill=LINE, width=2)'''
assert old in t, "attr draw"
t = t.replace(old, new, 1)

old2 = '''            mx = (sx + ex) / 2 + perx * 20
            my = (sy + ey) / 2 + pery * 20'''
new2 = '''            tx = ex + (sx - ex) * 0.72
            ty = ey + (sy - ey) * 0.72
            mx = tx + perx * 8
            my = ty + pery * 8'''
assert old2 in t, "cardinality pos"
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("renderer patched")
