# -*- coding: utf-8 -*-
"""按参考 16 行/页的目标，把不足 590 字的实体段补齐。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

TAIL = {
    4: "用户创建时由服务端校验学号格式与唯一性，重复注册直接返回冲突，不进入后续流程。",
    5: "会话过期时间与令牌一致，刷新令牌时新建会话并撤销旧的，避免旧令牌继续可用。",
    6: "审计记录不参与业务查询，单独归档，避免与预约表争用缓冲池。",
    7: "房间的开放与停用由管理员手动切换，切换记录写入审计，便于追溯调整时间。",
    8: "时段名称与起止时间共同构成展示标识，前端按开始时间排序后渲染时间轴。",
    9: "座位的行列坐标用于平面图定位，编号用于列表与签到码，两者都不允许为空。",
    11: "签到窗口的判定以服务端时间为准，客户端时间仅用于提示，防止改本地时间绕过。",
    12: "违约记录生成后立即生效，限制期从生成时刻起算，到期由定时任务解除。",
    13: "工单只在提交与关闭时通知学生，处理中的状态变化不推送，减少打扰。",
}

TARGET = 590
for n, tail in TAIL.items():
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    if not m or len(m.group(0)) >= TARGET:
        continue
    text = text[:m.end()] + tail + text[m.end():]

io.open(MD, "w", encoding="utf-8").write(text)
for n in range(4, 14):
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    print(n, len(m.group(0)) if m else None)
