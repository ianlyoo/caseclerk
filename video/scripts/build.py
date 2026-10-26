#!/usr/bin/env python3
"""Build the CaseClerk film from video/edit.json.

Writes index.html, compositions/captions.html, compositions/overlays.html and
captions.srt/.vtt, and refuses to write anything if the cut breaks a rule: beats
and shots that don't tile the film, lines that overlap or run faster than maxWps
(counted in spoken words, so "$388.18" is seven), a row that isn't one whole
sentence, shots past their source, or a camera that would show past the frame's edge.

Each row of "lines" is one sentence and gets one caption. A line of two sentences
is two rows, N01a and N01b, that abut; the gap rule applies between lines.

Overlay text may say {count}: the number of documented sandbox chargebacks that ran
the whole loop, from video/live/real-cases.json (write it with scripts/count_cases.py
right before a render).

  python3 -I video/scripts/build.py           # check, then write
  python3 -I video/scripts/build.py --check   # check only, print the table
  python3 -I video/scripts/build.py --md      # check, print the script's tables

A beat with "skip": true is dropped and everything after it moves earlier by
its length (the judge-loop slot, B5J, if that control doesn't ship).
"""
import copy
import html
import json
import os
import re
import sys
import wave

VIDEO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPS = 1e-6
SENTENCE_BREAK = re.compile(r"(?<=[.?!])\s+(?=[A-Z])")
# a caption longer than this (about 1,450 px at 40 px) is set on two lines
WRAP_AT = 84
# a caption's first line never ends on one of these
WEAK_END = {"a", "an", "the", "to", "of", "and", "or", "its", "with", "on", "in", "for", "at", "by"}


def fmt(t):
    return f"{t:.3f}".rstrip("0").rstrip(".") if t % 1 else str(int(t))


def spoken_words(text, spoken):
    for written, said in sorted(spoken.items(), key=lambda kv: -len(kv[0])):
        text = re.sub(r"(?<![A-Za-z0-9])" + re.escape(written) + r"(?![A-Za-z0-9])", said, text)
    return len([w for w in re.split(r"\s+", text) if re.search(r"[A-Za-z0-9]", w)])


def drop_skipped(edit):
    """Remove beats marked skip and pull everything after each one earlier."""
    edit = copy.deepcopy(edit)
    for beat in [b for b in edit["beats"] if b.get("skip")]:
        cut_at, length = beat["start"], beat["end"] - beat["start"]

        def move(t):
            return t - length if t >= beat["end"] - EPS else t

        edit["beats"].remove(beat)
        for b in edit["beats"]:
            b["start"], b["end"] = move(b["start"]), move(b["end"])
            for s in b["shots"]:
                s["start"], s["end"] = move(s["start"]), move(s["end"])
                for k in s.get("cam", []):
                    k[0] = move(k[0])
            for l in b["lines"]:
                l["start"], l["end"] = move(l["start"]), move(l["end"])
        keep = lambda x, a, z: not (a > cut_at - EPS and z < beat["end"] + EPS)
        edit["overlays"] = [dict(o, start=move(o["start"]), end=move(o["end"]))
                            for o in edit["overlays"] if keep(o, o["start"], o["end"])]
        edit["cues"] = [dict(c, at=move(c["at"])) for c in edit["cues"]
                        if keep(c, c["at"], c["at"])]
        edit["duration"] -= length
    return edit


