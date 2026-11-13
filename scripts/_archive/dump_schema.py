import re, sys, pathlib
sys.stdout.reconfigure(encoding="utf-8")
base = pathlib.Path(r"C:\Users\11385\Desktop\bj\backend\src\migrations")
tables = []
for f in sorted(base.glob("0*.ts")):
    txt = f.read_text(encoding="utf-8")
    for m in re.finditer(r"CREATE TABLE IF NOT EXISTS (\w+)\s*\((.*?)\n  \)", txt, re.S):
        name, body = m.group(1), m.group(2)
        cols, keys, fks = [], [], []
        for raw in body.split("\n"):
            line = raw.strip().rstrip(",")
            if not line or line.startswith("--"):
                continue
            up = line.upper()
            if up.startswith(("PRIMARY KEY","UNIQUE KEY","KEY ","INDEX ","FULLTEXT")):
                keys.append(line); continue
            if up.startswith(("CONSTRAINT","FOREIGN KEY")):
                fks.append(line); continue
            cols.append(line)
        tables.append((name, cols, keys, fks, f.name))
for name, cols, keys, fks, src in tables:
    print(f"\n=== {name}  [{src}] ===")
    for c in cols:
        print("  ", re.sub(r"\s+", " ", c))
    for k in keys:
        print("  #", re.sub(r"\s+", " ", k))
    print(f"  columns={len(cols)}")
print(f"\n总表数: {len(tables)}")
