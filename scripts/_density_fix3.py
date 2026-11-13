# -*- coding: utf-8 -*-
"""最后 3 段各补半句，使 ER 图页正文 ≥12 行。"""
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

md = "thesis/drafts/04-系统设计.md"
s = io.open(md, encoding="utf-8").read()

pairs = [
    ("自习室是资源层的根。", "停用房间不再出现在学生端列表，但管理员仍可在后台查看其历史预约与统计。"),
    ("签到表以 `reservation_id` 为唯一键", "重复扫码时接口返回已签到而不是报错，前端据此直接跳转预约详情。"),
    ("违约记录由定时任务在签到窗口截止后自动生成", "同一用户当天的多条违约按条累计，达到阈值后由定时任务写入限制期。"),
]

added = 0
for anchor, tail in pairs:
    idx = s.find(anchor)
    if idx < 0:
        print("miss:", anchor[:12])
        continue
    end = s.find("\n\n", idx)
    if end < 0:
        continue
    s = s[:end] + tail + s[end:]
    added += 1

io.open(md, "w", encoding="utf-8").write(s)
print("added:", added)