def check(edit):
    errs, rows = [], []
    W, H, spoken = edit["width"], edit["height"], edit["spoken"]
    t = 0.0
    last_line_end, last_id = 0.0, ""
    for b in edit["beats"]:
        if abs(b["start"] - t) > EPS:
            errs.append(f"{b['id']} starts at {b['start']}, the film is at {t}")
        st = b["start"]
        for s in b["shots"]:
            if abs(s["start"] - st) > EPS:
                errs.append(f"{b['id']}/{s['id']} starts at {s['start']}, the beat is at {st}")
            st = s["end"]
            if "src" in s:
                src = edit["sources"][s["src"]]
                out = s["in"] + s["end"] - s["start"]
                if s["in"] < 0 or out > src["dur"] + EPS:
                    errs.append(f"{s['id']} reads {s['src']} {s['in']}..{out:.2f}, the clip is {src['dur']} s")
            for k in s.get("cam", []):
                at, sc, x, y, mv = k
                if not (s["start"] - EPS <= at and at + mv <= s["end"] + EPS):
                    errs.append(f"{s['id']} camera key at {at} (+{mv}) is outside the shot")
                if not (W - W * sc - EPS <= x <= EPS and H - H * sc - EPS <= y <= EPS):
                    errs.append(f"{s['id']} camera at {at} shows past the frame: scale {sc}, x {x}, y {y}")
            if s.get("cam") and abs(s["cam"][0][0] - s["start"]) > EPS:
                errs.append(f"{s['id']} camera must be set at the shot's start")
            for k in s.get("window", []):
                at, top, right, bottom, left, mv = k
                if not (s["start"] - EPS <= at and at + mv <= s["end"] + EPS):
                    errs.append(f"{s['id']} window key at {at} (+{mv}) is outside the shot")
                if min(top, right, bottom, left) < 0 or top + bottom >= H or left + right >= W:
                    errs.append(f"{s['id']} window at {at} leaves nothing to see")
            if s.get("window") and abs(s["window"][0][0] - s["start"]) > EPS:
                errs.append(f"{s['id']} window must be set at the shot's start")
        if abs(st - b["end"]) > EPS:
            errs.append(f"{b['id']} shots end at {st}, the beat at {b['end']}")
        t = b["end"]
        for l in b["lines"]:
            if l["start"] < b["start"] - EPS or l["end"] > b["end"] + EPS:
                errs.append(f"{l['id']} {l['start']}-{l['end']} is outside {b['id']}")
            if not re.fullmatch(r"N\d\d[a-z]?", l["id"]):
                errs.append(f"{l['id']} isn't a line id (N01, or N01a for a line's sentences)")
            if SENTENCE_BREAK.search(l["text"]) or not re.search(r"[.?!]$", l["text"]):
                errs.append(f"{l['id']} isn't one whole sentence: {l['text']}")
            if "cap" in l:
                errs.append(f"{l['id']} has a cap; a row is one caption now")
            if max(len(x) for x in caption_lines(l["text"])) > WRAP_AT:
                errs.append(f"{l['id']} is too long for a two-line caption")
            sibling = l["id"][-1].isalpha() and l["id"][-1] != "a"
            if sibling and (last_id[:3] != l["id"][:3] or ord(last_id[-1]) + 1 != ord(l["id"][-1])):
                errs.append(f"{l['id']} doesn't follow {l['id'][:3]}{chr(ord(l['id'][-1]) - 1)}")
            if sibling and abs(l["start"] - last_line_end) > EPS:
                errs.append(f"{l['id']} starts at {l['start']}; it continues a line that ended at {last_line_end}")
            if not sibling and l["start"] < last_line_end + 0.3 - EPS:
                errs.append(f"{l['id']} starts {l['start'] - last_line_end:.2f} s after the last line; leave 0.3 s")
            last_line_end, last_id = l["end"], l["id"]
            secs = l["end"] - l["start"]
            words = spoken_words(l["text"], spoken)
            wps = words / secs
            if wps > edit["maxWps"] + EPS:
                errs.append(f"{l['id']} is {wps:.2f} words a second ({words} in {secs:.1f} s)")
            rows.append((b["id"], l["id"], l["start"], l["end"], secs, words, wps, l["text"]))
    if abs(t - edit["duration"]) > EPS:
        errs.append(f"beats end at {t}, the film is {edit['duration']}")
    if edit["duration"] > 175:
        errs.append(f"the film is {edit['duration']} s; the ceiling is 175")
    for o in edit["overlays"]:
        if not (0 <= o["start"] < o["end"] <= edit["duration"] + EPS):
            errs.append(f"overlay {o['id']} {o['start']}-{o['end']} is outside the film")
    for c in edit["cues"]:
        if not os.path.exists(os.path.join(VIDEO, "assets", "sfx", c["sound"] + ".wav")):
            errs.append(f"cue {c['id']} has no assets/sfx/{c['sound']}.wav")
    return errs, rows


