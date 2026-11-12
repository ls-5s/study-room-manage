# -*- coding: utf-8 -*-
"""按结构化 spec 绘制论文示意图（Pillow）。

输出：thesis/figures/png/*.png 与 thesis/figures/specs.json
说明：本机无 java/graphviz/mermaid，故用固定布局算法绘制示意图；
      spec 与脚本即为可编辑源，需要更高精度时可用同结构重绘。
"""
import json
import math
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PNG_DIR = os.path.join(ROOT, "thesis", "figures", "png")
SPEC_PATH = os.path.join(ROOT, "thesis", "figures", "specs.json")

FONT_PATH = r"C:\Windows\Fonts\msyh.ttc"
BOLD_PATH = r"C:\Windows\Fonts\msyhbd.ttc"
if not os.path.exists(BOLD_PATH):
    BOLD_PATH = FONT_PATH

INK = (34, 34, 34)
LINE = (90, 96, 106)
FILL = (252, 252, 253)
ACCENT = (228, 236, 245)
HEAD_FILL = (238, 242, 247)

_font_cache = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(BOLD_PATH if bold else FONT_PATH, size)
    return _font_cache[key]


def text_size(draw, text, f):
    if not text:
        return 0, 0
    box = draw.textbbox((0, 0), text, font=f)
    return box[2] - box[0], box[3] - box[1]


def wrap(draw, text, f, max_w):
    lines, cur = [], ""
    for ch in text:
        if ch == "\n":
            lines.append(cur)
            cur = ""
            continue
        trial = cur + ch
        if text_size(draw, trial, f)[0] > max_w and cur:
            lines.append(cur)
            cur = ch
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def text_center(draw, cx, cy, text, f, fill=INK):
    lines = text.split("\n")
    heights = [text_size(draw, ln, f)[1] for ln in lines]
    total = sum(heights) + (len(lines) - 1) * 6
    y = cy - total / 2
    for ln, hh in zip(lines, heights):
        w = text_size(draw, ln, f)[0]
        draw.text((cx - w / 2, y - 2), ln, font=f, fill=fill)
        y += hh + 6


