# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

a1 = '        run = para.add_run("\\t")\n        set_font(run, SONG, size)\n        if value:'
b1 = '        run = para.add_run("\\t\\t")\n        set_font(run, SONG, size)\n        if value:'
assert a1 in t, "a1"
t = t.replace(a1, b1, 1)

a2 = ('        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),\n'
      '        (12.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),')
b2 = ('        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),\n'
      '        (8.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),\n'
      '        (12.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),')
assert a2 in t, "a2"
t = t.replace(a2, b2, 1)

a3 = ('    ID_STOPS = [\n'
      '        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),\n'
      '        (10.0, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),\n'
      '        (12.4, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),\n'
      '        (13.8, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),\n'
      '        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.LINES),\n'
      '    ]')
b3 = ('    ID_STOPS = [\n'
      '        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),\n'
      '        (8.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),\n'
      '        (10.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),\n'
      '        (11.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),\n'
      '        (11.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),\n'
      '        (13.6, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),\n'
      '        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.LINES),\n'
      '    ]')
assert a3 in t, "a3"
t = t.replace(a3, b3, 1)

a4 = '    for txt in ("学　　号", "\\t", "233020152", "\\t", "年　　级", "\\t", "2023", "\\t"):'
b4 = '    for txt in ("学　　号", "\\t\\t", "233020152", "\\t", "年　　级", "\\t\\t", "2023", "\\t"):'
assert a4 in t, "a4"
t = t.replace(a4, b4, 1)

io.open(p, "w", encoding="utf-8").write(t)
print("patched")
