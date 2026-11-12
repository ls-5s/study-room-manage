# -*- coding: utf-8 -*-
"""页脚位置：参考页码基线 773.6，本稿 792.7，偏高 19 pt。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()
if "footer_distance" in t:
    import re
    t = re.sub(r"sec\.footer_distance = Cm\([0-9.]+\)", "sec.footer_distance = Cm(1.94)", t)
    t = re.sub(r"body_sec\.footer_distance = Cm\([0-9.]+\)", "body_sec.footer_distance = Cm(1.94)", t)
else:
    t = t.replace('    section.header_distance = Cm(2.0)',
                  '    section.header_distance = Cm(2.0)\n    section.footer_distance = Cm(1.94)')
io.open(p, "w", encoding="utf-8").write(t)
print("footer distance set")
