# -*- coding: utf-8 -*-
"""修正字体与间距：页眉行楷、声明等线、摘要楷体、标题黑体、目录黑体。"""
import io

p = "scripts/build_thesis_docx.py"
t = io.open(p, encoding="utf-8").read()

# 1) 页眉改行楷 10.5
t = t.replace('run = p.add_run("成都锦城学院毕业论文（设计）")\n    set_font(run, SONG, 10.5)',
              'run = p.add_run("成都锦城学院毕业论文（设计）")\n    set_font(run, "华文行楷", 10.5)')

# 2) 标题统一黑体：Heading 段落在循环里用 add_inline(..., size=...)，补 font=HEI
t = t.replace('add_inline(h, title, size=18)', 'add_inline(h, title, size=18, font=HEI)')
t = t.replace('add_inline(h, line[3:].strip(), size=14)', 'add_inline(h, line[3:].strip(), size=14, font=HEI)')
t = t.replace('add_inline(h, line[4:].strip(), size=12)', 'add_inline(h, line[4:].strip(), size=12, font=HEI)')
t = t.replace('add_inline(h, line[5:].strip(), size=12)', 'add_inline(h, line[5:].strip(), size=12, font=HEI)')
t = t.replace('add_inline(h, line.strip().strip("*"), size=12)', 'add_inline(h, line.strip().strip("*"), size=12, font=HEI)')

# 3) 声明/授权正文改等线 14
t = t.replace('        add_inline(para, text, size=14)\n        return para',
              '        add_inline(para, text, size=14, font="等线")\n        return para')

# 4) 摘要：题名黑体 18；专业/学生楷体 14
t = t.replace('''                    if k == 0:
                        para.paragraph_format.space_before = Pt(6)
                        para.paragraph_format.space_after = Pt(12)
                        add_inline(para, txt, size=18)
                    else:
                        para.paragraph_format.space_after = Pt(10)
                        add_inline(para, txt, size=14)''',
'''                    if k == 0:
                        para.paragraph_format.space_before = Pt(6)
                        para.paragraph_format.space_after = Pt(28)
                        add_inline(para, txt, size=18, font=HEI)
                    else:
                        para.paragraph_format.space_after = Pt(22)
                        add_inline(para, txt, size=14, font="楷体")''')

# 5) 声明标题间距：上移并拉开
t = t.replace('    p.paragraph_format.space_before = Pt(28)\n    p.paragraph_format.space_after = Pt(14)\n    run = p.add_run("成都锦城学院")',
              '    p.paragraph_format.space_before = Pt(2)\n    p.paragraph_format.space_after = Pt(18)\n    run = p.add_run("成都锦城学院")')
t = t.replace('    p.paragraph_format.space_after = Pt(16)\n    run = p.add_run("毕业论文（设计）学术诚信声明")',
              '    p.paragraph_format.space_after = Pt(14)\n    run = p.add_run("毕业论文（设计）学术诚信声明")')

# 6) 目录样式字体改黑体
t = t.replace('<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/>',
              '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="黑体"/>')

io.open(p, "w", encoding="utf-8").write(t)
print("fonts patched")
