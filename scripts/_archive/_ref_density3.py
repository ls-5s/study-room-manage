# -*- coding: utf-8 -*-
"""把剩余不足 590 字的实体段补齐，目标统一 16 行/页（参考值）。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

TAIL = {
    5: "会话记录与令牌一一对应，令牌泄露时只需撤销该条会话，不影响其他设备。",
    7: "房间列表按状态与名称排序，停用房间排在最后，学生端默认过滤停用项。",
    8: "时段被停用后仍保留在历史预约详情中，学生看到的是当时的时段名称与起止时间。",
    9: "座位维修由管理员登记开始与结束时间，维修期间该座位不参与可用性计算。",
    11: "签到记录的唯一性也阻止同一预约被两个人分别签到，争议时以签到时间为准。",
    12: "违约记录不提供删除接口，撤销是唯一处理方式，保证统计口径稳定。",
    13: "工单处理结果写入后不可覆盖，如需补充由管理员追加说明，保持对话式记录。",
}

TARGET = 590
for n, tail in TAIL.items():
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    if not m or len(m.group(0)) >= TARGET:
        continue
    text = text[:m.end()] + tail + text[m.end():]

io.open(MD, "w", encoding="utf-8").write(text)
print("done")
