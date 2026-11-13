# -*- coding: utf-8 -*-
"""页码范围使用不换行连字符，避免 "29-/32" 跨行断开。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

PATH = "thesis/drafts/参考文献.md"
t = io.open(PATH, encoding="utf-8").read()

NBH = "\u2011"
count = 0


def fix(m):
    global count
    count += 1
    return "%s%s%s." % (m.group(1), NBH, m.group(2))


t = re.sub(r"(\d+)-(\d+)\.", fix, t)
io.open(PATH, "w", encoding="utf-8").write(t)
print("page ranges converted:", count)
