# -*- coding: utf-8 -*-
"""按参考论文样式规范化参考文献条目（幂等）。

参考样例：
[1]黄宝华，何静，谭力铭，等。智慧社区融合服务共享平台建设与应用研究 [J]. 城市勘测，2025,(S1):129-133.
[18]刘丹, 裴颖, 李闯. 智慧网格化社区协同服务平台研究[J]. 测绘通报,2015,(12):98-100.

规则：
1) 作者与题名之间用「。」
2) 文献类型 [J]/[D]/[N]/[M] 前留一个空格
3) 刊名后用「，」接年份；年份后用半角逗号接 (期)
4) 冒号、连字符、DOI 前后不留空格
5) 编号 [n] 后不留空格
"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

PATH = "thesis/drafts/参考文献.md"


def restyle(body: str) -> str:
    s = body
    # 作者 -> 题名
    s = re.sub(r"(?<=[\u4e00-\u9fa5])\s*\.\s+(?=[\u4e00-\u9fa5A-Za-z])", "。", s, count=1)
    # 句号后不留空格
    s = re.sub(r"。\s+", "。", s)
    # 类型标识：前一个空格、后接 ". "
    s = re.sub(r"\s*\[([JDNMCS])\]", r" [\1]", s)
    s = re.sub(r"\[([JDNMCS])\]\s*\.?\s*", r"[\1]. ", s)
    # 年份：刊名后全角逗号，年份后半角逗号
    s = re.sub(r"[，,]\s*((?:19|20)\d{2})\s*[，,]", r"，\1,", s)
    # (期) 前不留空格
    s = re.sub(r"\s*\(\s*([^)]*?)\s*\)", r"(\1)", s)
    # 冒号后不留空格
    s = re.sub(r":\s+", ":", s)
    # 页码连字符
    s = re.sub(r"(\d)\s*-\s*(\d)", r"\1-\2", s)
    # DOI 紧接句末点
    s = re.sub(r"\.\s*DOI", ".DOI", s)
    # 句末补点
    s = s.rstrip()
    if not s.endswith("."):
        s += "."
    # 多余空格
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s


lines = io.open(PATH, encoding="utf-8").read().split("\n")
out, changed = [], 0
for line in lines:
    m = re.match(r"^\[(\d+)\](.+)$", line.strip())
    if not m:
        out.append(line)
        continue
    num, body = m.group(1), m.group(2)
    new = restyle(body)
    if new != body:
        changed += 1
    out.append("[%s]%s" % (num, new))

io.open(PATH, "w", encoding="utf-8").write("\n".join(out))
print("entries changed:", changed)

# 抽样校验
for line in out:
    if line.startswith("["):
        print(line[:96])
        if line.startswith("[3]"):
            break
