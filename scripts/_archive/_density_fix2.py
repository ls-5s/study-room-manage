# -*- coding: utf-8 -*-
"""给 5 张仍偏空的属性图段落各补 1 句（约 60-80 字）。"""
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

md = "thesis/drafts/04-系统设计.md"
s = io.open(md, encoding="utf-8").read()

pairs = [
    ("自习室是资源层的根。", "房间的位置字段用于列表展示与筛选，与快照中的位置一起保证历史预约可读。"),
    ("时段表达的是一天内的可用区间。", "时段名称允许重复，唯一性由房间与起止时间共同约束，避免误建同义时段。"),
    ("座位的唯一性由两组索引保证：", "座位编号支持字母数字组合，前缀用于区分楼层或区域，前端按前缀分组展示。"),
    ("签到表以 `reservation_id` 为唯一键", "业务日期与预约日期必须一致，由服务端校验，避免跨天签到被计入错误的一天。"),
    ("违约记录由定时任务在签到窗口截止后自动生成", "违约类型目前不区分严重程度，阈值判断只看有效条数，规则简单也便于解释。"),
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
print("sentences added:", added)
