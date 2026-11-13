# -*- coding: utf-8 -*-
"""删除重复的旧解释段，并把“X 实体的属性如图 4-N 所示。”并入新段开头。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

entities = ["用户", "会话", "审计日志", "自习室", "开放时段", "座位", "预约", "签到", "违约记录", "反馈工单"]
nums = {"用户": 4, "会话": 5, "审计日志": 6, "自习室": 7, "开放时段": 8,
        "座位": 9, "预约": 10, "签到": 11, "违约记录": 12, "反馈工单": 13}

removed = 0
for name in entities:
    n = nums[name]
    lead = "%s实体的属性如图 4-%d 所示。" % (name, n)
    # 找到旧段（以 lead 开头的一整段）
    pat = re.compile(r"^" + re.escape(lead) + r".*?(?=\n\n)", re.S | re.M)
    m = pat.search(text)
    if not m:
        print("old para not found:", name)
        continue
    text = text[:m.start()] + text[m.end():]
    removed += 1
    # 新段开头补 lead（新段现在紧跟其后）
    pos = m.start()
    # 跳过空行
    while text[pos:pos + 1] == "\n":
        pos += 1
    text = text[:pos] + lead + text[pos:]

io.open(MD, "w", encoding="utf-8").write(text)
print("old paragraphs removed:", removed)
