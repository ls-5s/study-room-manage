# -*- coding: utf-8 -*-
"""章标题改为参考格式“1  绪论”，并微调摘要与目录间距。"""
import io
import glob
import re

# 1) 改章标题
for path in glob.glob("thesis/drafts/0[1-7]*.md"):
    t = io.open(path, encoding="utf-8").read()
    new = re.sub(r"^# 第 (\d+) 章 (.+)$", lambda m: "# %s  %s" % (m.group(1), m.group(2)),
                 t, flags=re.M)
    if new != t:
        io.open(path, "w", encoding="utf-8").write(new)
        print("renamed:", path)

# 2) 摘要间距 +5/+4/+4，目录标题下移 3、条目起点下移 9
p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace("Pt(14 if tight else 24)", "Pt(14 if tight else 29)")
t = t.replace("Pt(12 if tight else 18)", "Pt(12 if tight else 22)")

io.open(p, "w", encoding="utf-8").write(t)
print("abstract gaps widened")
