# -*- coding: utf-8 -*-
"""把 10 个实体属性段补到 470-520 字，填满“图 + 18 行”版面。"""
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

MD = "thesis/drafts/04-系统设计.md"
text = io.open(MD, encoding="utf-8").read()

TAIL = {
    4: "用户表不设软删除标记，停用即 `status=disabled`，历史预约与违约仍可关联到该用户。",
    5: "会话记录按用户与创建时间建索引，支持按用户批量撤销；过期记录由定时任务清理，保留最近 30 天用于排查异常登录。",
    6: "审计记录保留期由运维配置，导出时按时间范围与资源类型筛选；`before_json` 为空表示新增，`after_json` 为空表示删除。",
    7: "房间状态与时段状态是两级开关：房间停用后其下所有时段一并不可预约；房间开放而某时段停用，则只影响该时段。",
    8: "同一房间的时段数量不设硬上限，前端按开始时间排序；两个时段完全重叠时，创建预约任一命中即视为同一可用区间。",
    9: "座位坐标从 1 开始计数，与前端网格一一对应；批量生成先校验行列范围，再按前缀加序号生成编号，整批在同一事务提交。",
    11: "签到成功后写入业务日期供统计使用；人工核验必须填写操作人，扫码签到则记录二维码随机数以支持追溯。",
    12: "违约生成时同步更新用户计数与限制期，撤销时同样回写；用户侧计数与违约明细在同一事务内保持一致。",
    13: "工单状态流转由管理员操作，学生只能查看；`type` 为占座类时要求填写座位，设备与环境类只填自习室；已完结工单不允许再次修改。",
}

TARGET = 480
for n, tail in TAIL.items():
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    if not m:
        print("miss", n)
        continue
    if len(m.group(0)) >= TARGET:
        continue
    text = text[:m.end()] + tail + text[m.end():]

io.open(MD, "w", encoding="utf-8").write(text)

for n in (4, 5, 6, 7, 8, 9, 10, 11, 12, 13):
    m = re.search(r"^[^\n]*实体的属性如图 4-%d 所示。[^\n]*" % n, text, re.M)
    print(n, len(m.group(0)) if m else None)
