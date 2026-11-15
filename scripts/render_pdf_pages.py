# -*- coding: utf-8 -*-
"""把 PDF 指定页渲染成 PNG，供逐页审阅。

用法：
    python scripts/render_pdf_pages.py <pdf路径> <输出目录> <文件名前缀> 1 2 3
"""
import os
import sys

import pymupdf


def render(pdf_path, out_dir, prefix, pages, dpi=150):
    os.makedirs(out_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    zoom = dpi / 72.0
    mat = pymupdf.Matrix(zoom, zoom)
    out = []
    for p in pages:
        if p < 1 or p > doc.page_count:
            print("skip out of range:", p)
            continue
        page = doc.load_page(p - 1)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        path = os.path.join(out_dir, "%s-p%03d.png" % (prefix, p))
        pix.save(path)
        out.append(path)
        print(path, pix.width, "x", pix.height)
    doc.close()
    return out


if __name__ == "__main__":
    pdf = sys.argv[1]
    out_dir = sys.argv[2]
    prefix = sys.argv[3]
    pages = [int(x) for x in sys.argv[4:]]
    render(pdf, out_dir, prefix, pages)
