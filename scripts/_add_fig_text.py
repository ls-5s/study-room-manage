# -*- coding: utf-8 -*-
"""在实体属性图与局部 E-R 图的题注后补一句说明，使每图配文（与参考版式一致）。"""
import io
import re

p = "thesis/drafts/04-系统设计.md"
lines = io.open(p, encoding="utf-8").read().split("\n")

out = []
for line in lines:
    out.append(line)
    m = re.match(r"^图 4-(\d+) (.+)$", line.strip())
    if not m:
        continue
    num, name = int(m.group(1)), m.group(2).strip()
    if 4 <= num <= 13:
        entity = name.replace("实体属性图", "")
        out.append("")
        out.append("%s 的属性如图 4-%d 所示，图中同时标注主键与业务字段，字段含义与后文数据表一致；"
                   "属性之间不设独立联系，实体间的关系由整体 E-R 图给出。" % (entity, num))
    elif 14 <= num <= 18:
        out.append("")
        out.append("图 4-%d 只保留与本节相关的实体与联系，联系类型与参与实体在图中标出；"
                   "完整关系见前面的整体 E-R 图。" % num)

io.open(p, "w", encoding="utf-8").write("\n".join(out))
print("inserted explanatory paragraphs:", sum(1 for l in out if l.startswith("图 4-")) )
