# -*- coding: utf-8 -*-
"""把属性图后的一句套话替换为具体字段说明。"""
import io

p = "thesis/drafts/04-系统设计.md"
t = io.open(p, encoding="utf-8").read()

spec = {
    "用户": "用户实体的属性如图 4-4 所示。`id` 为自增主键，`student_no` 与 `username` 各建唯一索引，作为登录与实名的唯一依据；`role` 与 `status` 用枚举限定取值范围；`violation_count`、`restriction_started_at` 与 `restriction_until` 三个字段共同支撑违约计数与限制期的判定，限制到期由定时任务清除，不需要额外的状态表。",
    "会话": "会话实体的属性如图 4-5 所示。`id` 用 36 位字符保存，便于与令牌中的 `jti` 对应；`jti` 唯一，用来定位具体令牌；`expires_at` 与 `revoked_at` 分别表示自然过期与主动注销，两者都为空之外的取值时，该会话立即失效，因此注销不必等待令牌过期。",
    "审计日志": "审计日志实体的属性如图 4-6 所示。`before_json` 与 `after_json` 以 JSON 保存变更前后的快照，字段增删不影响已有记录；`request_id` 与请求头中的追踪标识一致，便于把一次管理操作与后端日志串起来；`reason` 记录管理员填写的操作原因，用于事后追溯。",
    "自习室": "自习室实体的属性如图 4-7 所示。`grid_rows` 与 `grid_columns` 决定选座页平面图的尺寸，座位坐标不能超出该范围；`bookable_from` 控制该房间最早可预约的日期，用于学期初统一放开；`status` 区分开放、临时关闭与停用，停用只改状态而不删除行，历史预约仍然可查。",
    "开放时段": "开放时段实体的属性如图 4-8 所示。`room_id` 指向所属自习室；`start_time` 与 `end_time` 使用 `TIME` 类型，只表示一天内的时刻，跨天场景由日期字段另行约束；`bookable_from` 让某个时段可以晚于房间整体开放，便于分段启用；`status` 用于临时关闭某一时段而不影响其他时段。",
    "座位": "座位实体的属性如图 4-9 所示。`room_id`、`seat_no` 组合唯一，`room_id`、`row_no`、`column_no` 组合也唯一，前者防止编号重复，后者防止平面坐标重叠；`batch_prefix` 记录批量生成的批次，便于按批维护；`status` 区分可用、维修与停用，维修中的座位不出现在可选列表中。",
    "预约": "预约实体的属性如图 4-10 所示。`user_id`、`room_id`、`seat_id`、`slot_id` 为外键，其中前三个同时保存名称与编号快照，资源更名后历史记录不变；生成列 `active_slot_key` 只在待签到与已签到状态下取“座位:日期:时段”，其余状态为空，配合唯一索引实现“同座位同时段仅一条有效预约”；`check_in_deadline` 决定签到窗口的截止时刻，是失约判定的直接依据。",
    "签到": "签到实体的属性如图 4-11 所示。`reservation_id` 唯一，保证一条预约只能签到一次；`method` 区分扫码与人工核验，便于统计两种通道的使用比例；`checked_in_at` 与操作人字段记录了核验时刻与执行者，出现争议时可以还原当时情形。",
    "违约记录": "违约记录实体的属性如图 4-12 所示。`reservation_id` 唯一，一条预约最多产生一条违约；`status` 区分有效与撤销，管理员撤销后该记录仍保留，但不再计入用户的违约次数，这样既保留了处理痕迹，也不会误伤学生。",
    "反馈工单": "反馈工单实体的属性如图 4-13 所示。`room_id` 与 `seat_id` 都可为空，但填写座位时必须同时填写自习室，这条约束由检查约束表达；`status` 表示待处理、处理中与已完结，`reply` 保存管理员回复；工单不设强制外键到座位，避免座位删除后工单无法追溯。",
}

count = 0
for name, sentence in spec.items():
    import re
    pattern = re.compile(r"%s 的属性如图 4-\d+ 所示，图中同时标注主键与业务字段，[^\n]*" % re.escape(name))
    new_t, n = pattern.subn(sentence, t, count=1)
    if n:
        t = new_t
        count += 1
    else:
        print("miss:", name)

io.open(p, "w", encoding="utf-8").write(t)
print("replaced:", count)
