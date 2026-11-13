# -*- coding: utf-8 -*-
import io

p = "scripts/build_specs.py"
t = io.open(p, encoding="utf-8").read()
pairs = [
    ('"fig4-5.png", "自习室、时段与座位局部 E-R 图"', '"fig4-15.png", "自习室、时段与座位局部 E-R 图"'),
    ('"fig4-6.png", "预约、签到与状态日志局部 E-R 图"', '"fig4-16.png", "预约、签到与状态日志局部 E-R 图"'),
    ('"fig4-7.png", "违约与反馈局部 E-R 图"', '"fig4-17.png", "违约与反馈局部 E-R 图"'),
    ('"fig4-8.png", "统计快照局部 E-R 图"', '"fig4-18.png", "统计快照局部 E-R 图"'),
]
for a, b in pairs:
    if a not in t:
        print("miss:", a)
    t = t.replace(a, b)
io.open(p, "w", encoding="utf-8").write(t)
print("renamed")
