# -*- coding: utf-8 -*-
import io
import re

MAP = {1: 1, 3: 4, 5: 7, 7: 9, 9: 11, 11: 14, 13: 16, 15: 19, 17: 22, 19: 25, 21: 27, 23: 30}
p = "scripts/build_specs.py"
t = io.open(p, encoding="utf-8").read()
t = re.sub(r'"fig5-(\d+)\.png"', lambda m: '"fig5-%d.png"' % MAP[int(m.group(1))], t)
io.open(p, "w", encoding="utf-8").write(t)
print("renamed")
print(sorted(set(re.findall(r'fig5-\d+\.png', t))))
