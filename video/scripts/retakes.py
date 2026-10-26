#!/usr/bin/env python3
"""Splice re-recorded rows into the cut: row id -> file -> trim, level, place.

  python3 -I video/scripts/retakes.py --take PATH/caseclerk-owner-take1.m4a [--ffmpeg PATH]
                                      [--transcribe PATH/run-hf.sh] [--force]

Every retake-<ID>.m4a beside the take whose ID is a row of edit.json is that row's sentence,
read again (one sentence a file). For each:

- Trim: the sentence runs from the first to the last 10 ms frame above -45 dBFS, searched from
  0.35 s before the transcript's first word to 0.3 s after its last, as take 1 was cut.
  The transcript is asr-<ID>/transcript.json beside the file; --transcribe makes it if it's missing.
- Level: through audio.retakeEq (the retakes' tone against take 1's), the gain that brings the
  sentence to take 1's integrated loudness. mix.py applies the same EQ and gain.
- Place: the row keeps its start, except a line's next sentence (N26b after N26a), which starts
  PAUSE after the sentence before it ends. The row then lasts as long as its sentence. If that
  runs into the next line (which starts 0.3 s after, at the least) the sentence is sped up, at most
  5% (mix.py's atempo keeps the pitch); past that the script stops and changes nothing.
- Text: the written line (the row's "script", when it kept one), as a retake reads the script.
  The transcript is printed beside it: where it differs, check by ear and caption what is said.

Writes the row's take, source, sourceSha, gainDb, tempo (only when not 1), start, end and text
into edit.json, and out/audio/retakes.json. A row whose file hasn't changed (same sha256) is
left alone, so hand edits stay and the next retakes drop in with one rerun; --force redoes all.
"""
import argparse
import array
import hashlib
import json
import math
import os
import re
import subprocess
import sys

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(SCRIPTS)
TH = -45.0  # dBFS, a 10 ms frame counts as voice above this (as for take 1)
PAUSE = 0.45  # between a line's sentences when they come from separate files (take 1: 0.44-0.66)
GAP = 0.3  # build.py's least gap between lines
MAX_TEMPO = 1.05


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def envelope(ff, path):
    p = subprocess.run([ff, "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                       capture_output=True, check=True)
    x = array.array("h")
    x.frombytes(p.stdout[: len(p.stdout) // 2 * 2])
    hop = 160
    return [10 * math.log10(sum(v * v for v in x[i:i + hop]) / hop / 32768 ** 2 + 1e-12)
            for i in range(0, len(x) - hop, hop)]


def lufs(ff, path, af="", span=None):
    cut = ["-ss", f"{span[0]:.3f}", "-t", f"{span[1] - span[0]:.3f}"] if span else []
    chain = "pan=mono|c0=0.5*c0+0.5*c1," + (af + "," if af else "") + "ebur128=framelog=quiet"
    err = subprocess.run([ff, "-hide_banner", "-nostdin"] + cut + ["-i", path, "-af", chain, "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return float(re.search(r"I:\s+(-?[\d.]+)", err[err.rfind("Summary:"):]).group(1))


def words(path):
    with open(path) as f:
        d = json.load(f)
    return d if isinstance(d, list) else d["words"]


def norm(text):
    """Letters and digits only, so "Case Clerk." matches "CaseClerk." and punctuation doesn't count."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def sibling(l):
    return l["id"][-1].isalpha() and l["id"][-1] != "a"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--take", required=True)
    ap.add_argument("--ffmpeg", default="ffmpeg")
    ap.add_argument("--transcribe")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    ff, here = args.ffmpeg, os.path.dirname(os.path.abspath(args.take))
    path = os.path.join(VIDEO, "edit.json")
    with open(path) as f:
        edit = json.load(f)
    eq = edit["audio"]["retakeEq"]
    lines = [(b, l) for b in edit["beats"] for l in b["lines"]]
    found = {m.group(1): os.path.join(here, n) for n in sorted(os.listdir(here))
             if (m := re.fullmatch(r"retake-(N\d\d[a-z]?)\.m4a", n))}
    ids = {l["id"] for _, l in lines}
    for rid in sorted(set(found) - ids):
        print(f"skip {os.path.basename(found[rid])}: no row {rid}")
    todo = {}
    for rid, f in found.items():
        if rid not in ids:
            continue
        h = sha(f)[:12]
        row = next(l for _, l in lines if l["id"] == rid)
        if row.get("sourceSha") == h and not args.force:
            print(f"keep {rid}: {os.path.basename(f)} unchanged ({h})")
            continue
        todo[rid] = (f, h)
    if not todo:
        return
    target = lufs(ff, args.take)
    report, errs = [], []
    for i, (b, l) in enumerate(lines):
        if l["id"] not in todo:
            continue
        f, h = todo[l["id"]]
        asr = os.path.join(here, f"asr-{l['id']}", "transcript.json")
        if not os.path.exists(asr) and args.transcribe:
            subprocess.run([args.transcribe, "transcribe", f, "--engine", "parakeet", "--language", "en", "--json",
                            "-d", os.path.dirname(asr)], check=True, capture_output=True)
        ws = words(asr) if os.path.exists(asr) else []
        env = envelope(ff, f)
        lo = max(0, round((ws[0]["start"] - 0.35) * 100)) if ws else 0
        hi = min(len(env) - 1, round((ws[-1]["end"] + 0.3) * 100)) if ws else len(env) - 1
        loud = [k for k in range(lo, hi + 1) if env[k] > TH]
        a, z = loud[0] / 100, (loud[-1] + 1) / 100
        gain = round(target - lufs(ff, f, eq, (a, z)), 1)
        dur = z - a
        prev = lines[i - 1][1] if i else None
        nxt = lines[i + 1][1] if i + 1 < len(lines) else None
        start = l["start"]
        if sibling(l) and prev and "take" in prev:
            voiced = (prev["take"][1] - prev["take"][0]) / prev.get("tempo", 1)
            start = max(start, round(prev["start"] + voiced + PAUSE, 2))
        if nxt and sibling(nxt) and nxt["id"] not in todo:
            limit = nxt["start"]
        elif nxt and sibling(nxt):
            limit = b["end"]
        else:
            limit = min(b["end"], nxt["start"] - GAP if nxt else edit["duration"])
        tempo = 1.0 if dur <= limit - start + 1e-6 else round(dur / (limit - start), 3)
        if tempo > MAX_TEMPO:
            errs.append(f"{l['id']}: the sentence lasts {dur:.2f} s and has {limit - start:.2f} s; "
                        f"it would need {100 * (tempo - 1):.1f}% faster (at most 5%)")
            continue
        if sibling(l) and prev:
            prev["end"] = start
        script = l.pop("script", None)
        heard = " ".join(w["text"] for w in ws)
        new = {"start": start, "end": nxt["start"] if nxt and sibling(nxt) and nxt["id"] not in todo
               else round(start + dur / tempo, 2),
               "take": [a, z], "source": os.path.basename(f), "sourceSha": h, "gainDb": gain,
               "text": script or l["text"]}
        l.pop("tempo", None)
        l.update(new)
        if tempo != 1.0:
            l["tempo"] = tempo
        same = norm(heard) == norm(l["text"])
        report.append({"id": l["id"], "file": os.path.basename(f), "sha": h, "take": [a, z], "secs": round(dur, 2),
                       "gainDb": gain, "tempo": tempo, "start": start, "end": l["end"], "text": l["text"],
                       "heard": heard, "matches": same})
    if errs:
        sys.exit("\n".join("ERROR " + e for e in errs) + "\nedit.json not changed")
    order = ["id", "start", "end", "take", "source", "sourceSha", "gainDb", "tempo", "text", "script"]
    for b in edit["beats"]:
        b["lines"] = [{k: l[k] for k in order if k in l} | {k: v for k, v in l.items() if k not in order}
                      for l in b["lines"]]
    with open(path, "w") as f:
        json.dump(edit, f, indent=1, ensure_ascii=False)
        f.write("\n")
    out = os.path.join(VIDEO, "out", "audio")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "retakes.json"), "w") as f:
        json.dump({"takeLufs": target, "retakeEq": eq, "rows": report}, f, indent=1, ensure_ascii=False)
    for r in report:
        flag = "" if r["matches"] else "   CHECK: the transcript differs"
        print(f"{r['id']:5} {r['file']} take {r['take'][0]:.2f}-{r['take'][1]:.2f} ({r['secs']:.2f} s) gain {r['gainDb']:+.1f} dB "
              f"tempo {r['tempo']:g} at {r['start']:.2f}-{r['end']:.2f}{flag}\n      line:  {r['text']}\n      heard: {r['heard']}")
    print(f"take 1 at {target} LUFS; wrote edit.json and out/audio/retakes.json")


if __name__ == "__main__":
    main()
