# -*- coding: utf-8 -*-
"""每个实体段补至 330 字以上，使“图 + 12 行以上正文”成立。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

TAIL = {
    4: "用户表按 `student_no` 与 `username` 建索引，登录与实名查询都走唯一索引，避免全表扫描。",
    6: "审计表按操作时间建索引，按人筛选时走 `operator_id` 与时间组合，避免全表扫描。",
    7: "房间描述用于学生端展示，长度上限 500 足以覆盖开放时间、注意事项等说明。",
    8: "时段停用后不再参与预约创建，但已产生的预约仍按原时段展示，不做追溯修改。",
    9: "维修状态由管理员手工切换，切换时不影响已有预约，只影响后续可选列表。",
    11: "签到记录不提供修改接口，发现误操作时通过取消预约与重新签到处理，保持流水不可变。",
    12: "撤销违约后用户计数立即回退，限制期若已开始则不自动解除，需管理员另行处理。",
}

for n, tail in TAIL.items():
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    if not m:
        print("miss", n)
        continue
    para = m.group(0)
    if len(para) >= 340:
        continue
    text = text[:m.end()] + tail + text[m.end():]

io.open(MD, "w", encoding="utf-8").write(text)
print("tails appended")