def caption_times(edit):
    """One caption per row (one sentence): (row, on, off) on the film clock, for every row.

    A caption opens 0.1 s before its row. When the next row is the same line's next
    sentence it hands over at the row's end; otherwise it may hang 0.25 s, but never
    into the next line or past its beat's last frame."""
    rows = [l for b in edit["beats"] for l in b["lines"]]
    beat_end = {l["id"]: b["end"] for b in edit["beats"] for l in b["lines"]}
    out = []
    for i, l in enumerate(rows):
        nxt = rows[i + 1] if i + 1 < len(rows) else None
        a = l["start"] if l["id"][-1].isalpha() and l["id"][-1] != "a" else l["start"] - 0.1
        if nxt and nxt["id"][:3] == l["id"][:3]:
            z = l["end"]
        else:
            z = min(l["end"] + 0.25, (nxt["start"] if nxt else edit["duration"]) - 0.1, beat_end[l["id"]])
        out.append((l, round(a, 3), round(z, 3)))
    return out


def caption_lines(text):
    """One line, or two balanced lines broken between words (never after a weak word)."""
    if len(text) <= WRAP_AT:
        return [text]
    words = text.split(" ")
    best = None
    for i in range(1, len(words)):
        if words[i - 1].lower() in WEAK_END:
            continue
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if best is None or max(len(a), len(b)) < max(len(x) for x in best):
            best = [a, b]
    return best


def stamp(t, sep):
    ms = round(t * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}{sep}{ms % 1000:03}"


def write_subtitles(edit):
    """captions.srt and captions.vtt: the same sentence captions, on the same clock (N26 too)."""
    cues = caption_times(edit)
    srt = "".join(f"{i}\n{stamp(a, ',')} --> {stamp(z, ',')}\n{l['text']}\n\n"
                  for i, (l, a, z) in enumerate(cues, 1))
    vtt = "WEBVTT\n\n" + "".join(f"{l['id']}\n{stamp(a, '.')} --> {stamp(z, '.')}\n{l['text']}\n\n"
                                  for l, a, z in cues)
    for name, text in (("captions.srt", srt), ("captions.vtt", vtt)):
        with open(os.path.join(VIDEO, name), "w") as f:
            f.write(text.rstrip("\n") + "\n")
    return cues


def esc(s):
    return html.escape(s, quote=True)


FONT = ("@font-face{font-family:Archivo;src:url('assets/fonts/Archivo.ttf') format('truetype');"
        "font-weight:100 900;font-stretch:62% 125%;font-display:block;}")


def write_captions(edit):
    # N26 is on the end card itself, so it has no burned caption (it is in the .srt/.vtt)
    groups = [(f"cap-{l['id'].lower()}", l["id"], l["text"], a, z)
              for l, a, z in caption_times(edit) if not l.get("captionOnCard")]
    divs = "\n".join(
        f'    <div id="{gid}" class="cap" data-line="{lid}"><span>{"<br>".join(esc(t) for t in caption_lines(text))}</span></div>'
        for gid, lid, text, a, z in groups)
    times = ",\n      ".join(f'["{gid}", {fmt(a)}, {fmt(z)}]' for gid, _, _, a, z in groups)
    doc = f"""<!-- Generated by scripts/build.py from edit.json. Edit the lines there, not here. -->
<template>
  <style>
    {FONT}
    #root {{ position: absolute; inset: 0; }}
    .cap {{ position: absolute; left: 0; right: 0; bottom: 112px; text-align: center; opacity: 0; visibility: hidden; }}
    .cap span {{
      display: inline-block; white-space: nowrap;
      padding: 9px 22px 11px; background: rgba(21, 21, 20, 0.92); color: #f2f1ec;
      font-family: Archivo; font-size: 40px; font-weight: 500; line-height: 1.2; letter-spacing: -0.2px;
      font-feature-settings: "tnum"; font-variation-settings: "wdth" 100;
    }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{edit['width']}" data-height="{edit['height']}">
{divs}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    [
      {times}
    ].forEach(([id, a, z]) => {{
      const el = "#" + id;
      tl.set(el, {{ visibility: "visible" }}, a);
      tl.fromTo(el, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "power1.out" }}, a);
      tl.to(el, {{ opacity: 0, duration: 0.1, ease: "power2.in" }}, z - 0.1);
      tl.set(el, {{ opacity: 0, visibility: "hidden" }}, z);
    }});
    window.__timelines["captions"] = tl;
  </script>
</template>
"""
    with open(os.path.join(VIDEO, "compositions", "captions.html"), "w") as f:
        f.write(doc)
    return groups


