# -*- coding: utf-8 -*-
"""补齐制表位：值前也要有前导下划线。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

old_stops = '''    STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (12.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.LINES),
    ]'''
new_stops = '''    STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (8.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (12.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.LINES),
    ]'''
assert old_stops in t
t = t.replace(old_stops, new_stops)

old_runs = '''        run = para.add_run("\\\\t")
        set_font(run, SONG, size)
        if value:
            run = para.add_run(value)
            set_font(run, SONG, size)
        run = para.add_run("\\\\t")
        set_font(run, SONG, size)
        return para'''
new_runs = '''        run = para.add_run("\\\\t\\\\t")
        set_font(run, SONG, size)
        if value:
            run = para.add_run(value)
            set_font(run, SONG, size)
        run = para.add_run("\\\\t")
        set_font(run, SONG, size)
        return para'''
assert old_runs in t, "runs block not found"
t = t.replace(old_runs, new_runs)

old_id = '''    ID_STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (10.0, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),
        (12.4, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (13.8, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.LINES),
    ]'''
new_id = '''    ID_STOPS = [
        (8.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (8.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (10.3, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),
        (11.6, WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES),
        (11.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.SPACES),
        (13.6, WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.LINES),
        (15.9, WD_TAB_ALIGNMENT.LEFT, WD_TAB_LEADER.LINES),
    ]'''
assert old_id in t
t = t.replace(old_id, new_id)

old_txt = '''    for txt in ("学　　号", "\\\\t", "233020152", "\\\\t", "年　　级", "\\\\t", "2023", "\\\\t"):'''
new_txt = '''    for txt in ("学　　号", "\\\\t\\\\t", "233020152", "\\\\t", "年　　级", "\\\\t\\\\t", "2023", "\\\\t"):'''
assert old_txt in t, "id text block not found"
t = t.replace(old_txt, new_txt)

io.open(p, "w", encoding="utf-8").write(t)
print("tab leaders completed")
