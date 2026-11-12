# -*- coding: utf-8 -*-
"""把提取的字体安装到当前用户（无需管理员）。"""
import ctypes
import os
import shutil
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")

SRC = os.path.join("thesis", "fonts")
DST = os.path.join(os.environ["LOCALAPPDATA"], "Microsoft", "Windows", "Fonts")
os.makedirs(DST, exist_ok=True)

fonts = {
    "STXingkai.ttf": "STXingkai (TrueType)",
    "STZhongsong.ttf": "STZhongsong (TrueType)",
}

for name, reg_name in fonts.items():
    src = os.path.join(SRC, name)
    dst = os.path.join(DST, name)
    shutil.copyfile(src, dst)
    subprocess.run([
        "reg", "add",
        r"HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts",
        "/v", reg_name, "/t", "REG_SZ", "/d", dst, "/f",
    ], capture_output=True)
    added = ctypes.windll.gdi32.AddFontResourceW(dst)
    print(name, "->", dst, "| AddFontResource:", added)

# 广播字体变更
HWND_BROADCAST = 0xFFFF
WM_FONTCHANGE = 0x001D
ctypes.windll.user32.SendMessageW(HWND_BROADCAST, WM_FONTCHANGE, 0, 0)
print("broadcast done")
