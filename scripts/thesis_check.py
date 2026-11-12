# -*- coding: utf-8 -*-
"""论文机械自检：字数、编号、引用闭合、禁用词、与范文重合度。"""
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD = os.path.join(ROOT, "thesis", "final", "论文终稿.md")
REF = os.path.join(ROOT, "output", "ref_pdf_text.txt")
OUT = os.path.join(ROOT, "thesis", "reports", "自检报告.md")

BANNED = ["赋能", "闭环", "多维度", "深度融合", "极大地", "显著提升", "至关重要",
          "不可忽视", "在当今社会", "随着", "综上所述", "我们"]
CROSSTERM = ["社区", "邻里", "互助任务", "积分排行榜", "动态分享", "私信"]
ALIAS = ["教室", "打卡", "爽约", "坐位", "时间段", "阅览室"]


def cn_len(text):
    return len(re.findall(r"[\u4e00-\u9fa5]", text))


def norm(text):
    return re.sub(r"[^\u4e00-\u9fa5]", "", text)


def main():
    text = open(MD, encoding="utf-8").read()
    lines = text.split("\n")

    chapters, cur, buf = [], "前置", []
    for line in lines:
        if line.startswith("# "):
            chapters.append((cur, "\n".join(buf)))
            cur, buf = line[2:].strip(), []
        else:
            buf.append(line)
    chapters.append((cur, "\n".join(buf)))

    report = ["# 自检报告", ""]
    report.append(f"- 全文汉字数：{cn_len(text)}")
    report.append("")
    report.append("## 分章字数")
    report.append("")
    report.append("| 章节 | 汉字数 |")
    report.append("| --- | --- |")
    for name, body in chapters:
        report.append(f"| {name} | {cn_len(body)} |")

    # 图表编号
    def scan(kind, prefix):
        caps, refs = {}, {}
        for name, body in chapters:
            for line in body.split("\n"):
                s = line.strip()
                m = re.match(rf"^{prefix} (\d+)-(\d+)", s)
                if m:
                    key = (int(m.group(1)), int(m.group(2)))
                    caps.setdefault(key, []).append(name)
                    continue
                for m in re.finditer(rf"{prefix} ?(\d+)-(\d+)", s):
                    key = (int(m.group(1)), int(m.group(2)))
                    refs[key] = refs.get(key, 0) + 1
        return caps, refs

    problems = []
    hints = []
    for kind, prefix in (("图", "图"), ("表", "表"), ("代码", "代码")):
        caps, refs = scan(kind, prefix)
        by_ch = {}
        for (ch, no) in caps:
            by_ch.setdefault(ch, []).append(no)
        for ch, nums in sorted(by_ch.items()):
            expect = list(range(1, max(nums) + 1))
            if sorted(nums) != expect:
                missing = sorted(set(expect) - set(nums))
                problems.append(f"{kind} {ch}-x 缺号：{missing}")
        dup = [k for k, v in caps.items() if len(v) > 1]
        if dup:
            problems.append(f"{kind} 重复编号：{dup}")
        unreferenced = [k for k in caps if k not in refs]
        if unreferenced:
            msg = f"{kind} 未被正文引用：{sorted(unreferenced)}"
            (problems if kind == "图" else hints).append(msg)

    # 引用闭合
    cited = set()
    for m in re.finditer(r"<sup>(.*?)</sup>", text):
        for num in re.findall(r"\[(\d+)\]", m.group(1)):
            cited.add(int(num))
    refs_list = re.findall(r"^\[(\d+)\]", text, re.M)
    listed = {int(x) for x in refs_list}
    if cited - listed:
        problems.append(f"正文引用但文末缺失：{sorted(cited - listed)}")
    if listed - cited:
        problems.append(f"文末列出但正文未引：{sorted(listed - cited)}")

    # 禁用词
    banned_hits = {}
    for w in BANNED + CROSSTERM + ALIAS:
        c = text.count(w)
        if c:
            banned_hits[w] = c

    # 与范文重合（13 字）：只比较正文散文，排除标题、表格、题注与参考文献
    prose = []
    in_refs = False
    for line in lines:
        s = line.strip()
        if s.startswith("# "):
            in_refs = s[2:].strip() == "参考文献"
            continue
        if in_refs or not s:
            continue
        if s.startswith(("#", "|", "![", "图 ", "表 ", "代码 ", "```")):
            continue
        prose.append(s)
    ref_text = norm(open(REF, encoding="utf-8").read())
    cur_text = norm("".join(prose))
    k = 13
    ref_grams = {ref_text[i:i + k] for i in range(len(ref_text) - k)}
    hits = []
    seen = set()
    for i in range(len(cur_text) - k):
        g = cur_text[i:i + k]
        if g in ref_grams and g not in seen:
            seen.add(g)
            hits.append(g)

    report += ["", "## 编号与引用检查", ""]
    report += [f"- {p}" for p in problems] if problems else ["- 图编号连续、无重号，且均被正文引用"]
    if hints:
        report += ["", "### 提示（结构性引入，不计为缺陷）", ""]
        report += [f"- {h}" for h in hints]
    report += ["", "## 文献闭合", "",
               f"- 正文引用编号：{len(cited)} 个",
               f"- 文末列出条目：{len(listed)} 条"]

    report += ["", "## 禁用词与串题词", ""]
    if banned_hits:
        for w, c in sorted(banned_hits.items(), key=lambda x: -x[1]):
            report.append(f"- {w}：{c} 次")
    else:
        report.append("- 未命中")

    report += ["", "## 与范文的 13 字重合", "",
               f"- 重合片段数：{len(hits)}",
               ""]
    for g in hits[:30]:
        report.append(f"  - `{g}`")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fp:
        fp.write("\n".join(report) + "\n")

    print("\n".join(report[:40]))
    print("\nproblems:", len(problems), "| overlap:", len(hits), "| listed:", len(listed), "| cited:", len(cited))


if __name__ == "__main__":
    main()
