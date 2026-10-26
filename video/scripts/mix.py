#!/usr/bin/env python3
"""Mix the film's one sound track from video/edit.json.

  python3 -I video/scripts/mix.py --take PATH/caseclerk-owner-take1.m4a [--ffmpeg PATH]

(after scripts/retakes.py, when there are retakes: their files sit beside the take)

Writes assets/audio/mix.wav (48 kHz stereo; index.html plays it from 0) and, under
out/audio/, the stems (voice, bed, cues), the bed's ducking curve and loudness.json.
None of it goes in git: the take and the mix carry the owner's voice.

- Narration: each voiced row's sentence is cut from the take at its "take" span, with a
  few ms of air that never reach the next sentence, and placed so that it starts at the
  row's start. A row with a "source" is cut from that retake instead, through audio.retakeEq
  and its gainDb (scripts/retakes.py sets both, to match take 1), and sped up by its "tempo"
  if it has one (at most 5%, atempo: no pitch change). Otherwise time shifts only. Then a light chain:
  high-pass 80 Hz, -3 dB at 150 Hz (the phone's proximity boom), +1.5 dB at 2.8 kHz,
  a -2 dB shelf from 8 kHz, a de-esser and gentle 2.5:1 compression (about 3 dB on the
  loudest words).
- Bed: synthesized here, so we own it outright. A slow vi-IV-I-V pad in D major
  (Bm9, Gmaj9, Dmaj9, A add9, 8 s a chord), soft felt-piano notes from each chord,
  a synthesized room, resolving to Dmaj9 on the end card. Unducked it sits at audio.bedLufs;
  under every spoken span it dips by audio.duckDb, which puts it about 20 dB under the voice,
  and audio.lifts raise it a little at the title's brand and on the end card, in the pauses only
  (a lift never rises under a word). It fades out over the end card's last seconds, after the last word.
- Cues: edit.json "cues", the CC0 recordings in assets/sfx/.
- Master: gain to audio.targetLufs integrated, then a limiter under audio.ceilingDbtp.

Needs an ffmpeg with aevalsrc, afir, deesser, amultiply, alimiter and ebur128.
"""
import argparse
import array
import json
import math
import os
import re
import subprocess
import sys

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(SCRIPTS)
sys.path.insert(0, SCRIPTS)
import build  # noqa: E402  (our own build.py: drop_skipped, so the mix and the picture share a clock)

SR = 48000
BED_SR = 16000  # the bed has nothing above 3.4 kHz before its low-pass; 48k only after
PRE, POST = 0.08, 0.15  # air kept before and after a sentence, when the take has it
SPEECH_GAP = 1.5  # the bed stays down through pauses shorter than this
DUCK_DOWN, DUCK_UP = 0.35, 1.0  # ramp times into and out of a duck (s)

# the bed: MIDI notes, low to high
CHORDS = {
    "Bm9": [47, 54, 62, 69, 73],
    "Gmaj9": [43, 50, 59, 66, 69],
    "Dmaj9": [50, 57, 64, 66, 73],
    "A add9": [45, 52, 59, 61, 64],
}
LOOP = ["Bm9", "Gmaj9", "Dmaj9", "A add9"]
END_CHORD = [38, 50, 57, 64, 66, 73]  # Dmaj9 with a low D, for the end card
PAD_GAINS = [1.0, 0.8, 0.62, 0.5, 0.42, 0.38]
XF = 1.6  # half the crossfade between chords (s)
# amix hands out frames without timestamps, and an atrim after it then cuts from the wrong place
# (it moved the whole voice 0.33 s early), so every mix is renumbered from its sample count
RESTAMP = "asetpts=N/SR/TB"


def run(ff, args, quiet=True):
    p = subprocess.run([ff, "-hide_banner", "-nostdin", "-y"] + args, capture_output=True, text=True)
    if p.returncode:
        sys.exit(f"ffmpeg failed: {' '.join(args)[:300]}\n{p.stderr[-2000:]}")
    return p.stderr


