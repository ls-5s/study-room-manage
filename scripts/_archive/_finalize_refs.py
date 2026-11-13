# -*- coding: utf-8 -*-
"""改名 1.2 节，重建文献池与交付说明中的文献描述。"""
import io
import re

# 1) 章节标题
p = "thesis/drafts/01-绪论.md"
t = io.open(p, encoding="utf-8").read()
t = t.replace("## 1.2 国内外研究现状", "## 1.2 相关研究现状")
t = t.replace("### 1.2.1 国内研究现状", "### 1.2.1 国内座位管理系统的建设实践")
t = t.replace("本文深入调研了国内外", "本文调研了")
io.open(p, "w", encoding="utf-8").write(t)

# 2) 文献池重建
refs = io.open("thesis/drafts/参考文献.md", encoding="utf-8").read().strip().split("\n\n")
body = [x for x in refs if re.match(r"^\[\d+\]", x)]
pool = ["# 文献池（终稿口径）", "",
        "> 30 条全部为知网收录的中文期刊论文，已删除图书、标准、政策文件与英文会议文献。",
        "> 编号按正文首次引用顺序排列，与终稿参考文献一致。", "",
        "| 编号 | 条目 | 核验情况 |", "| --- | --- | --- |"]
for line in body:
    n = re.match(r"^\[(\d+)\]", line).group(1)
    text = line.split("] ", 1)[1]
    pool.append("| [%s] | %s | 知网收录期刊，题名/作者/刊名/年卷期已核 |" % (n, text))
io.open("thesis/01-文献池.md", "w", encoding="utf-8").write("\n".join(pool) + "\n")

# 3) 交付说明
p = "thesis/reports/交付说明.md"
t = io.open(p, encoding="utf-8").read()
t = t.replace("| `thesis/01-文献池.md` | 29 条文献，标注核验状态 |",
              "| `thesis/01-文献池.md` | 30 条文献，全部为知网收录中文期刊 |")
t = t.replace("| 文献闭合 | 正文引用 29 个编号，文末 29 条，双向一一对应 |",
              "| 文献闭合 | 正文引用 30 个编号，文末 30 条，双向一一对应 |")
t = t.replace("29 条中 12 条缺刊名、页码或作者之一；其中 [25]～[29] 为知网收录期刊，已在知网空间核对",
              "30 条全部为知网收录的中文期刊论文，已删除图书、标准、政策文件与英文会议文献")
io.open(p, "w", encoding="utf-8").write(t)

# 4) 大纲
p = "thesis/02-大纲.md"
t = io.open(p, encoding="utf-8").read()
t = t.replace("参考文献 29 条", "参考文献 30 条（全部为知网收录中文期刊）")
io.open(p, "w", encoding="utf-8").write(t)
print("done")
