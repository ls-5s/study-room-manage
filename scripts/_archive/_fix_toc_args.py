# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
old = ') % (nsdecls("w"), sid, name, left, [0, 442, 878][level - 1])'
new = ') % (nsdecls("w"), sid, name, [0, 442, 878][level - 1])'
assert old in t, "format args"
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("toc style args fixed")
