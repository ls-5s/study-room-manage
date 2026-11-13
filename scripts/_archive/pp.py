import sys,re
sys.stdout.reconfigure(encoding="utf-8")
t=open(r"C:\Users\11385\Desktop\bj\output\ref_pdf_text.txt",encoding="utf-8").read()
pages=re.split(r"===== \[PAGE (\d+)\] =====",t)
idx=1; d={}
while idx+1<len(pages):
    d[int(pages[idx])]=pages[idx+1]; idx+=2
for p in [9,10,11,14,15,17]:
    print(f"\n########## PAGE {p} ##########")
    print(d[p])
