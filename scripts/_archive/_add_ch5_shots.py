# -*- coding: utf-8 -*-
"""第 5 章补 8 张截图：先把图号重排到 5-1～5-32，再插入新图。"""
import io
import os
import re
import shutil

MAP = {
    1: 1, 2: 2,
    3: 4, 4: 5,
    5: 7, 6: 8,
    7: 9, 8: 10,
    9: 11, 10: 12,
    11: 14, 12: 15,
    13: 16, 14: 17,
    15: 19, 16: 20,
    17: 22, 18: 23,
    19: 25, 20: 26,
    21: 27, 22: 28,
    23: 30, 24: 31,
}

FILES = ["thesis/drafts/05-详细设计与实现-1.md", "thesis/drafts/05-详细设计与实现-2.md"]

for p in FILES:
    t = io.open(p, encoding="utf-8").read()
    t = re.sub(r"fig5-(\d+)(?!\d)", lambda m: f"fig5-{MAP[int(m.group(1))]}", t)
    t = re.sub(r"图 5-(\d+)(?!\d)", lambda m: f"图 5-{MAP[int(m.group(1))]}", t)
    io.open(p, "w", encoding="utf-8").write(t)
print("renumbered")

SRC = "docs/assets/user-guide"
DST = "thesis/figures/screenshots"
for f in ["05-register.png", "01-public-home.png", "12-my-reservations.png",
          "37-reports.png", "27-time-slots.png", "66-admin-reservation-detail.png",
          "45-feedback-resolved.png", "38-system-status.png"]:
    shutil.copyfile(os.path.join(SRC, f), os.path.join(DST, f))

INSERTS = {
    "thesis/drafts/05-详细设计与实现-1.md": [
        ("图 5-2 学生登录页面",
         "注册页如图 5-3 所示。页面要求填写学号、用户名、显示名称与两次密码，学号与用户名在失焦时即校验唯一性，重复时在输入框下方提示。注册成功后自动跳转登录页，不直接进入系统，避免注册即登录带来的会话歧义。",
         "图 5-3 学生注册页面", "05-register.png"),
        ("图 5-5 学生选座页面",
         "首页如图 5-6 所示。页面按卡片列出可预约的自习室，展示名称、位置、开放状态与当日可用座位数；顶部为日期与时间范围筛选，切换后卡片上的可用数随之刷新。",
         "图 5-6 学生首页", "01-public-home.png"),
        ("图 5-12 取消预约确认弹窗",
         "我的预约列表如图 5-13 所示。列表按状态分为待签到、已签到、已完成、已取消、已失约五类，支持按状态筛选；每条记录显示自习室、座位、日期时段与操作入口，待签到的记录提供签到与取消两个按钮。",
         "图 5-13 我的预约列表", "12-my-reservations.png"),
    ],
    "thesis/drafts/05-详细设计与实现-2.md": [
        ("图 5-17 管理端仪表盘",
         "统计报表页如图 5-18 所示。页面上方为日期范围与自习室筛选，中部为与仪表盘一致的趋势图，下方为分时段明细表，列出自习室、时段、预约数、签到数、失约数与利用率，右下角提供 CSV 导出按钮。",
         "图 5-18 统计报表页面", "37-reports.png"),
        ("图 5-20 座位管理页面",
         "时段配置页如图 5-21 所示。页面列出自习室下的全部时段，显示名称、起止时间与状态，可新增时段、启用或停用；新增时校验开始早于结束、长度在 30 分钟到 4 小时之间、与同时段不重叠。",
         "图 5-21 开放时段配置页面", "27-time-slots.png"),
        ("图 5-23 预约管理页面",
         "预约详情页如图 5-24 所示。页面左侧为预约信息与资源快照，右侧为状态时间线，按时间顺序列出每次状态变更的操作人、时间与原因；底部提供人工签到与取消两个操作入口。",
         "图 5-24 预约详情与状态时间线", "66-admin-reservation-detail.png"),
        ("图 5-28 工单详情页面",
         "处理完成后的工单如图 5-29 所示。状态标签变为已解决，处理结果、处理人与处理时间显示在信息区，学生在学生端可看到同一份结果与时间。",
         "图 5-29 工单处理结果", "45-feedback-resolved.png"),
        ("图 5-31 系统设置页面",
         "运行状态区如图 5-32 所示。页面展示服务与数据库连通性、各定时任务最近一次运行时间与待处理数量，异常项以警示色标出；下方为审计日志入口，可按时间与操作人筛选。",
         "图 5-32 系统运行状态", "38-system-status.png"),
    ],
}

for p, items in INSERTS.items():
    t = io.open(p, encoding="utf-8").read()
    for anchor, lead, caption, img in items:
        if anchor not in t:
            print("anchor miss:", anchor)
            continue
        block = (f"\n\n{lead}\n\n![{caption}](../figures/screenshots/{img})\n\n{caption}")
        t = t.replace(anchor, anchor + block, 1)
    io.open(p, "w", encoding="utf-8").write(t)
print("inserted")
