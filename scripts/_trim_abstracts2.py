# -*- coding: utf-8 -*-
"""按参考间距后，摘要与 Abstract 各多出约 4 行，压缩文字使其回到一页。"""
import io

p = "thesis/drafts/00-摘要.md"
t = io.open(p, encoding="utf-8").read()

pairs = [
    ("传统管理依靠现场占座与人工登记：座位状态不可见，使用记录不可追溯，占座行为只能事后协调。",
     "传统管理依靠现场占座与人工登记：状态不可见、记录不可追溯，占座只能事后协调。"),
    ("线上预约把座位使用权提前分配给具体学生，使座位状态可以被查询，但也带来新的问题——如果系统只提供预约入口而不约束预约结果，预约就退化为没有成本的占位手段，座位从“占而不用”变成“约而不用”，资源浪费的形式改变而实质未变。",
     "线上预约把座位提前分配给具体学生，状态可查询，但若只提供入口而不约束结果，预约就退化为零成本的占位手段，座位从“占而不用”变成“约而不用”。"),
    ("系统采用前后端分离架构，前端基于 Vue3 与 TypeScript 构建单页应用，按学生端与管理端划分路由；后端基于 Node.js、Express 与 MySQL，按路由、控制器、服务、模型四层组织，业务规则与事务集中在服务层。",
     "系统采用前后端分离架构：前端基于 Vue3 与 TypeScript 构建单页应用，后端基于 Node.js、Express 与 MySQL，按四层组织，业务规则与事务集中在服务层。"),
    ("系统的核心是把预约、签到、取消、失约、完成组织为五状态的状态机，并配套四条约束：签到窗口限定在预约开始前 30 分钟至开始后 15 分钟；每名学生每日有效预约不超过 2 条；超窗未签到自动转为失约并生成违约记录；累计违约达到阈值后进入限制期，到期自动解除。",
     "核心是把预约、签到、取消、失约、完成组织为五状态状态机，并配套四条约束：签到窗口为开始前 30 分钟至开始后 15 分钟；每日有效预约不超过 2 条；超窗未签到转为失约并记录；累计违约达阈值后进入限制期。"),
    ("The front end is a single-page application built with Vue 3 and TypeScript; the back end uses Node.js, Express and MySQL, organised into four layers, with business rules and transactions kept in the service layer.",
     "The front end is a Vue 3 and TypeScript single-page application; the back end uses Node.js, Express and MySQL in four layers, keeping business rules and transactions in the service layer."),
    ("The core is a five-state machine (pending, checked-in, cancelled, no-show, completed) with four constraints: a check-in window from 30 minutes before the start to 15 minutes after it; at most two valid reservations per student per day; automatic no-show records for missed check-ins; and a restriction period once violations reach a threshold.",
     "The core is a five-state machine (pending, checked-in, cancelled, no-show, completed) with four constraints: a check-in window from 30 minutes before to 15 minutes after the start; at most two valid reservations per student per day; automatic no-show records; and a restriction period once violations reach a threshold."),
]
for a, b in pairs:
    if a not in t:
        print("miss:", a[:20])
    t = t.replace(a, b, 1)
io.open(p, "w", encoding="utf-8").write(t)
print("abstracts tightened")
