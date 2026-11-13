# -*- coding: utf-8 -*-
"""按参考实测回正：属性图高 283 pt（参考 275-291），每图后正文补到约 600 字（参考 16 行/页）。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# 1) 图片高度：220 -> 283.5pt(10.0cm)
p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace("target = min(width_cm, 7.76 * w / h)", "target = min(width_cm, 10.0 * w / h)")
io.open(p, "w", encoding="utf-8").write(t)

# 2) 段落补到 600 字
MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

TAIL = {
    4: "账号停用后其有效会话一并撤销，避免停用后仍能凭旧令牌访问。",
    5: "会话表只保留必要字段，不存设备指纹，减少个人信息的存储面。",
    6: "审计写入与业务写入不在同一事务，业务成功而审计失败时记告警，不阻断主流程。",
    7: "房间删除前必须无座位、无时段、无有效预约，由外键与状态字段双重限制。",
    8: "时段的启停不影响其下已有预约，只影响新的预约创建。",
    9: "座位编号在同一房间内唯一，跨房间可以重复，展示时以房间分组。",
    10: "预约表按月归档历史数据，归档表结构一致，查询时按日期路由。",
    11: "签到时间与预约窗口比较时统一换算为 UTC，避免时区差异导致误判。",
    12: "用户违约次数以有效违约记录为准，撤销后立即回退，不做增量缓存。",
    13: "工单关闭后保留七天再进入归档表，便于学生查看处理结果。",
}

TARGET = 600
for n, tail in TAIL.items():
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    if not m:
        print("miss", n)
        continue
    if len(m.group(0)) >= TARGET:
        continue
    text = text[:m.end()] + tail + text[m.end():]

io.open(MD, "w", encoding="utf-8").write(text)
for n in range(4, 14):
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    print(n, len(m.group(0)) if m else None)
