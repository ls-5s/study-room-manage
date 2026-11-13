# -*- coding: utf-8 -*-
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "thesis/drafts/03-需求分析.md"
t = io.open(p, encoding="utf-8").read()

block = (
    "学生与系统的交互可以概括为一条主链：先建立账户，再查询座位并提交预约，"
    "到场签到完成使用，离开后查看记录；取消与违约处理中途变化，反馈用于上报问题。"
    "学生用例图如图 3-1 所示，图中的用例与后续各小节的功能说明一一对应。\n\n"
    "![图 3-1 学生用例图](../figures/png/fig3-1.png)\n\n"
    "图 3-1 学生用例图\n\n"
)

if block in t:
    t = t.replace(block, "", 1)

anchor = "学生端的功能可归纳为六个部分"
if anchor in t:
    t = t.replace(anchor, block + anchor, 1)
else:
    print("anchor missing")

io.open(p, "w", encoding="utf-8").write(t)
print("moved")
