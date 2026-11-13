# -*- coding: utf-8 -*-
"""参考文献条目按参考：编号后不留空格，作者之间用全角逗号。"""
import io
import re

p = "thesis/drafts/参考文献.md"
lines = io.open(p, encoding="utf-8").read().split("\n")
out = []
changed = 0
for line in lines:
    s = line.strip()
    m = re.match(r"^\[(\d+)\]\s*(.+)$", s)
    if m:
        num, body = m.group(1), m.group(2)
        body2 = body.replace(", ", "，")
        out.append("[%s]%s" % (num, body2))
        changed += 1
    else:
        out.append(line)

io.open(p, "w", encoding="utf-8").write("\n".join(out))
print("entries adjusted:", changed)
