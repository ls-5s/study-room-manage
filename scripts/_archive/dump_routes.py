import re, sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
base = pathlib.Path(r"C:\Users\11385\Desktop\bj\backend\src\routes")
rows=[]
for f in sorted(base.glob("*.ts")):
    if f.name=="index.ts": continue
    txt=f.read_text(encoding="utf-8")
    mount=None
    for m in re.finditer(r"router\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]([^)]*)", txt):
        rows.append((f.stem, m.group(1).upper(), m.group(2)))
print(len(rows))
for r in rows: print(f"{r[0]:32s} {r[1]:6s} {r[2]}")
# 挂载前缀
idx=(base/"index.ts").read_text(encoding="utf-8")
print("\n--- index.ts mounts ---")
for line in idx.split("\n"):
    if "use(" in line: print(line.strip())
