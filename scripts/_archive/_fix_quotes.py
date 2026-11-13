# -*- coding: utf-8 -*-
"""把正文里的英文直引号成对替换为中文引号，跳过代码块与表格。"""
import io
import glob
import re

FILES = [f for f in glob.glob("thesis/drafts/0*.md") if "参考文献" not in f]

total = 0
for path in FILES:
    lines = io.open(path, encoding="utf-8").read().split("\n")
    in_code = False
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith("```"):
            in_code = not in_code
            out.append(line)
            continue
        if in_code or s.startswith("|") or s.startswith("#"):
            out.append(line)
            continue
        new, n = re.subn(r'"([^"\n]{1,80})"', "\u201c\\1\u201d", line)
        total += n
        out.append(new)
    io.open(path, "w", encoding="utf-8").write("\n".join(out))

print("replaced pairs:", total)