def loudness(ff, path):
    err = run(ff, ["-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"])
    tail = err[err.rfind("Summary:"):]
    num = lambda key: float(re.search(key + r":\s+(-?[\d.]+|-inf)", tail).group(1).replace("-inf", "-200"))
    return {"I": num("I"), "LRA": num("LRA"), "TP": num("Peak")}


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pad_expr(notes, det, phase):
    """One channel of a chord: two detuned oscillators a note, soft harmonics, a slow swell."""
    terms = []
    for i, m in enumerate(notes):
        f, g = midi(m), PAD_GAINS[i] / len(notes)
        lfo = f"(1+0.12*sin(2*PI*{0.05 + 0.017 * i:.3f}*t+{phase + i:.2f}))"
        osc = []
        for k, d in ((1, det), (2, -det)):
            ff = f * (1 + d)
            ph = phase * k + i * 0.7
            osc.append(f"sin(2*PI*{ff:.4f}*t+{ph:.2f})+0.3*sin(2*PI*{2 * ff:.4f}*t+{ph * 1.3:.2f})+0.1*sin(2*PI*{3 * ff:.4f}*t)")
        terms.append(f"{g:.4f}*{lfo}*({'+'.join(osc)})/2")
    return "+".join(terms)


def pluck_expr(hits):
    """Felt-piano notes: [(time in the segment, MIDI note, velocity)]."""
    terms = []
    for at, m, v in hits:
        f = midi(m)
        T = f"(t-{at:.3f})"
        terms.append(
            f"if(between(t,{at:.3f},{at + 5.5:.3f}),{v:.3f}*(1-exp(-{T}/0.006))*("
            f"exp(-{T}/1.5)*sin(2*PI*{f:.4f}*{T})+0.22*exp(-{T}/0.6)*sin(2*PI*{2.003 * f:.4f}*{T})"
            f"+0.06*exp(-{T}/0.3)*sin(2*PI*{3.011 * f:.4f}*{T})),0)")
    return "+".join(terms) if terms else "0"


def bed_plan(duration, end_card):
    """[(start, end, notes, plucks)] on the film clock: 20 chords up to the end card, then the tonic."""
    n = 20
    step = end_card / n
    plan = []
    for k in range(n):
        name = LOOP[k % 4]
        notes = CHORDS[name]
        a = k * step
        # three soft notes a chord, from its upper voices; velocities vary so it doesn't tick
        plucks = [(a + 0.6, notes[3] + 12, 0.55 + 0.1 * ((k * 7) % 3)),
                  (a + 2.9, notes[4] + 12 if notes[4] < 72 else notes[4], 0.45),
                  (a + 5.3, notes[2] + 12, 0.5 + 0.08 * ((k * 5) % 3))]
        plan.append((a, a + step, notes, plucks, name))
    plucks = [(end_card + 0.35, 74, 0.6), (end_card + 1.6, 69, 0.45), (end_card + 3.2, 78, 0.4)]
    plan.append((end_card, duration + 0.5, END_CHORD, plucks, "Dmaj9 (end)"))
    return plan


