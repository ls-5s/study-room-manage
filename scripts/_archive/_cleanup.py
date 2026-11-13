# -*- coding: utf-8 -*-
"""清理一次性脚本与旧对比图：移动到 _archive，保留生成链与校验脚本。"""
import os
import shutil
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\11385\Desktop\bj"
SCRIPTS = os.path.join(ROOT, "scripts")
ARCH = os.path.join(SCRIPTS, "_archive")
os.makedirs(ARCH, exist_ok=True)

KEEP = {
    "build_thesis_docx.py", "build_specs.py", "render_diagrams.py",
    "export_pdf_ascii.ps1", "render_pdf_pages.py",
    "audit_all_pages.py", "audit_range7.py", "audit_seven.py",
    "thesis_check.py", "restyle_refs.py", "build_sbs_all.py",
    "patch_er_layout.py", "patch_er_spec.py",
}

moved = []
for name in sorted(os.listdir(SCRIPTS)):
    p = os.path.join(SCRIPTS, name)
    if not os.path.isfile(p):
        continue
    if name in KEEP:
        continue
    if name.endswith((".py", ".ps1", ".mjs")):
        shutil.move(p, os.path.join(ARCH, name))
        moved.append(name)

# 空目录
ws = os.path.join(ROOT, "thesis-workspace")
if os.path.isdir(ws) and not any(os.scandir(ws)):
    os.rmdir(ws)
    print("removed empty thesis-workspace")

# 旧对比图归档
pages = os.path.join(ROOT, "thesis", "reports", "pages")
old_arch = os.path.join(ROOT, "thesis", "reports", "_archive_pages")
os.makedirs(old_arch, exist_ok=True)
img_moved = 0
for name in sorted(os.listdir(pages)):
    p = os.path.join(pages, name)
    if not os.path.isfile(p):
        continue
    if name.lower().endswith((".png", ".jpg")):
        shutil.move(p, os.path.join(old_arch, name))
        img_moved += 1

print("scripts moved:", len(moved))
print("images moved:", img_moved)
