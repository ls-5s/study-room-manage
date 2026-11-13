# -*- coding: utf-8 -*-
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 题目两行行高单独设置
t = t.replace("    ROW_H = Cm(1.92)", "    ROW_H = Cm(1.92)\n    TITLE_H = Cm(0.80)")
t = t.replace('''    for i, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        table.rows[i].height = ROW_H''',
'''    for i, line in enumerate(["基于 Vue3 的校园自习室预约", "管理系统的设计与实现"]):
        table.rows[i].height = TITLE_H''')

# 2) 整块上移：副标题段后距 60 -> 18
t = t.replace('p.paragraph_format.space_after = Pt(60)\n    run = p.add_run("本科生毕业论文（设计）")',
              'p.paragraph_format.space_after = Pt(18)\n    run = p.add_run("本科生毕业论文（设计）")')

# 3) 最后一个表格后不额外留白，底部块位置上移
io.open(p, "w", encoding="utf-8").write(t)
print("title spacing and top offset adjusted")