def make_bed(ff, edit, out):
    D = edit["duration"]
    end_card = next(s["start"] for b in edit["beats"] for s in b["shots"] if s["id"] == "end")
    plan = bed_plan(D, end_card)
    inputs, chains, labels = [], [], []
    for i, (a, z, notes, plucks, _) in enumerate(plan):
        t0 = max(0.0, a - XF)
        length = z + XF - t0
        local = [(at - t0, m, v) for at, m, v in plucks]
        left = pad_expr(notes, 0.0016, 0.3 + i) + "+0.35*(" + pluck_expr(local) + ")"
        right = pad_expr(notes, -0.0021, 1.1 + i) + "+0.30*(" + pluck_expr([(at + 0.012, m, v) for at, m, v in local]) + ")"
        inputs += ["-f", "lavfi", "-i", f"aevalsrc=exprs='{left}|{right}':s={BED_SR}:d={length:.3f}:c=stereo"]
        fin = min(2 * XF, length / 2) if a > 0 else 0.01
        fout = min(2 * XF, length / 2)
        chains.append(f"[{i}:a]afade=t=in:d={fin:.3f}:curve=qsin,afade=t=out:st={length - fout:.3f}:d={fout:.3f}:curve=qsin,"
                      f"adelay=delays={round(t0 * BED_SR)}S:all=1[p{i}]")
        labels.append(f"[p{i}]")
    n = len(plan)
    # the room: 3.2 s of decaying stereo noise, darkened, as an impulse response
    # (each channel's expression keeps its own seed; the right one is reseeded so the room is wide)
    ir = ("aevalsrc=exprs='(2*random(0)-1)*exp(-t/0.55)*(1-exp(-t/0.004))|"
          "if(eq(n,0),st(1,7919));(2*random(1)-1)*exp(-t/0.55)*(1-exp(-t/0.004))'"
          f":s={SR}:d=3.2:c=stereo")
    inputs += ["-f", "lavfi", "-i", ir]
    graph = ";".join(chains) + ";" + "".join(labels) + (
        f"amix=inputs={n}:normalize=0:duration=longest,{RESTAMP},aresample={SR},{RESTAMP},atrim=0:{D},"
        f"highpass=f=60,lowpass=f=2600,"
        f"asplit[dry][wet0];[{n}:a]highpass=f=150,lowpass=f=3200[ir];[wet0][ir]afir[wet];"
        f"[dry][wet]amix=inputs=2:weights='1 0.6':normalize=0,{RESTAMP},atrim=0:{D}")
    raw = os.path.join(out, "bed-raw.wav")
    run(ff, inputs + ["-filter_complex", graph, "-c:a", "pcm_f32le", raw])
    return raw, plan


def said(l):
    """How long a voiced row's sentence lasts in the mix."""
    return (l["take"][1] - l["take"][0]) / l.get("tempo", 1.0)


def speech_spans(edit):
    spans = []
    for b in edit["beats"]:
        for l in b["lines"]:
            if "take" in l:
                spans.append([l["start"], l["start"] + said(l)])
    spans.sort()
    merged = []
    for a, z in spans:
        if merged and a - merged[-1][1] < SPEECH_GAP:
            merged[-1][1] = max(merged[-1][1], z)
        else:
            merged.append([a, z])
    return spans, merged


def ramp(x):
    """0 to 1, raised cosine."""
    x = min(1.0, max(0.0, x))
    return 0.5 - 0.5 * math.cos(math.pi * x)


def envelope(edit, merged, rate=1000):
    """The bed's gain on the film clock, linear, sampled at rate Hz."""
    au = edit["audio"]
    D = edit["duration"]
    n = int(D * rate) + 1
    duck = au["duckDb"]
    # the fade-out starts after the last word, and never before the film's last 3.7 s
    fade_at = max(D - 3.7, (merged[-1][1] + 0.15) if merged else 0.0)
    fade_len = max(1.0, D - 0.1 - fade_at)
    out = array.array("f")
    for i in range(n):
        t = i / rate
        lift = 0.0
        for a, z, g in au["lifts"]:
            up = ramp((t - a) / 0.8)
            down = 1.0 if z >= D - 1e-6 else 1 - ramp((t - (z - 0.8)) / 0.8)
            lift += g * min(up, down)
        depth = 0.0
        for a, z in merged:
            s0, e0 = a - 0.12, z + 0.15
            if s0 - DUCK_DOWN <= t <= e0 + DUCK_UP:
                if t < s0:
                    depth = max(depth, ramp((t - (s0 - DUCK_DOWN)) / DUCK_DOWN))
                elif t <= e0:
                    depth = 1.0
                else:
                    depth = max(depth, 1 - ramp((t - e0) / DUCK_UP))
        db = lift * (1 - depth) + duck * depth  # a lift only where the bed isn't ducked
        gain = 10 ** (db / 20)
        gain *= ramp(t / 0.6)  # in from silence
        gain *= 1 - ramp((t - fade_at) / fade_len)  # out over the end card's last seconds
        out.append(gain)
    return out


