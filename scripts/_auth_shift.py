# -*- coding: utf-8 -*-
"""授权书标题下移 48pt（参考 168.2，本稿 120.3）。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
old = '''    p.paragraph_format.space_before = Pt(84)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")'''
new = '''    p.paragraph_format.space_before = Pt(132)
    p.paragraph_format.space_after = Pt(14)
    run = p.add_run("成都锦城学院")'''
assert old in t, "auth title"
t = t.replace(old, new, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("authorization title shifted")
