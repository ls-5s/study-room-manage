import sys,re
sys.stdout.reconfigure(encoding="utf-8")
t=open(r"C:\Users\11385\Desktop\bj\output\ref_pdf_text.txt",encoding="utf-8").read()
pages=re.split(r"===== \[PAGE (\d+)\] =====",t)
# pages[0] preamble then pairs
idx=1
page={}
while idx+1 < len(pages):
    page[int(pages[idx])]=pages[idx+1]; idx+=2
for p in sorted(page):
    txt=page[p].strip().split("\n")
    # skip header lines
    body=[l for l in txt if l.strip() and not l.startswith("成都锦城学院毕业论文")]
    first=" | ".join(body[:2])
    print(p, "::", first[:110])
