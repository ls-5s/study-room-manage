# -*- coding: utf-8 -*-
"""生成 thesis/figures/specs.json（30 张图的布局规格）。"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "thesis", "figures", "specs.json")

specs = []


def uc(fid, title, actor, main, subs):
    specs.append({"file": fid, "kind": "usecase", "title": title,
                  "actor": actor, "main": main, "subs": subs,
                  "boundary": "校园自习室预约管理系统"})


specs.append({"file": "fig3-1.png", "kind": "tree", "title": "学生功能结构图",
              "root": "学生",
              "items": ["账户管理", "座位查询", "预约提交", "签到", "取消与记录", "违约与反馈"]})

uc("fig3-2.png", "学生账户管理用例", "学生", "账户管理",
   ["注册账号", "登录系统", "查看与修改资料", "修改密码", "退出登录"])
uc("fig3-3.png", "学生座位查询用例", "学生", "座位查询",
   ["浏览自习室列表", "查看开放时段", "查看座位平面图", "按日期与时段筛选"])
uc("fig3-4.png", "学生预约提交用例", "学生", "预约提交",
   ["选择日期与时段", "选择座位", "冲突校验", "查看预约结果"])
uc("fig3-5.png", "学生签到用例", "学生", "签到",
   ["扫描签到二维码", "上传二维码图片", "提交签到", "查看签到结果"])
uc("fig3-6.png", "学生取消与记录查询用例", "学生", "取消与记录查询",
   ["取消预约", "查看预约记录", "查看状态时间线"])
uc("fig3-7.png", "学生违约与反馈用例", "学生", "违约与反馈",
   ["查看违约记录", "查看预约限制期", "提交占座举报", "查看处理结果"])
specs.append({"file": "fig3-8.png", "kind": "tree", "title": "管理员功能结构图",
              "root": "管理员",
              "items": ["自习室管理", "时段与座位维护", "预约管理", "违约管理", "反馈处理", "统计与报表"]})

uc("fig3-9.png", "管理员自习室管理用例", "管理员", "自习室管理",
   ["新增自习室", "编辑自习室信息", "调整平面尺寸", "启停自习室"])
uc("fig3-10.png", "管理员时段与座位维护用例", "管理员", "时段与座位维护",
   ["配置开放时段", "启停开放时段", "批量生成座位", "设置维修状态"])
uc("fig3-11.png", "管理员预约管理用例", "管理员", "预约管理",
   ["多条件查询", "查看详情与时间线", "人工核验签到", "取消异常预约"])
uc("fig3-12.png", "管理员违约管理用例", "管理员", "违约管理",
   ["查询违约记录", "配置违约规则", "撤销违约"])
uc("fig3-13.png", "管理员反馈处理用例", "管理员", "反馈处理",
   ["查看工单列表", "查看工单详情", "受理并填写结果", "驳回工单"])
uc("fig3-14.png", "管理员统计与系统设置用例", "管理员", "统计与系统设置",
   ["查看仪表盘", "查看趋势报表", "导出 CSV", "调整系统参数", "查看任务状态"])

specs.append({
    "file": "fig3-15.png", "kind": "state", "title": "预约状态流转",
    "start": (90, 360),
    "nodes": [
        {"id": "pending", "label": "待签到", "x": 330, "y": 360, "w": 210, "h": 92},
        {"id": "checked", "label": "已签到", "x": 780, "y": 200, "w": 210, "h": 92},
        {"id": "completed", "label": "已完成", "x": 1140, "y": 200, "w": 210, "h": 92},
        {"id": "cancelled", "label": "已取消", "x": 330, "y": 620, "w": 210, "h": 92},
        {"id": "noshow", "label": "已失约", "x": 780, "y": 620, "w": 210, "h": 92},
    ],
    "edges": [
        {"from": "pending", "to": "checked", "label": "窗口内签到", "lpos": (10, -26)},
        {"from": "pending", "to": "cancelled", "label": "学生或管理员取消", "lpos": (-96, -10)},
        {"from": "pending", "to": "noshow", "label": "超窗未签到", "lpos": (0, -26)},
        {"from": "checked", "to": "completed", "label": "到达结束时间", "lpos": (0, -24)},
    ],
})

specs.append({
    "file": "fig4-1.png", "kind": "structure", "title": "系统功能结构",
    "groups": [
        {"label": "业务模块", "h": 190,
         "items": ["认证与用户", "自习室与座位", "预约与签到", "违约管理", "反馈工单", "统计与报表"]},
        {"label": "支撑模块", "h": 190,
         "items": ["系统基础与运维", "设计与视觉规范"]},
    ],
})

specs.append({
    "file": "fig4-2.png", "kind": "arch", "title": "系统三层架构",
    "groups": [
        {"label": "表现层（浏览器）", "h": 170,
         "items": ["页面与路由", "Pinia 状态", "Axios 请求", "ECharts 图表"]},
        {"label": "业务服务层（Express）", "h": 170,
         "items": ["路由与中间件", "业务服务", "事务与加锁", "定时任务"]},
        {"label": "数据访问层（Sequelize）", "h": 150,
         "items": ["模型定义", "查询构建", "迁移脚本"]},
        {"label": "数据层（MySQL 8）", "h": 130,
         "items": ["业务数据表", "索引与约束"]},
    ],
})


def er(fid, title, ents, rels, w=1400, h=760):
    specs.append({"file": fid, "kind": "er", "title": title, "w": w, "h": h,
                  "entities": [{"id": k, "label": v, "x": x, "y": y} for k, v, x, y in ents],
                  "relations": [{"from": a, "to": b, "label": l, "c1": c1, "c2": c2, "x": x, "y": y}
                                for l, a, b, c1, c2, x, y in rels]})


def erfull(fid, title, ents, rels, w=2200, h=1700):
    specs.append({"file": fid, "kind": "er_full", "title": title, "w": w, "h": h,
                  "entities": [{"id": k, "label": v, "x": x, "y": y, "attrs": a} for k, v, x, y, a in ents],
                  "relations": [{"from": a, "to": b, "label": l, "c1": c1, "c2": c2, "x": x, "y": y}
                                for l, a, b, c1, c2, x, y in rels]})


erfull("fig4-3.png", "系统整体 E-R 图",
       [("h", "自习室", 620, 330,
         [["名称", 620, 150], ["位置", 880, 235], ["自习室ID", 420, 215]]),
        ("s", "座位", 260, 780,
         [["座位ID", 80, 690], ["行号", 190, 585], ["座位编号", 70, 865], ["列号", 210, 965]]),
        ("t", "开放时段", 330, 1150,
         [["时段ID", 105, 1050], ["名称", 110, 1215], ["开始时间", 195, 1345], ["结束时间", 420, 1390]]),
        ("r", "预约", 900, 1330,
         [["预约ID", 770, 1505], ["预约日期", 1020, 1480], ["开始时刻", 630, 1445], ["状态", 1190, 1520]]),
        ("u", "用户", 1250, 780,
         [["用户ID", 1250, 585], ["用户名", 1035, 650], ["学号", 1465, 650],
          ["显示名称", 1035, 515], ["手机号", 1465, 515]]),
        ("v", "违约记录", 1750, 1050,
         [["违约ID", 1955, 975], ["原因", 1965, 1125], ["发生时刻", 1770, 855]]),
        ("c", "签到", 1500, 1400,
         [["签到ID", 1755, 1355], ["签到时刻", 1500, 1585], ["方式", 1710, 1525]])],
       [("包含", "h", "s", "1", "N", 440, 555),
        ("配置", "h", "t", "1", "N", 440, 745),
        ("被占", "s", "r", "1", "N", 580, 1055),
        ("约束", "t", "r", "1", "N", 615, 1240),
        ("发起", "u", "r", "1", "N", 1075, 1055),
        ("签到", "r", "c", "1", "0..1", 1200, 1365),
        ("产生", "r", "v", "1", "0..1", 1325, 1190),
        ("累计", "u", "v", "1", "N", 1500, 915)])


def attr(fid, title, entity, attrs):
    specs.append({"file": fid, "kind": "attr", "title": title,
                  "entity": entity, "attrs": attrs})


attr("fig4-4.png", "用户实体属性图", "用户",
     ["用户ID", "学号", "用户名", "显示名称", "邮箱", "手机号",
      "角色", "状态", "违约次数", "限制截止时间", "创建时间"])
attr("fig4-5.png", "会话实体属性图", "会话",
     ["会话ID", "用户ID", "令牌标识", "过期时间", "撤销时间", "创建时间"])
attr("fig4-6.png", "审计日志实体属性图", "审计日志",
     ["日志ID", "操作人", "操作类型", "资源类型", "资源标识", "操作原因", "请求标识", "操作时间"])
attr("fig4-7.png", "自习室实体属性图", "自习室",
     ["自习室ID", "名称", "位置", "描述", "平面行数", "平面列数", "状态", "生效日期"])
attr("fig4-8.png", "开放时段实体属性图", "开放时段",
     ["时段ID", "自习室ID", "时段名称", "开始时间", "结束时间", "状态", "生效日期"])
attr("fig4-9.png", "座位实体属性图", "座位",
     ["座位ID", "自习室ID", "批次前缀", "座位编号", "行号", "列号", "状态", "备注"])
attr("fig4-10.png", "预约实体属性图", "预约",
     ["预约ID", "用户ID", "座位ID", "时段ID", "预约日期", "开始时刻",
      "结束时刻", "签到截止", "状态", "幂等键", "取消原因"])
attr("fig4-11.png", "签到实体属性图", "签到",
     ["签到ID", "预约ID", "签到时刻", "业务日期", "签到方式", "操作人"])
attr("fig4-12.png", "违约记录实体属性图", "违约记录",
     ["违约ID", "用户ID", "预约ID", "违约类型", "状态", "原因", "发生时刻", "撤销原因"])
attr("fig4-13.png", "反馈工单实体属性图", "反馈工单",
     ["工单ID", "用户ID", "自习室ID", "座位ID", "类型", "描述", "状态", "处理结果", "处理时间"])


er("fig4-14.png", "用户与会话局部 E-R 图",
   [("u", "用户", 420, 380), ("s", "会话", 1000, 260), ("a", "审计日志", 1000, 560)],
   [("持有", "u", "s", "1", "N", 710, 320),
    ("操作", "u", "a", "1", "N", 710, 470)])

er("fig4-15.png", "自习室、时段与座位局部 E-R 图",
   [("h", "自习室", 400, 400), ("t", "开放时段", 1000, 260), ("s", "座位", 1000, 560)],
   [("配置", "h", "t", "1", "N", 700, 330),
    ("包含", "h", "s", "1", "N", 700, 480)])

er("fig4-16.png", "预约、签到与状态日志局部 E-R 图",
   [("u", "用户", 260, 400), ("r", "预约", 760, 400),
    ("c", "签到", 1200, 260), ("l", "状态日志", 1200, 560)],
   [("发起", "u", "r", "1", "N", 510, 400),
    ("签到", "r", "c", "1", "0..1", 980, 330),
    ("记录", "r", "l", "1", "N", 980, 480)],
   w=1500, h=800)

er("fig4-17.png", "违约与反馈局部 E-R 图",
   [("r", "预约", 700, 200), ("v", "违约记录", 1290, 410),
    ("u", "用户", 400, 430), ("f", "反馈工单", 760, 690)],
   [("产生", "r", "v", "1", "0..1", 995, 305),
    ("累计", "u", "v", "1", "N", 845, 420),
    ("提交", "u", "f", "1", "N", 580, 560)],
   w=1480, h=830)

er("fig4-18.png", "统计快照局部 E-R 图",
   [("h", "自习室", 350, 300), ("t", "开放时段", 350, 700),
    ("m", "分时段快照", 900, 500), ("d", "统计运行", 1320, 500)],
   [("统计", "h", "m", "1", "N", 625, 400),
    ("统计", "t", "m", "1", "N", 625, 600),
    ("生成", "d", "m", "1", "N", 1110, 500)])


def seq(fid, title, parts, msgs):
    specs.append({"file": fid, "kind": "sequence", "title": title,
                  "participants": parts, "messages": msgs})


seq("fig5-1.png", "学生登录时序",
    ["学生", "登录页", "认证服务", "MySQL"],
    [{"from": "学生", "to": "登录页", "label": "输入账号与密码"},
     {"from": "登录页", "to": "认证服务", "label": "POST /auth/login"},
     {"from": "认证服务", "to": "MySQL", "label": "查询用户并比对哈希"},
     {"self": "认证服务", "label": "bcrypt 哈希比对"},
     {"from": "认证服务", "to": "MySQL", "label": "写入会话记录"},
     {"from": "认证服务", "to": "登录页", "label": "返回令牌与用户", "kind": "return"},
     {"from": "登录页", "to": "学生", "label": "跳转首页", "kind": "return"}])

seq("fig5-4.png", "座位可用性查询时序",
    ["学生", "选座页", "资源服务", "MySQL"],
    [{"from": "学生", "to": "选座页", "label": "选择日期与时段"},
     {"from": "选座页", "to": "资源服务", "label": "GET /study-rooms/:id/seats"},
     {"from": "资源服务", "to": "MySQL", "label": "查询座位与有效预约"},
     {"from": "MySQL", "to": "资源服务", "label": "座位与占用列表", "kind": "return"},
     {"from": "资源服务", "to": "选座页", "label": "返回座位状态", "kind": "return"},
     {"from": "选座页", "to": "学生", "label": "渲染平面图", "kind": "return"}])

seq("fig5-7.png", "预约创建时序",
    ["学生", "确认页", "预约服务", "MySQL"],
    [{"from": "学生", "to": "确认页", "label": "确认座位与时段"},
     {"from": "确认页", "to": "预约服务", "label": "POST /reservations 携带幂等键"},
     {"from": "预约服务", "to": "MySQL", "label": "开启事务并按序加锁"},
     {"self": "预约服务", "label": "区间相交判定与配额校验"},
     {"from": "MySQL", "to": "预约服务", "label": "资源状态", "kind": "return"},
     {"from": "预约服务", "to": "MySQL", "label": "校验冲突与配额后写入"},
     {"from": "MySQL", "to": "预约服务", "label": "提交成功", "kind": "return"},
     {"from": "预约服务", "to": "确认页", "label": "返回预约详情", "kind": "return"}])

seq("fig5-9.png", "学生签到时序",
    ["学生", "签到页", "签到服务", "MySQL"],
    [{"from": "学生", "to": "签到页", "label": "扫描或上传二维码"},
     {"from": "签到页", "to": "签到服务", "label": "POST /reservations/:id/check-in"},
     {"self": "签到服务", "label": "签名校验与窗口判定"},
     {"from": "签到服务", "to": "MySQL", "label": "验签并校验窗口后写入签到"},
     {"from": "MySQL", "to": "签到服务", "label": "签到记录", "kind": "return"},
     {"from": "签到服务", "to": "签到页", "label": "返回已签到", "kind": "return"}])

seq("fig5-11.png", "学生取消预约时序",
    ["学生", "预约详情页", "预约服务", "MySQL"],
    [{"from": "学生", "to": "预约详情页", "label": "点击取消并二次确认"},
     {"from": "预约详情页", "to": "预约服务", "label": "POST /reservations/:id/cancel"},
     {"from": "预约服务", "to": "MySQL", "label": "校验时间与状态后更新"},
     {"from": "MySQL", "to": "预约服务", "label": "座位已释放", "kind": "return"},
     {"from": "预约服务", "to": "预约详情页", "label": "返回已取消", "kind": "return"}])

seq("fig5-14.png", "反馈提交时序",
    ["学生", "反馈页", "反馈服务", "MySQL"],
    [{"from": "学生", "to": "反馈页", "label": "填写类型与描述"},
     {"from": "反馈页", "to": "反馈服务", "label": "POST /feedback-tickets"},
     {"from": "反馈服务", "to": "MySQL", "label": "写入工单与资源快照"},
     {"from": "MySQL", "to": "反馈服务", "label": "工单标识", "kind": "return"},
     {"from": "反馈服务", "to": "反馈页", "label": "返回待处理", "kind": "return"}])

seq("fig5-16.png", "统计聚合时序",
    ["管理员", "仪表盘", "统计服务", "MySQL"],
    [{"from": "管理员", "to": "仪表盘", "label": "选择日期范围"},
     {"from": "仪表盘", "to": "统计服务", "label": "GET /admin/statistics/overview"},
     {"from": "统计服务", "to": "MySQL", "label": "读取快照并实时聚合"},
     {"from": "MySQL", "to": "统计服务", "label": "指标数据", "kind": "return"},
     {"from": "统计服务", "to": "仪表盘", "label": "返回卡片与趋势", "kind": "return"}])

seq("fig5-19.png", "批量生成座位时序",
    ["管理员", "座位管理页", "资源服务", "MySQL"],
    [{"from": "管理员", "to": "座位管理页", "label": "设置批次与行列范围"},
     {"from": "座位管理页", "to": "资源服务", "label": "POST /admin/study-rooms/:id/seats"},
     {"from": "资源服务", "to": "MySQL", "label": "校验前缀并逐行插入"},
     {"from": "MySQL", "to": "资源服务", "label": "生成与跳过数量", "kind": "return"},
     {"from": "资源服务", "to": "座位管理页", "label": "返回生成结果", "kind": "return"}])

seq("fig5-22.png", "人工核验签到时序",
    ["管理员", "预约管理页", "预约服务", "MySQL"],
    [{"from": "管理员", "to": "预约管理页", "label": "点击人工签到"},
     {"from": "预约管理页", "to": "预约服务", "label": "POST /admin/reservations/:id/check-in"},
     {"from": "预约服务", "to": "MySQL", "label": "校验状态与窗口后写入"},
     {"from": "MySQL", "to": "预约服务", "label": "签到记录", "kind": "return"},
     {"from": "预约服务", "to": "预约管理页", "label": "返回已签到", "kind": "return"}])

seq("fig5-25.png", "撤销违约时序",
    ["管理员", "违约管理页", "违约服务", "MySQL"],
    [{"from": "管理员", "to": "违约管理页", "label": "填写原因并确认撤销"},
     {"from": "违约管理页", "to": "违约服务", "label": "PATCH /admin/violations/:id"},
     {"from": "违约服务", "to": "MySQL", "label": "锁定用户并更新记录"},
     {"self": "违约服务", "label": "重算有效违约数与限制期"},
     {"from": "MySQL", "to": "违约服务", "label": "有效违约数", "kind": "return"},
     {"from": "违约服务", "to": "违约管理页", "label": "返回限制状态", "kind": "return"}])

seq("fig5-27.png", "反馈工单处理时序",
    ["管理员", "工单页", "工单服务", "MySQL"],
    [{"from": "管理员", "to": "工单页", "label": "选择状态并填写结果"},
     {"from": "工单页", "to": "工单服务", "label": "PATCH /admin/feedback-tickets/:id"},
     {"self": "工单服务", "label": "状态机校验"},
     {"from": "工单服务", "to": "MySQL", "label": "按状态机更新工单"},
     {"from": "MySQL", "to": "工单服务", "label": "工单记录", "kind": "return"},
     {"from": "工单服务", "to": "工单页", "label": "返回已解决", "kind": "return"}])

seq("fig5-30.png", "系统配置保存时序",
    ["管理员", "系统设置页", "系统服务", "MySQL"],
    [{"from": "管理员", "to": "系统设置页", "label": "修改预约窗口天数"},
     {"from": "系统设置页", "to": "系统服务", "label": "PUT /admin/system/settings"},
     {"self": "系统服务", "label": "刷新参数缓存"},
     {"from": "系统服务", "to": "MySQL", "label": "写入配置并记录审计"},
     {"from": "MySQL", "to": "系统服务", "label": "最新配置", "kind": "return"},
     {"from": "系统服务", "to": "系统设置页", "label": "返回保存成功", "kind": "return"}])

with open(OUT, "w", encoding="utf-8") as fp:
    json.dump(specs, fp, ensure_ascii=False, indent=1)
print("specs:", len(specs))
