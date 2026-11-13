# -*- coding: utf-8 -*-
"""删除无来源的 [23]，其后编号整体前移一位，并同步正文引用。"""
import io
import glob
import re

DEL = 23


def remap(n):
    if n == DEL:
        return None
    return n - 1 if n > DEL else n


# 1) 正文引用
for path in glob.glob("thesis/drafts/0*.md") + ["thesis/drafts/参考文献.md"]:
    t = io.open(path, encoding="utf-8").read()

    def fix_sup(m):
        nums = [int(x) for x in re.findall(r"\[(\d+)\]", m.group(1))]
        out = [str(remap(n)) for n in nums if remap(n) is not None]
        if not out:
            return ""
        return "<sup>" + "".join("[%s]" % x for x in out) + "</sup>"

    t = re.sub(r"<sup>(.*?)</sup>", fix_sup, t)
    io.open(path, "w", encoding="utf-8").write(t)

# 2) 参考文献条目
p = "thesis/drafts/参考文献.md"
lines = io.open(p, encoding="utf-8").read().split("\n")
out = []
for line in lines:
    m = re.match(r"^\[(\d+)\] ", line)
    if m:
        n = int(m.group(1))
        if n == DEL:
            continue
        new = remap(n)
        line = re.sub(r"^\[\d+\] ", "[%d] " % new, line)
    out.append(line)
io.open(p, "w", encoding="utf-8").write("\n".join(out))
print("references renumbered")

# 3) 文献池与交付说明中的编号与计数
pool = io.open("thesis/01-文献池.md", encoding="utf-8").read()
pool = pool.replace("[26]～[30]", "[25]～[29]")
io.open("thesis/01-文献池.md", "w", encoding="utf-8").write(pool)

note = io.open("thesis/reports/交付说明.md", encoding="utf-8").read()
note = note.replace("30 条中 13 条缺刊名、页码或作者之一；其中 [26]～[30] 为知网收录期刊，已在知网空间核对",
                    "29 条中 12 条缺刊名、页码或作者之一；其中 [25]～[29] 为知网收录期刊，已在知网空间核对")
note = note.replace("| 文献闭合 | 正文引用 30 个编号，文末 30 条，双向一一对应 |",
                    "| 文献闭合 | 正文引用 29 个编号，文末 29 条，双向一一对应 |")
note = note.replace("| `thesis/01-文献池.md` | 30 条文献，标注核验状态 |",
                    "| `thesis/01-文献池.md` | 29 条文献，标注核验状态 |")
io.open("thesis/reports/交付说明.md", "w", encoding="utf-8").write(note)

outline = io.open("thesis/02-大纲.md", encoding="utf-8").read().replace("参考文献 30 条", "参考文献 29 条")
io.open("thesis/02-大纲.md", "w", encoding="utf-8").write(outline)
print("docs updated")
