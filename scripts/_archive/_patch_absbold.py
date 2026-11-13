# -*- coding: utf-8 -*-
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
old = 'add_inline(para, txt, size=18, font=("Times New Roman" if tight else HEI))'
new = 'add_inline(para, txt, size=18, bold=tight, font=("Times New Roman" if tight else HEI))'
print("found:", old in t)
t = t.replace(old, new)
io.open(p, "w", encoding="utf-8").write(t)
print("patched")
