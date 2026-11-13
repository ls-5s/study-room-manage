# -*- coding: utf-8 -*-
"""按正文首次引用顺序重排参考文献编号（GB/T 7714 顺序编码制）。"""
import io
import re

ORDER = ["00-摘要.md", "01-绪论.md", "02-关键技术.md", "03-需求分析.md",
         "04-系统设计.md", "05-详细设计与实现-1.md", "05-详细设计与实现-2.md",
         "06-系统测试.md", "07-结束语.md"]

texts = {name: io.open("thesis/drafts/" + name, encoding="utf-8").read() for name in ORDER}

# 1) 统计首次出现顺序
seq = []
for name in ORDER:
    for m in re.finditer(r"<sup>(.*?)</sup>", texts[name]):
        for num in re.findall(r"\[(\d+)\]", m.group(1)):
            n = int(num)
            if n not in seq:
                seq.append(n)

mapping = {old: i + 1 for i, old in enumerate(seq)}
print("首次引用顺序(old):", seq)

# 2) 改写正文
for name in ORDER:
    t = texts[name]

    def fix(m):
        nums = [int(x) for x in re.findall(r"\[(\d+)\]", m.group(1))]
        return "<sup>" + "".join("[%d]" % mapping[n] for n in nums) + "</sup>"

    texts[name] = re.sub(r"<sup>(.*?)</sup>", fix, t)
    io.open("thesis/drafts/" + name, "w", encoding="utf-8").write(texts[name])

# 3) 重排参考文献
p = "thesis/drafts/参考文献.md"
raw = io.open(p, encoding="utf-8").read().split("\n")
entries = {}
for line in raw:
    m = re.match(r"^\[(\d+)\] (.*)$", line)
    if m:
        entries[int(m.group(1))] = m.group(2)

ordered = []
for old in seq:
    ordered.append("[%d] %s" % (mapping[old], entries[old]))
# 未被引用的条目（若有）追加在末尾
for old in sorted(entries):
    if old not in mapping:
        ordered.append("[--] " + entries[old])

io.open(p, "w", encoding="utf-8").write("# 参考文献\n\n" + "\n\n".join(ordered) + "\n")
print("renumbered by first appearance, entries:", len(ordered))