OVERLAY_STYLE = {
    # where each note sits; every one is clear of the caption band and of the UI it is about
    "ov-wait": "left:200px; top:300px;",
    "ov-standin": "left:200px; top:8px;",  # in the strip the headline crop leaves
    "ov-earlier": "left:200px; top:58px;",  # between the case's subtitle and its clock
    "ov-honest": "right:40px; top:300px;",  # over the Closed dates, clear of the rulings
}


def live_count():
    path = os.path.join(VIDEO, "live", "real-cases.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def fill(text, live):
    if "{count}" in text:
        if live is None:
            sys.exit("ERROR an overlay needs {count}: run scripts/count_cases.py first")
        text = text.replace("{count}", str(live["count"]))
    return text


def write_overlays(edit):
    items, tweens = [], []
    live = live_count()
    for o in edit["overlays"]:
        oid = o["id"]
        text, sub = fill(o["text"], live), fill(o["sub"], live)
        kind = {"ov-wait": "chip", "ov-earlier": "note one", "ov-standin": "note one"}.get(oid, "note")
        inner = (f'<div class="tag {kind}" id="{oid}-tag"><b>{esc(text)}</b>'
                 f'<small>{esc(sub)}</small></div>')
        items.append(
            f'    <div id="{oid}" class="clip ov" style="{OVERLAY_STYLE.get(oid, "left:200px; top:120px;")}" '
            f'data-start="{fmt(o["start"])}" data-duration="{fmt(round(o["end"] - o["start"], 3))}">{inner}</div>')
        a, z = o["start"], o["end"]
        tweens.append(f'tl.fromTo("#{oid}-tag", {{ opacity: 0, y: 14 }}, '
                      f'{{ opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }}, {fmt(a)});')
        tweens.append(f'tl.to("#{oid}-tag", {{ opacity: 0, duration: 0.2, ease: "power2.in" }}, {fmt(round(z - 0.25, 3))});')
    doc = f"""<!-- Generated by scripts/build.py from edit.json. Edit the overlays there, not here. -->
<template>
  <style>
    {FONT}
    #root {{ position: absolute; inset: 0; }}
    .ov {{ position: absolute; }}
    .tag {{ background: #151514; color: #f2f1ec; font-family: Archivo; font-feature-settings: "tnum"; border-top: 1px solid #0a0a09; }}
    .tag b {{ display: block; font-weight: 700; }}
    .tag small {{ display: block; color: #b6b5af; font-size: 28px; line-height: 1.3; font-weight: 400; }}
    .chip {{ padding: 22px 28px 26px; width: 420px; }}
    .chip b {{ font-size: 88px; line-height: 1; letter-spacing: -2px; font-variation-settings: "wdth" 115; margin-bottom: 14px; }}
    .note {{ padding: 16px 24px 20px; max-width: 760px; }}
    .note b {{ font-size: 30px; line-height: 1.2; margin-bottom: 4px; }}
    .one {{ display: flex; align-items: baseline; gap: 22px; white-space: nowrap; max-width: none; }}
    .one b {{ margin-bottom: 0; }}
    #ov-honest-tag {{ width: 440px; box-sizing: border-box; }}
  </style>
  <div id="root" data-composition-id="overlays" data-width="{edit['width']}" data-height="{edit['height']}">
{chr(10).join(items)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10) + "    ".join([""] + tweens)}
    window.__timelines["overlays"] = tl;
  </script>
</template>
"""
    with open(os.path.join(VIDEO, "compositions", "overlays.html"), "w") as f:
        f.write(doc)


def write_index(edit):
    W, H, D = edit["width"], edit["height"], edit["duration"]
    videos, scenes = [], []
    # the crop starts open; a window's fromTo must not paint its start before its own time
    cams = ['tl.set("#camwin", { clipPath: "inset(0px 0px 0px 0px)" }, 0);']
    prev = None
    for b in edit["beats"]:
        for s in b["shots"]:
            dur = fmt(round(s["end"] - s["start"], 3))
            if "window" in s:
                # crop the footage to a rectangle of the frame (a brand headline, or rows not talked about)
                was = None
                for at, *box, mv in s["window"]:
                    inset = '{ clipPath: "inset(' + " ".join(f"{v:g}px" for v in box) + ')" }'
                    if mv == 0 or was is None:
                        cams.append(f'tl.set("#camwin", {inset}, {fmt(at)});')
                    else:
                        cams.append(f'tl.fromTo("#camwin", {was}, {{ ...{inset}, duration: {mv}, ease: "power2.inOut", immediateRender: false }}, {fmt(at)});')
                    was = inset
                cams.append(f'tl.set("#camwin", {{ clipPath: "inset(0px 0px 0px 0px)" }}, {fmt(s["end"])});')
            if "src" in s:
                src = edit["sources"][s["src"]]
                videos.append(
                    f'      <video id="v-{s["id"]}" class="clip" data-start="{fmt(s["start"])}" data-duration="{dur}" '
                    f'data-media-start="{fmt(s["in"])}" data-track-index="1" src="{src["file"]}" muted playsinline></video>')
            else:
                sid = s["id"]
                scenes.append(
                    f'    <div id="{sid}" class="scene" data-composition-id="{sid}" data-composition-src="{s["scene"]}" '
                    f'data-start="{fmt(s["start"])}" data-duration="{dur}" data-track-index="2" data-track-kind="graphics" '
                    f'data-width="{W}" data-height="{H}"></div>')
            for at, sc, x, y, mv in s.get("cam", []):
                to = f'{{ scale: {sc}, x: {x}, y: {y} }}'
                if mv == 0 or prev is None:
                    cams.append(f'tl.set("#cam", {to}, {fmt(at)});')
                else:
                    cams.append(f'tl.fromTo("#cam", {prev}, {{ scale: {sc}, x: {x}, y: {y}, duration: {mv}, '
                                f'ease: "power2.inOut" }}, {fmt(at)});')
                prev = to
    audio = []
    for c in edit["cues"]:
        with wave.open(os.path.join(VIDEO, "assets", "sfx", c["sound"] + ".wav")) as w:
            length = round(w.getnframes() / w.getframerate(), 3)
        audio.append(f'    <audio id="{c["id"]}" class="clip" data-start="{fmt(c["at"])}" data-duration="{fmt(length)}" '
                     f'data-track-index="8" data-volume="{c["volume"]}" src="assets/sfx/{c["sound"]}.wav"></audio>')
    doc = f"""<!doctype html>
<!-- Generated by scripts/build.py from edit.json. Edit the cut there, not here. -->
<html lang="en">
<head>
<meta charset="utf-8">
<title>CaseClerk, demo film (cut A)</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
{FONT}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #dde0e3; }}
#root {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; }}
#backdrop {{ position: absolute; inset: 0; background: #dde0e3; }}
#camwin {{ position: absolute; inset: 0; z-index: 1; clip-path: inset(0px 0px 0px 0px); }}
#cam {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; transform-origin: 0 0; }}
#cam video {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: contain; }}
.scene {{ z-index: 2; }}
#overlays {{ z-index: 5; }}
#captions {{ z-index: 6; }}
</style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="{fmt(D)}" data-width="{W}" data-height="{H}" data-fps="{edit['fps']}">
    <div id="backdrop"></div>
    <div id="camwin">
    <div id="cam">
{chr(10).join(videos)}
    </div>
    </div>
{chr(10).join(scenes)}
    <div id="overlays" data-composition-id="overlays" data-composition-src="compositions/overlays.html" data-start="0" data-duration="{fmt(D)}" data-track-index="5" data-track-kind="graphics" data-width="{W}" data-height="{H}"></div>
    <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{fmt(D)}" data-track-index="6" data-track-kind="captions" data-width="{W}" data-height="{H}"></div>
{chr(10).join(audio)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10) + "    ".join([""] + cams)}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>
"""
    with open(os.path.join(VIDEO, "index.html"), "w") as f:
        f.write(doc)


def mmss(t):
    # a sentence split can fall between tenths (0:02.65); show it exactly
    s = t % 60
    return f"{int(t // 60)}:{s:05.2f}" if abs(round(t * 10) - t * 10) > EPS else f"{int(t // 60)}:{s:04.1f}"


def secs2(x):
    s = f"{x:.2f}"
    return s[:-1] if s.endswith("0") else s


def print_md(edit, rows):
    """The shot and line tables of docs/submission/video-script.md, from this cut."""
    print("| Beat | Shot | Film | Footage (in-point) | Camera |")
    print("|---|---|---|---|---|")
    for b in edit["beats"]:
        for s in b["shots"]:
            if "src" in s:
                src = edit["sources"][s["src"]]
                what = f"`{src['take']}` from {s['in']:g} s"
                cam = ", ".join(f"{k[1]:g}x" + (f" over {k[4]:g} s" if k[4] else "") for k in s["cam"])
                crops = []
                for _, t, r, bt, l, mv in s.get("window", []):
                    box = (f"x {l:g}–{edit['width'] - r:g}, " if l or r else "") + f"y {t:g}–{edit['height'] - bt:g}"
                    crops.append(box + (f" over {mv:g} s" if mv else ""))
                if crops:
                    cam += ", cropped to " + ", then ".join(crops)
            else:
                what, cam = f"`video/{s['scene']}`", "none"
            print(f"| {b['id']} | {s['id']} | {mmss(s['start'])}–{mmss(s['end'])} | {what} | {cam} |")
    print()
    print("| Id | Beat | Start–end | Secs | Words | wps | Line |")
    print("|---|---|---|---|---|---|---|")
    for beat, lid, a, z, secs, n, wps, text in rows:
        print(f"| {lid} | {beat} | {mmss(a)}–{mmss(z)} | {secs2(secs)} | {n} | {wps:.2f} | {text} |")


def main():
    with open(os.path.join(VIDEO, "edit.json")) as f:
        edit = drop_skipped(json.load(f))
    errs, rows = check(edit)
    if errs:
        print("\n".join("ERROR " + e for e in errs))
        sys.exit(1)
    if "--md" in sys.argv:
        print_md(edit, rows)
        return
    words = 0
    for beat, lid, a, z, secs, n, wps, text in rows:
        words += n
        print(f"{beat:4} {lid:4} {a:6.2f}-{z:6.2f} {secs:4.2f}s {n:3}w {wps:4.2f}  {text}")
    lines = len({r[1][:3] for r in rows})
    print(f"{len(rows)} sentences in {lines} lines, {words} spoken words, film {edit['duration']} s")
    if "--check" in sys.argv:
        return
    groups = write_captions(edit)
    cues = write_subtitles(edit)
    write_overlays(edit)
    write_index(edit)
    print(f"wrote index.html, compositions/captions.html ({len(groups)} captions), compositions/overlays.html, "
          f"captions.srt/.vtt ({len(cues)} cues)")


if __name__ == "__main__":
    main()
