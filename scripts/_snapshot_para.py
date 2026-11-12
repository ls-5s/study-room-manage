# -*- coding: utf-8 -*-
import io

p = "thesis/drafts/04-系统设计.md"
t = io.open(p, encoding="utf-8").read()
anchor = "表 4-15 统计运行表（daily_statistics_runs）字段设计"
add = (
    "快照表按“日期 + 自习室 + 时段”唯一，一份快照只生成一次。生成时机分为两步："
    "当日零点后写入容量快照，记录当时的可预约座位数与可开放座位分钟；"
    "次日凌晨冻结前一日的预约数、签到数、失约数与已用座位分钟，写入 finalized_at 后不再更新。"
    "分成两步而不是一次算完，是因为当天的预约仍在变化，若提前冻结，晚间的预约会被漏计；"
    "而容量快照必须提前固化，否则资源调整后，历史利用率就没有统一的分母。"
    "统计运行表记录每天的快照是否生成与冻结，定时任务据此判断是否重跑，避免重复计算。"
)
assert anchor in t
t = t.replace(anchor, add + "\n\n" + anchor, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("snapshot paragraph added")