def box(draw, cx, cy, w, h, text, size=26, bold=False, fill=FILL, radius=12):
    draw.rounded_rectangle(
        [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
        radius=radius, fill=fill, outline=LINE, width=2,
    )
    f = font(size, bold)
    text_center(draw, cx, cy, text, f)


def ellipse(draw, cx, cy, w, h, text, size=24):
    draw.ellipse([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
                 fill=FILL, outline=LINE, width=2)
    text_center(draw, cx, cy, text, font(size))


def diamond(draw, cx, cy, w, h, text, size=22):
    pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    draw.polygon(pts, fill=ACCENT, outline=LINE)
    text_center(draw, cx, cy, text, font(size))


def actor(draw, cx, cy, label, size=24):
    r = 16
    draw.ellipse([cx - r, cy - 58, cx + r, cy - 26], outline=LINE, width=2, fill=FILL)
    draw.line([cx, cy - 26, cx, cy + 10], fill=LINE, width=2)
    draw.line([cx - 26, cy - 10, cx + 26, cy - 10], fill=LINE, width=2)
    draw.line([cx, cy + 10, cx - 22, cy + 46], fill=LINE, width=2)
    draw.line([cx, cy + 10, cx + 22, cy + 46], fill=LINE, width=2)
    f = font(size, True)
    w = text_size(draw, label, f)[0]
    draw.text((cx - w / 2, cy + 56), label, font=f, fill=INK)


def arrow(draw, p1, p2, dashed=False, label=None, size=20, offset=(0, -26)):
    x1, y1 = p1
    x2, y2 = p2
    if dashed:
        d = math.hypot(x2 - x1, y2 - y1)
        steps = max(int(d / 14), 1)
        for i in range(steps):
            if i % 2:
                continue
            a = (x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps)
            b = (x1 + (x2 - x1) * (i + 1) / steps, y1 + (y2 - y1) * (i + 1) / steps)
            draw.line([a, b], fill=LINE, width=2)
    else:
        draw.line([p1, p2], fill=LINE, width=2)
    ang = math.atan2(y2 - y1, x2 - x1)
    L, Wd = 16, 7
    tip = (x2, y2)
    left = (x2 - L * math.cos(ang) + Wd * math.sin(ang), y2 - L * math.sin(ang) - Wd * math.cos(ang))
    right = (x2 - L * math.cos(ang) - Wd * math.sin(ang), y2 - L * math.sin(ang) + Wd * math.cos(ang))
    draw.polygon([tip, left, right], fill=LINE)
    if label:
        f = font(size)
        mx, my = (x1 + x2) / 2 + offset[0], (y1 + y2) / 2 + offset[1]
        w = text_size(draw, label, f)[0]
        draw.text((mx - w / 2, my), label, font=f, fill=INK)


def box_edge(cx, cy, w, h, tx, ty):
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    sx = (w / 2) / abs(dx) if dx else float("inf")
    sy = (h / 2) / abs(dy) if dy else float("inf")
    s = min(sx, sy)
    return cx + dx * s, cy + dy * s


def diamond_edge(cx, cy, w, h, tx, ty):
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    scale = 1.0 / (abs(dx) / (w / 2) + abs(dy) / (h / 2))
    return cx + dx * scale, cy + dy * scale


def new_canvas(w, h):
    img = Image.new("RGB", (w, h), (255, 255, 255))
    return img, ImageDraw.Draw(img)


# ---------------- 用例图 ----------------
def draw_usecase(spec, out):
    actors = spec["actors"]
    uses = spec["usecases"]
    w, h = 1500, max(760, 190 * len(uses))
    img, d = new_canvas(w, h)
    d.rectangle([30, 30, w - 30, h - 30], outline=LINE, width=2)
    f = font(28, True)
    title = spec["title"]
    d.text((56, 44), title, font=f, fill=INK)

    ax = 190
    actor_pos = []
    for i, a in enumerate(actors):
        cy = h * (i + 1) / (len(actors) + 1)
        actor(d, ax, cy, a)
        actor_pos.append((ax + 40, cy - 10))

    ux = w * 0.58
    u_pos = []
    for i, u in enumerate(uses):
        cy = 150 + (h - 260) * (i + 0.5) / len(uses)
        ellipse(d, ux, cy, 330, 96, u)
        u_pos.append((ux - 165, cy))

    for ai, a in enumerate(actors):
        for ui, u in enumerate(uses):
            if spec.get("edges") and [ai, ui] not in spec["edges"]:
                continue
            arrow(d, actor_pos[ai], (u_pos[ui][0] - 4, u_pos[ui][1]))
    img.save(out)


# ---------------- 功能结构树 ----------------
def draw_tree(spec, out):
    items = spec["items"]
    n = len(items)
    w, h = 1400, 210 + 92 * n
    img, d = new_canvas(w, h)
    d.text((44, 30), spec["title"], font=font(28, True), fill=INK)

    mid = (110 + h - 50) / 2
    root_x, root_w, root_h = 280, 220, 96
    box(d, root_x, mid, root_w, root_h, spec["root"], size=24, bold=True, fill=HEAD_FILL)

    spine = 720
    ys = [160 + (h - 260) * (i + 0.5) / n for i in range(n)]

    d.line([root_x + root_w / 2, mid, spine, mid], fill=LINE, width=2)
    d.line([spine, ys[0], spine, ys[-1]], fill=LINE, width=2)

    for i, (it, y) in enumerate(zip(items, ys)):
        d.line([spine, y, 950, y], fill=LINE, width=2)
        box(d, 1130, y, 340, 66, it, size=21)
    img.save(out)


# ---------------- 用例图（主用例 + include 子用例） ----------------
def draw_usecase_include(spec, out):
    subs = spec["subs"]
    n = len(subs)
    w, h = 1400, 190 + 118 * n
    img, d = new_canvas(w, h)
    d.text((44, 26), spec["title"], font=font(28, True), fill=INK)

    # 系统边界
    d.rounded_rectangle([50, 86, w - 50, h - 40], radius=10, outline=(150, 156, 166), width=2)
    d.text((74, 98), spec.get("boundary", "校园自习室预约管理系统"),
           font=font(21), fill=(110, 116, 126))

    mid = (86 + h - 40) / 2
    actor(d, 160, mid, spec["actor"])

    main_w, main_h = 280, 104
    mx = 540
    d.line([200, mid - 10, mx - main_w / 2, mid], fill=LINE, width=2)
    ellipse(d, mx, mid, main_w, main_h, spec["main"], size=23)

    for i, s in enumerate(subs):
        cy = 172 + (h - 250) * (i + 0.5) / n
        sx = 1090
        ellipse(d, sx, cy, 330, 92, s, size=21)

        dx, dy = sx - mx, cy - mid
        scale = 1.0 / math.sqrt((dx / (main_w / 2)) ** 2 + (dy / (main_h / 2)) ** 2)
        p1 = (mx + dx * scale, mid + dy * scale)
        p2 = (sx - 165, cy)
        arrow(d, p1, p2, size=19)

        # include 标注沿垂直方向偏移，避免压线
        vx, vy = p2[0] - p1[0], p2[1] - p1[1]
        norm = math.hypot(vx, vy) or 1
        lx = (p1[0] + p2[0]) / 2 - vy / norm * 24
        ly = (p1[1] + p2[1]) / 2 + vx / norm * 24
        f = font(19)
        tw, th = text_size(d, "include", f)
        d.text((lx - tw / 2, ly - th / 2), "include", font=f, fill=INK)
    img.save(out)


# ---------------- 实体属性图 ----------------
def draw_attr(spec, out):
    attrs = spec["attrs"]
    n = len(attrs)
    w, h = 1400, 1020
    img, d = new_canvas(w, h)
    d.text((44, 30), spec["title"], font=font(28, True), fill=INK)

    cx, cy = w / 2, h / 2 + 26
    rx, ry = 480, 360
    box(d, cx, cy, 210, 96, spec["entity"], size=24, bold=True, fill=HEAD_FILL)

    for i, a in enumerate(attrs):
        ang = -math.pi / 2 + 2 * math.pi * i / n
        ax, ay = cx + rx * math.cos(ang), cy + ry * math.sin(ang)
        sx, sy = box_edge(cx, cy, 210, 96, ax, ay)
        d.line([sx, sy, ax, ay], fill=LINE, width=2)
        ellipse(d, ax, ay, 176, 66, a, size=19)
    img.save(out)


# ---------------- 时序图 ----------------
def draw_sequence(spec, out):
    parts = spec["participants"]
    msgs = spec["messages"]
    n = len(msgs)
    w = 1500
    h = 250 + 86 * n
    img, d = new_canvas(w, h)
    d.text((44, 30), spec["title"], font=font(28, True), fill=INK)

    top = 140
    xs = []
    gap = (w - 300) / max(len(parts) - 1, 1)
    for i, p in enumerate(parts):
        x = 150 + gap * i
        xs.append(x)
        d.rounded_rectangle([x - 130, top - 38, x + 130, top + 38], radius=8,
                            fill=(232, 240, 250), outline=LINE, width=2)
        text_center(d, x, top, p, font(23, True))

    for x in xs:
        yy = top + 38
        while yy < h - 46:
            d.line([x, yy, x, min(yy + 14, h - 46)], fill=LINE, width=2)
            yy += 26

    def badge(cx, cy, num):
        r = 14
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(60, 66, 76))
        f = font(16, True)
        tw = text_size(d, str(num), f)[0]
        d.text((cx - tw / 2, cy - 11), str(num), font=f, fill=(255, 255, 255))

    y = top + 100
    idx = 0
    for m in msgs:
        idx += 1
        if "self" in m:
            si = parts.index(m["self"])
            x = xs[si]
            d.line([x, y, x + 70, y], fill=LINE, width=2)
            d.line([x + 70, y, x + 70, y + 42], fill=LINE, width=2)
            d.line([x + 70, y + 42, x + 12, y + 42], fill=LINE, width=2)
            ang = math.pi
            L, Wd = 15, 7
            tip = (x + 8, y + 42)
            d.polygon([tip, (tip[0] + L, tip[1] - Wd), (tip[0] + L, tip[1] + Wd)], fill=LINE)
            f = font(19)
            d.text((x + 82, y + 4), m["label"], font=f, fill=INK)
            badge(x + 14, y - 18, idx)
            y += 86
            continue

        src, dst = parts.index(m["from"]), parts.index(m["to"])
        x1, x2 = xs[src], xs[dst]
        dashed = m.get("kind") == "return"
        pad = 14 if x2 > x1 else -14
        arrow(d, (x1 + pad, y), (x2 - pad, y), dashed=dashed)
        f = font(19)
        tw = text_size(d, m["label"], f)[0]
        d.text(((x1 + x2) / 2 - tw / 2, y - 34), m["label"], font=f, fill=INK)
        badge(x1 + (26 if x2 > x1 else -26), y - 6, idx)
        y += 86
    img.save(out)


# ---------------- 状态图 ----------------
def draw_state(spec, out):
    nodes = spec["nodes"]
    w, h = 1400, 760
    img, d = new_canvas(w, h)
    d.text((48, 40), spec["title"], font=font(28, True), fill=INK)

    pos, size = {}, {}
    for nd in nodes:
        pos[nd["id"]] = (nd["x"], nd["y"])
        size[nd["id"]] = (nd["w"], nd["h"])

    dot = spec.get("start", (90, 360))
    d.ellipse([dot[0] - 16, dot[1] - 16, dot[0] + 16, dot[1] + 16], fill=(45, 45, 45))

    for e in spec["edges"]:
        p1, p2 = pos[e["from"]], pos[e["to"]]
        e1 = box_edge(p1[0], p1[1], *size[e["from"]], p2[0], p2[1])
        e2 = box_edge(p2[0], p2[1], *size[e["to"]], p1[0], p1[1])
        arrow(d, e1, e2, label=e.get("label"), offset=e.get("lpos", (0, -22)))

    first = nodes[0]["id"]
    p1 = pos[first]
    e1 = box_edge(p1[0], p1[1], *size[first], dot[0], dot[1])
    arrow(d, (dot[0] + 18, dot[1]), e1)

    for nd in nodes:
        box(d, nd["x"], nd["y"], nd["w"], nd["h"], nd["label"], size=24, bold=True,
            fill=HEAD_FILL if nd.get("start") else FILL)
    img.save(out)


# ---------------- 结构图 / 架构图 ----------------
def draw_structure(spec, out):
    groups = spec["groups"]
    w = 1500
    h = 200 + sum(g["h"] for g in groups) + 60 * (len(groups) - 1)
    img, d = new_canvas(w, h)
    d.text((48, 40), spec["title"], font=font(28, True), fill=INK)
    y = 130
    for g in groups:
        d.rounded_rectangle([70, y, w - 70, y + g["h"]], radius=14,
                            outline=LINE, width=2, fill=(248, 250, 252))
        d.text((96, y + 12), g["label"], font=font(22, True), fill=(70, 78, 90))
        items = g["items"]
        n = len(items)
        cw = (w - 260) / n
        for i, it in enumerate(items):
            cx = 130 + cw * (i + 0.5)
            box(d, cx, y + g["h"] * 0.62, cw - 26, g["h"] * 0.46, it, size=21)
        y += g["h"] + 60
    img.save(out)


# ---------------- E-R 图 ----------------
def draw_er(spec, out):
    ents = spec["entities"]
    rels = spec["relations"]
    w = spec.get("w", 1500)
    h = spec.get("h", 980)
    img, d = new_canvas(w, h)
    d.text((44, 30), spec["title"], font=font(28, True), fill=INK)

    EW, EH = 200, 72
    DW, DH = 136, 66
    pos = {e["id"]: (e["x"], e["y"]) for e in ents}

    for e in ents:
        box(d, e["x"], e["y"], EW, EH, e["label"], size=22, bold=True, fill=HEAD_FILL)

    for r in rels:
        rx, ry = r["x"], r["y"]
        p1, p2 = pos[r["from"]], pos[r["to"]]

        # 连线：实体边框 -> 菱形边框，无箭头（Chen 记法）
        for px, py in (p1, p2):
            sx, sy = box_edge(px, py, EW, EH, rx, ry)
            ex, ey = diamond_edge(rx, ry, DW, DH, px, py)
            d.line([sx, sy, ex, ey], fill=LINE, width=2)

        diamond(d, rx, ry, DW, DH, r["label"], size=20)

        # 基数标注：靠实体一端，自动避开实体框与菱形
        def occupied(x, y):
            for e in ents:
                if abs(x - e["x"]) < EW / 2 + 10 and abs(y - e["y"]) < EH / 2 + 10:
                    return True
            for r2 in rels:
                if abs(x - r2["x"]) < DW / 2 + 4 and abs(y - r2["y"]) < DH / 2 + 4:
                    return True
            return False

        for (px, py), lab in ((p1, r.get("c1", "")), (p2, r.get("c2", ""))):
            if not lab:
                continue
            sx, sy = box_edge(px, py, EW, EH, rx, ry)
            ex, ey = diamond_edge(rx, ry, DW, DH, px, py)
            vx, vy = px - rx, py - ry
            norm = math.hypot(vx, vy) or 1
            perx, pery = -vy / norm, vx / norm
            f = font(19)
            tw, th = text_size(d, lab, f)
            placed = False
            for t in (0.42, 0.58, 0.72):
                bx = sx + (ex - sx) * t
                by = sy + (ey - sy) * t
                for sign in (1, -1):
                    tx = bx + perx * 22 * sign
                    ty = by + pery * 22 * sign
                    if not occupied(tx, ty):
                        d.text((tx - tw / 2, ty - th / 2), lab, font=f, fill=INK)
                        placed = True
                        break
                if placed:
                    break
            if not placed:
                tx = sx + perx * 22
                ty = sy + pery * 22
                d.text((tx - tw / 2, ty - th / 2), lab, font=f, fill=INK)
    img.save(out)


# ---------------- 整体 E-R 图（实体+属性+联系） ----------------
def draw_er_full(spec, out):
    ents = spec["entities"]
    rels = spec["relations"]
    w = spec.get("w", 2000)
    h = spec.get("h", 1500)
    img, d = new_canvas(w, h)
    d.text((44, 30), spec["title"], font=font(30, True), fill=INK)

    EW, EH = 200, 84
    DW, DH = 156, 74
    AW, AH = 152, 54
    cx0, cy0 = w / 2, h / 2 + 20
    pos = {e["id"]: (e["x"], e["y"]) for e in ents}

    # 实体
    for e in ents:
        box(d, e["x"], e["y"], EW, EH, e["label"], size=26, bold=True, fill=HEAD_FILL)

    # 属性：支持手动坐标，缺省时环绕实体均匀分布
    for e in ents:
        attrs = e.get("attrs", [])
        k = len(attrs)
        if not k:
            continue
        base = math.atan2(e["y"] - cy0, e["x"] - cx0)
        for i, a in enumerate(attrs):
            if isinstance(a, (list, tuple)):
                name, ax, ay = a[0], a[1], a[2]
            else:
                ang = base + 2 * math.pi * i / k
                name = a
                ax = e["x"] + 172 * math.cos(ang)
                ay = e["y"] + 150 * math.sin(ang)
            sx, sy = box_edge(e["x"], e["y"], EW, EH, ax, ay)
            d.line([sx, sy, ax, ay], fill=LINE, width=2)
            ellipse(d, ax, ay, AW, AH, name, size=22)

    # 联系
    for r in rels:
        rx, ry = r["x"], r["y"]
        p1, p2 = pos[r["from"]], pos[r["to"]]
        for px, py in (p1, p2):
            sx, sy = box_edge(px, py, EW, EH, rx, ry)
            ex, ey = diamond_edge(rx, ry, DW, DH, px, py)
            d.line([sx, sy, ex, ey], fill=LINE, width=2)
        diamond(d, rx, ry, DW, DH, r["label"], size=22)

        for (px, py), lab in ((p1, r.get("c1", "")), (p2, r.get("c2", ""))):
            if not lab:
                continue
            sx, sy = box_edge(px, py, EW, EH, rx, ry)
            ex, ey = diamond_edge(rx, ry, DW, DH, px, py)
            vx, vy = px - rx, py - ry
            norm = math.hypot(vx, vy) or 1
            perx, pery = -vy / norm, vx / norm
            f = font(20)
            tw, th = text_size(d, lab, f)
            mx = (sx + ex) / 2 + perx * 20
            my = (sy + ey) / 2 + pery * 20
            d.text((mx - tw / 2, my - th / 2), lab, font=f, fill=INK)
    img.save(out)


def main():
    os.makedirs(PNG_DIR, exist_ok=True)
    with open(SPEC_PATH, encoding="utf-8") as fp:
        specs = json.load(fp)
    for s in specs:
        out = os.path.join(PNG_DIR, s["file"])
        kind = s["kind"]
        if kind == "usecase" and "main" in s:
            draw_usecase_include(s, out)
        elif kind == "usecase":
            draw_usecase(s, out)
        elif kind == "sequence":
            draw_sequence(s, out)
        elif kind == "state":
            draw_state(s, out)
        elif kind in ("structure", "arch"):
            draw_structure(s, out)
        elif kind == "er":
            draw_er(s, out)
        elif kind == "er_full":
            draw_er_full(s, out)
        elif kind == "attr":
            draw_attr(s, out)
        elif kind == "tree":
            draw_tree(s, out)
        else:
            raise ValueError(kind)
        print("ok", s["file"])


if __name__ == "__main__":
    main()
