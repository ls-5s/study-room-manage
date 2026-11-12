# -*- coding: utf-8 -*-
"""add_inline 支持行内代码：去掉反引号，按正文/西文字体输出。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old = '    tokens = re.split(r"(<sup>.*?</sup>|\\*\\*.*?\\*\\*)", text)'
new = '    tokens = re.split(r"(<sup>.*?</sup>|\\*\\*.*?\\*\\*|`[^`]*`)", text)'
assert old in t, "token split"
t = t.replace(old, new, 1)

old2 = '''        elif tok.startswith("**") and tok.endswith("**")'''
new2 = '''        elif tok.startswith("`") and tok.endswith("`") and len(tok) > 2:
            run = paragraph.add_run(tok[1:-1])
            set_font(run, font, size)
        elif tok.startswith("**") and tok.endswith("**")'''
assert old2 in t, "bold branch"
t = t.replace(old2, new2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("inline code handled")
