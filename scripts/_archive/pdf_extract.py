import sys, io
sys.stdout.reconfigure(encoding="utf-8")
from pypdf import PdfReader
p = r"C:\Users\11385\Desktop\(修改)223020684_何欣庭_初稿6次(1).pdf"
r = PdfReader(p)
print("PAGES:", len(r.pages))
info = r.metadata
print("META:", info)
out = []
for i, pg in enumerate(r.pages):
    t = pg.extract_text() or ""
    out.append(f"\n===== [PAGE {i+1}] =====\n" + t)
open(r"C:\Users\11385\Desktop\bj\output\ref_pdf_text.txt", "w", encoding="utf-8").write("".join(out))
print("written")
