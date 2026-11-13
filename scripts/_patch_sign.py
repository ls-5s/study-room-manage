# -*- coding: utf-8 -*-
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

a = 'add_inline(p, "作者签名：____________        指导教师签名：____________", size=14)'
b = 'add_inline(p, "作者签名：____________        指导教师签名：____________", size=14, font="等线")'
c = 'add_inline(p, "日期：    年  月  日            日期：    年  月  日", size=14)'
d = 'add_inline(p, "日期：    年  月  日            日期：    年  月  日", size=14, font="等线")'

for old, new in ((a, b), (c, d)):
    if old in t:
        t = t.replace(old, new)
    else:
        print("miss:", old[:20])

io.open(p, "w", encoding="utf-8").write(t)
print("done")