def duration(ff, path):
    err = subprocess.run([ff, "-hide_banner", "-nostdin", "-i", path], capture_output=True, text=True).stderr
    h, m, sec = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).groups()
    return int(h) * 3600 + int(m) * 60 + float(sec)


def voice(ff, edit, take, out):
    rows = [l for b in edit["beats"] for l in b["lines"] if "take" in l]
    here = os.path.dirname(os.path.abspath(take))
    sources = [None] + sorted({l["source"] for l in rows if "source" in l})
    eq = edit["audio"].get("retakeEq")
    D = edit["duration"]
    inputs, splits, chains, labels, plan = [], [], [], [], []
    k = 0
    for src in sources:
        path = take if src is None else os.path.join(here, src)
        mine = sorted((l for l in rows if l.get("source") == src), key=lambda l: l["take"][0])
        if not mine:
            continue
        inputs += ["-i", path]
        n_in = len(inputs) // 2 - 1
        file_end = duration(ff, path)
        first = k
        for j, l in enumerate(mine):
            a, z = l["take"]
            prev_z = mine[j - 1]["take"][1] if j else 0.0
            next_a = mine[j + 1]["take"][0] if j + 1 < len(mine) else z + 1
            pre = max(0.0, min(PRE, (a - prev_z) / 2))
            post = max(0.0, min(POST, (next_a - z) / 2, file_end - z - 0.01))
            tempo = l.get("tempo", 1.0)
            length = (z + post - (a - pre)) / tempo
            fin, fout = max(0.005, min(0.03, pre)), max(0.01, min(0.06, post + 0.02))
            delay = l["start"] - pre / tempo
            shape = (f"{eq}," if src and eq else "") + (f"volume={l['gainDb']}dB," if l.get("gainDb") else "") + \
                (f"atempo={tempo}," if tempo != 1.0 else "")
            chains.append(f"[s{k}]atrim=start={a - pre:.3f}:end={z + post:.3f},asetpts=PTS-STARTPTS,{shape}"
                          f"afade=t=in:d={fin:.3f},afade=t=out:st={length - fout:.3f}:d={fout:.3f},"
                          f"adelay=delays={round(delay * SR)}S:all=1[v{k}]")
            labels.append(f"[v{k}]")
            plan.append({"id": l["id"], "source": src or os.path.basename(take), "take": [a, z], "at": l["start"],
                         "shift": round(l["start"] - a, 3), "gainDb": l.get("gainDb", 0), "tempo": tempo})
            k += 1
        outs = "".join(f"[s{x}]" for x in range(first, k))
        splits.append(f"[{n_in}:a]pan=mono|c0=0.5*c0+0.5*c1,aresample={SR},asplit={k - first}{outs}")
    plan.sort(key=lambda p: p["at"])
    graph = (";".join(splits) + ";" + ";".join(chains) + ";" +
             "".join(labels) + f"amix=inputs={k}:normalize=0:duration=longest,{RESTAMP},apad=whole_dur={D},atrim=0:{D}")
    raw = os.path.join(out, "voice-raw.wav")
    run(ff, inputs + ["-filter_complex", graph, "-c:a", "pcm_f32le", raw])
    # the compressor's threshold is set for speech at -23 LUFS, so bring the take there first
    pre_gain = -23 - loudness(ff, raw)["I"]
    chain = (f"volume={pre_gain:.2f}dB,highpass=f=80:p=2,equalizer=f=150:t=q:w=0.9:g=-3,equalizer=f=2800:t=q:w=1.2:g=1.5,"
             "highshelf=f=8000:g=-2,deesser=i=0.45:m=0.5:f=0.5,"
             "acompressor=threshold=0.1:ratio=2.5:attack=1.5:release=150:knee=2.8:makeup=1,pan=stereo|c0=c0|c1=c0")
    chained = os.path.join(out, "voice-chain.wav")
    run(ff, ["-i", raw, "-af", chain, "-c:a", "pcm_f32le", chained])
    # how hard the compressor works: the same chain without it, loudness against loudness
    plain = chain.split(",acompressor=")[0] + ",pan=stereo|c0=c0|c1=c0"
    err = run(ff, ["-i", raw, "-af", plain + ",ebur128=framelog=quiet", "-f", "null", "-"])
    uncompressed = float(re.search(r"I:\s+(-?[\d.]+)", err[err.rfind("Summary:"):]).group(1))
    return chained, plan, round(uncompressed - loudness(ff, chained)["I"], 1)


