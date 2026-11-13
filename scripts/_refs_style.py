# -*- coding: utf-8 -*-
"""参考文献条目按参考标点风格：作者后“。”、[J] 前空格、年卷期页码内不留空格。"""
import io
import re

p = "thesis/drafts/参考文献.md"
lines = io.open(p, encoding="utf-8").read().split("\n")

out = []
changed = 0
for line in lines:
    s = line.strip()
    m = re.match(r"^\[(\d+)\](.+)$", s)
    if not m:
        out.append(line)
        continue
    num, body = m.group(1), m.group(2)

    # 作者与题名之间：第一个 ". " -> "。 "
    body = re.sub(r"(?<![A-Za-z])\.\s+(?=[^\]\s])", "。 ", body, count=1)
    # [J] 前保留一个空格
    body = re.sub(r"\s*\[J\]", " [J]", body)
    # 年、卷、期、页码内不留空格
    body = re.sub(r"，\s*(\d{4})", r"，\1", body)
    body = re.sub(r"(\d{4})\s*,\s*", r"\1,", body)
    body = re.sub(r":\s+(\d)", r":\1", body)
    body = re.sub(r"\(\s*", "(", body)
    body = re.sub(r"\s*\)", ")", body)

    out.append("[%s]%s" % (num, body))
    changed += 1

io.open(p, "w", encoding="utf-8").write("\n".join(out))
print("entries restyled:", changed)
