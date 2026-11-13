# -*- coding: utf-8 -*-
import io
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = "scripts/render_diagrams.py"
t = io.open(p, encoding="utf-8").read()
old = '    title = spec["title"]\n    d.text((56, 44), title, font=f, fill=INK)'
new = '    title = spec.get("title") or ""\n    if title:\n        d.text((56, 44), title, font=f, fill=INK)'
print("found:", old in t)
t = t.replace(old, new)
io.open(p, "w", encoding="utf-8").write(t)

sp = json.load(open("thesis/figures/specs.json", encoding="utf-8"))
for s in sp:
    if s["file"] == "fig3-1.png":
        s["title"] = ""
json.dump(sp, open("thesis/figures/specs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("spec title cleared")
