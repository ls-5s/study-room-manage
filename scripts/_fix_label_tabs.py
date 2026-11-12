# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

a = ('        if label:\n'
     '            run = para.add_run(label)\n'
     '            set_font(run, SONG, size)\n'
     '        run = para.add_run("\\t\\t")\n'
     '        set_font(run, SONG, size)\n')
b = ('        run = para.add_run("\\t")\n'
     '        set_font(run, SONG, size)\n'
     '        if label:\n'
     '            run = para.add_run(label)\n'
     '            set_font(run, SONG, size)\n'
     '        run = para.add_run("\\t")\n'
     '        set_font(run, SONG, size)\n')
assert a in t, "field_para block"
t = t.replace(a, b, 1)

a2 = '    seg("学　　号")\n    seg("\\t\\t")\n'
b2 = '    seg("\\t")\n    seg("学　　号")\n    seg("\\t")\n'
assert a2 in t, "id label block"
t = t.replace(a2, b2, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("label tabs fixed")
