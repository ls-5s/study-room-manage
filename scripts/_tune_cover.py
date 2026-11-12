# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
pairs = [
    ('p.paragraph_format.space_after = Pt(10)\n    run = p.add_run("成都锦城学院")',
     'p.paragraph_format.space_after = Pt(22)\n    run = p.add_run("成都锦城学院")'),
    ('p.paragraph_format.space_before = Pt(60)', 'p.paragraph_format.space_before = Pt(48)'),
    ("VALUE_SIZE = 15", "VALUE_SIZE = 14.5"),
    ("W_LABEL, W_VALUE = Cm(3.9), Cm(9.9)", "W_LABEL, W_VALUE = Cm(3.6), Cm(10.2)"),
    ("table.rows[i].height = Cm(1.62)", "table.rows[i].height = Cm(1.52)"),
    ("table.rows[0].height = Cm(1.62)", "table.rows[0].height = Cm(1.52)"),
    ('cols = [("学　　号", True, Cm(3.0)), ("233020152", False, Cm(4.4)),\n            ("年　　级", True, Cm(2.8)), ("2023", False, Cm(3.6))]',
     'cols = [("学　　号", True, Cm(3.6)), ("233020152", False, Cm(4.4)),\n            ("年　　级", True, Cm(2.6)), ("2023", False, Cm(3.2))]'),
    ("p.paragraph_format.space_before = Pt(96)", "p.paragraph_format.space_before = Pt(108)"),
]
for a, b in pairs:
    if a not in t:
        print("miss:", a[:40])
    t = t.replace(a, b)
io.open(p, "w", encoding="utf-8").write(t)
print("tuned")