def cues(ff, edit, out):
    D = edit["duration"]
    inputs, chains, labels = [], [], []
    for i, c in enumerate(edit["cues"]):
        inputs += ["-i", os.path.join(VIDEO, "assets", "sfx", c["sound"] + ".wav")]
        chains.append(f"[{i}:a]aresample={SR},pan=stereo|c0=c0|c1=c0,volume={c['volume']},"
                      f"adelay=delays={round(c['at'] * SR)}S:all=1[c{i}]")
        labels.append(f"[c{i}]")
    graph = ";".join(chains) + ";" + "".join(labels) + (
        f"amix=inputs={len(labels)}:normalize=0:duration=longest,{RESTAMP},apad=whole_dur={D},atrim=0:{D}")
    path = os.path.join(out, "cues.wav")
    run(ff, inputs + ["-filter_complex", graph, "-c:a", "pcm_f32le", path])
    return path


def rms_over(ff, path, spans, D, rate=8000):
    """RMS (dBFS, both channels) of a stereo stem inside and outside the given spans."""
    p = subprocess.run([ff, "-hide_banner", "-nostdin", "-i", path, "-ac", "2", "-ar", str(rate), "-f", "f32le", "-"],
                       capture_output=True)
    x = array.array("f")
    x.frombytes(p.stdout[: len(p.stdout) // 8 * 8])
    inside = bytearray(len(x) // 2)
    for a, z in spans:
        for i in range(max(0, int(a * rate)), min(len(inside), int(z * rate))):
            inside[i] = 1
    s_in = s_out = 0.0
    n_in = n_out = 0
    for i, v in enumerate(x):
        if inside[i // 2]:
            s_in += v * v
            n_in += 1
        else:
            s_out += v * v
            n_out += 1
    db = lambda s, n: round(10 * math.log10(s / n + 1e-20), 1) if n else None
    return db(s_in, n_in), db(s_out, n_out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--take", required=True)
    ap.add_argument("--ffmpeg", default="ffmpeg")
    args = ap.parse_args()
    ff = args.ffmpeg
    with open(os.path.join(VIDEO, "edit.json")) as f:
        edit = build.drop_skipped(json.load(f))
    errs, _ = build.check(edit)
    if errs:
        sys.exit("\n".join("ERROR " + e for e in errs))
    au, D = edit["audio"], edit["duration"]
    out = os.path.join(VIDEO, "out", "audio")
    os.makedirs(out, exist_ok=True)
    os.makedirs(os.path.dirname(os.path.join(VIDEO, au["mix"])), exist_ok=True)

    vchain, vplan, comp_db = voice(ff, edit, args.take, out)
    v_in = loudness(ff, vchain)
    v_gain = au["targetLufs"] - 0.5 - v_in["I"]
    vpath = os.path.join(out, "voice.wav")
    run(ff, ["-i", vchain, "-af", f"volume={v_gain:.2f}dB", "-c:a", "pcm_f32le", vpath])

    raw, plan = make_bed(ff, edit, out)
    b_in = loudness(ff, raw)
    spans, merged = speech_spans(edit)
    env = envelope(edit, merged)
    envf = os.path.join(out, "duck-1khz.f32")
    with open(envf, "wb") as f:
        env.tofile(f)
    bpath = os.path.join(out, "bed.wav")
    run(ff, ["-i", raw, "-f", "f32le", "-ar", "1000", "-ac", "1", "-i", envf, "-filter_complex",
             f"[0:a]volume={au['bedLufs'] - b_in['I']:.2f}dB[b];[1:a]aresample={SR},pan=stereo|c0=c0|c1=c0,"
             f"apad=whole_dur={D},atrim=0:{D}[e];[b][e]amultiply,atrim=0:{D}",
             "-c:a", "pcm_f32le", bpath])

    cpath = cues(ff, edit, out)

    summed = os.path.join(out, "sum.wav")
    run(ff, ["-i", vpath, "-i", bpath, "-i", cpath, "-filter_complex",
             f"amix=inputs=3:normalize=0:duration=longest,{RESTAMP},atrim=0:{D}", "-c:a", "pcm_f32le", summed])
    s_in = loudness(ff, summed)
    gain = au["targetLufs"] - s_in["I"]
    mix = os.path.join(VIDEO, au["mix"])
    # the AAC encode adds a few tenths of a dB of true peak, so the WAV keeps half a dB in hand
    limit = au["ceilingDbtp"] - 1.0
    for _ in range(4):
        run(ff, ["-i", summed, "-af",
                 f"volume={gain:.2f}dB,alimiter=limit={10 ** (limit / 20):.4f}:attack=3:release=60:level=0:latency=1,"
                 f"atrim=0:{D}", "-ar", str(SR), "-c:a", "pcm_s16le", mix])
        m = loudness(ff, mix)
        if m["TP"] <= au["ceilingDbtp"] - 0.5:
            break
        limit -= 0.5
    bed_speech, bed_gaps = rms_over(ff, bpath, spans, D)
    voice_speech, _ = rms_over(ff, vpath, spans, D)
    report = {
        "take": os.path.basename(args.take),
        "retakes": sorted({p["source"] for p in vplan if p["source"] != os.path.basename(args.take)}),
        "voiceChain": "high-pass 80 Hz; -3 dB at 150 Hz; +1.5 dB at 2.8 kHz; -2 dB shelf from 8 kHz; de-esser; 2.5:1 compression",
        "voiceBeforeGain": v_in, "voiceGainDb": round(v_gain, 2), "compressorAvgGrDb": comp_db,
        "bedRaw": b_in, "bedLufsTarget": au["bedLufs"],
        "voiceRmsInSpeechDb": voice_speech, "bedRmsUnderSpeechDb": bed_speech, "bedRmsInGapsDb": bed_gaps,
        "bedUnderVoiceDb": round(bed_speech - voice_speech, 1),
        "sumBeforeMaster": s_in, "masterGainDb": round(gain, 2), "limiterDbfs": round(limit, 2),
        "mix": m, "stems": {"voice": loudness(ff, vpath), "bed": loudness(ff, bpath), "cues": loudness(ff, cpath)},
        "placements": vplan,
        "bed": [{"from": round(a, 2), "to": round(z, 2), "chord": name} for a, z, _, _, name in plan],
        "speech": [[round(a, 2), round(z, 2)] for a, z in merged],
    }
    with open(os.path.join(out, "loudness.json"), "w") as f:
        json.dump(report, f, indent=1)
    print(json.dumps({k: report[k] for k in ("voiceBeforeGain", "compressorAvgGrDb", "bedRaw", "voiceRmsInSpeechDb", "bedRmsUnderSpeechDb",
                                             "bedRmsInGapsDb", "bedUnderVoiceDb",
                                             "sumBeforeMaster", "masterGainDb", "limiterDbfs", "mix", "stems")}, indent=1))
    print(f"wrote {au['mix']} ({D} s) and out/audio/")


if __name__ == "__main__":
    main()
