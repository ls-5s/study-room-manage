# -*- coding: utf-8 -*-
"""把不在知网的三条文献替换为知网可查的同主题文献。"""
import io
import sys

sys.stdout.reconfigure(encoding="utf-8")

refs = "thesis/drafts/参考文献.md"
t = io.open(refs, encoding="utf-8").read()

repl = [
    ("[9]胡月文，张铷钫。图书馆选座系统分析与创新 [J]. 电声技术，2018(11):54\u201156.",
     "[9]徐海东，李菲菲，王飞。基于位置服务座位管理系统的设计与实现 [J]. 农业图书情报学刊，2014,26(12):44\u201147."),
    ("[25]朱英兰，马蓉。高校图书馆自习室占座的原因与对策研究 [J]. 科教导刊(电子版)，2021(13):130\u2011131.",
     "[25]杨小薇。多层面拓展高校图书馆有限学习空间 [J]. 农业图书情报学刊，2015,27(8):143\u2011145."),
    ("[26]周珞。高校图书馆综合实力调研与优化研究 [J]. 科学大众(科技创新)，2021(4):279\u2011281.",
     "[26]谭海兵。基于微信的座位管理系统设计与实现 [J]. 农业图书情报学刊，2018,30(8):61\u201164."),
]
for old, new in repl:
    if old in t:
        t = t.replace(old, new)
        print("replaced:", old[:14])
    else:
        print("MISS:", old[:20])
io.open(refs, "w", encoding="utf-8").write(t)

intro = "thesis/drafts/01-绪论.md"
s = io.open(intro, encoding="utf-8").read()
old_s = "占座现象的成因与对策、图书馆综合实力与座位管理的关系等问题也有专门讨论"
new_s = "有限学习空间的拓展方式、以微信为入口的座位管理等问题也有专门讨论"
if old_s in s:
    s = s.replace(old_s, new_s)
    io.open(intro, "w", encoding="utf-8").write(s)
    print("sentence updated")
else:
    print("sentence MISS")
