# -*- coding: utf-8 -*-
"""清理第 2～4 章旧引用，并在第 2、6 章补入新增文献引用。"""
import io
import re

# 第 2 章：清除旧引用，Vue 处改引 [28]
p = "thesis/drafts/02-关键技术.md"
t = io.open(p, encoding="utf-8").read()
t = re.sub(r"<sup>.*?</sup>", "", t)
t = t.replace("前端采用 Vue 3 的 Composition API 组织逻辑",
              "前端采用 Vue 3 的 Composition API 组织逻辑<sup>[28]</sup>", 1)
io.open(p, "w", encoding="utf-8").write(t)

# 第 3 章：清除唯一一处旧引用
p = "thesis/drafts/03-需求分析.md"
t = io.open(p, encoding="utf-8").read()
t = re.sub(r"<sup>.*?</sup>", "", t)
io.open(p, "w", encoding="utf-8").write(t)

# 第 4 章：清除数据库类旧引用
p = "thesis/drafts/04-系统设计.md"
t = io.open(p, encoding="utf-8").read()
t = re.sub(r"<sup>.*?</sup>", "", t)
io.open(p, "w", encoding="utf-8").write(t)

# 第 6 章：测试层次引 [30]，黑盒方法引 [29]，状态迁移覆盖引 [30]
p = "thesis/drafts/06-系统测试.md"
t = io.open(p, encoding="utf-8").read()
t = t.replace("测试按四个层次开展<sup>[20]</sup>", "测试按四个层次开展<sup>[30]</sup>")
t = t.replace("用例设计采用黑盒方法<sup>[21]</sup>", "用例设计采用黑盒方法<sup>[29]</sup>")
t = t.replace("逐条覆盖合法迁移与非法迁移<sup>[22]</sup>", "逐条覆盖合法迁移与非法迁移<sup>[30]</sup>")
io.open(p, "w", encoding="utf-8").write(t)

print("cleaned")
