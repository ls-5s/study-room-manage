# -*- coding: utf-8 -*-
"""封面与页眉改为参考实际字体：微软雅黑加粗 / 华文中宋 / 华文行楷。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 页眉：行楷 10.5
t = t.replace('set_font(run, "楷体", 10.5)', 'set_font(run, "华文行楷", 10.5)')

# 封面第一行：微软雅黑加粗 24.5
t = t.replace('set_font(run, "楷体", 24.5, True)', 'set_font(run, "微软雅黑", 24.5, True)')
# 封面第二行：华文中宋 26
t = t.replace('set_font(run, "楷体", 26, True)', 'set_font(run, "华文中宋", 26, False)')

io.open(p, "w", encoding="utf-8").write(t)
print("cover/header fonts set to reference families")
