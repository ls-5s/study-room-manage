# -*- coding: utf-8 -*-
"""把超高图（>270pt）按高度 270 缩放，并给 4 张仍偏空的属性图补 1 句话。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# 1) 图片高度上限：18.3cm -> 9.53cm(270pt)
p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
t = t.replace("(h / w) * target > 18.3", "(h / w) * target > 9.53")
t = t.replace("target = 18.3 * w / h", "target = 9.53 * w / h")
io.open(p, "w", encoding="utf-8").write(t)

# 2) 补充四段
md = "thesis/drafts/04-系统设计.md"
s = io.open(md, encoding="utf-8").read()

extra = {
    "会话表是 JWT 的补充。": "按用户维度还能回答“当前有几台设备在线”，运营排查异常登录时不必翻查应用日志。",
    "座位的唯一性由两组索引保证：": "批量生成接口在写入前先按批次前缀检查重复，避免一次请求内编号冲突导致整批回滚。",
    "签到表以 `reservation_id` 为唯一键": "签到成功后预约状态与签到记录在同一事务内更新，任一步失败都不会留下“已签到但状态未变”的中间态。",
    "违约记录由定时任务在签到窗口截止后自动生成": "同一条预约的违约记录与状态日志在同一个事务里写入，保证“失约”这一事实在两张表中同时可见。",
}

added = 0
for anchor, tail in extra.items():
    idx = s.find(anchor)
    if idx < 0:
        print("miss:", anchor[:12])
        continue
    # 在该段末尾（下一个空行前）追加
    end = s.find("\n\n", idx)
    if end < 0:
        continue
    s = s[:end] + tail + s[end:]
    added += 1

io.open(md, "w", encoding="utf-8").write(s)
print("tail sentences added:", added)
