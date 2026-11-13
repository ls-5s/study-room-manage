# -*- coding: utf-8 -*-
"""把 10 个实体属性段补到约 600 字，使“图 220 + 20 行正文”接近满页。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

TAIL = {
    4: "登录失败只累加失败次数并做限流，不写审计；只有管理员级别的账号变更才进入审计表。",
    5: "同一用户允许多条有效会话，便于多设备同时在线；退出全部设备时按用户批量写入撤销时间。",
    6: "审计查询默认按时间倒序分页，单页上限 100 条；导出功能只对超级管理员开放，避免批量外泄操作记录。",
    7: "房间平面图的行列数在创建时确定，后续调整只能通过迁移脚本修改，避免已有座位的坐标失效。",
    8: "时段与房间的归属关系不可跨房间移动；需要调整时新建时段并停用旧的，历史预约仍指向旧时段。",
    9: "座位停用前需确认无有效预约，接口会返回冲突提示，由管理员先处理预约再停用。",
    10: "预约创建时四个外键同时校验存在性，任一缺失即返回 404；快照字段由服务端读取，不接受前端传入。",
    11: "签到接口对同一预约重复调用返回成功而不是冲突，前端据此幂等刷新页面。",
    12: "违约阈值与限制天数来自配置表，调整阈值不影响已生成的违约记录，只影响后续判定。",
    13: "工单暂不支持附件，描述文本上限由字段类型决定；处理结果对提交学生可见，内部备注不落库。",
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
