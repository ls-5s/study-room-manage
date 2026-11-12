import sys,re
sys.stdout.reconfigure(encoding="utf-8")
t=open(r"C:\Users\11385\Desktop\bj\output\ref_pdf_text.txt",encoding="utf-8").read()
# print table of contents-ish: find lines with "图" or "表" captions
caps=re.findall(r"(图\s?\d+[-.]\d+[^\n]{0,40}|表\s?\d+[-.]\d+[^\n]{0,40})",t)
seen=[]
for c in caps:
    c=c.strip()
    if c not in seen: seen.append(c)
print(len(seen))
print("\n".join(seen[:120]))
