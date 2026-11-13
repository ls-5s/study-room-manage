# -*- coding: utf-8 -*-
"""修复上次插入截图时误替换 alt 文本导致的 8 处图片语法损坏。"""
import io

CASES = [
    ("05-详细设计与实现-1.md", "图 5-2 学生登录页面", "图 5-3 学生注册页面", "04-login.png"),
    ("05-详细设计与实现-1.md", "图 5-5 学生选座页面", "图 5-6 学生首页", "09-seat-select.png"),
    ("05-详细设计与实现-1.md", "图 5-12 取消预约确认弹窗", "图 5-13 我的预约列表", "13-cancel-dialog.png"),
    ("05-详细设计与实现-2.md", "图 5-17 管理端仪表盘", "图 5-18 统计报表页面", "20-dashboard.png"),
    ("05-详细设计与实现-2.md", "图 5-20 座位管理页面", "图 5-21 开放时段配置页面", "29-seat-admin.png"),
    ("05-详细设计与实现-2.md", "图 5-23 预约管理页面", "图 5-24 预约详情与状态时间线", "32-admin-reservations.png"),
    ("05-详细设计与实现-2.md", "图 5-28 工单详情页面", "图 5-29 工单处理结果", "36-feedback-detail.png"),
    ("05-详细设计与实现-2.md", "图 5-31 系统设置页面", "图 5-32 系统运行状态", "39-system-settings.png"),
]

for name, old_cap, new_cap, old_file in CASES:
    p = "thesis/drafts/" + name
    t = io.open(p, encoding="utf-8").read()

    broken = "![" + old_cap + "\n"
    if broken in t:
        t = t.replace(broken, "![" + old_cap + "](../figures/screenshots/" + old_file + ")\n", 1)
    else:
        print("broken not found:", old_cap)

    stray = new_cap + "](../figures/screenshots/" + old_file + ")"
    if stray in t:
        t = t.replace(stray, new_cap, 1)
    else:
        print("stray not found:", new_cap)

    io.open(p, "w", encoding="utf-8").write(t)

print("repaired")
