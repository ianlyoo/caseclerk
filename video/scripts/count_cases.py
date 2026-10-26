#!/usr/bin/env python3
"""Count the documented sandbox chargebacks that ran the whole loop, from the live data.

N24 carries no number; the film shows this count instead. Run it right before a render:
it reads the case ids in docs/REAL-CASES.md, GETs each one from production (read-only),
and writes video/live/real-cases.json, which build.py puts on screen.

A case counts when production shows all of:
  - the case resolved, and PayPal's dispute RESOLVED;
  - CaseClerk's provide_evidence action executed (the answer was filed);
  - money from PayPal's own fund movements with a kept amount above zero (the hold released).

  python3 -I video/scripts/count_cases.py
"""
import datetime
import json
import os
import re
import urllib.request

VIDEO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(VIDEO)
API = "https://caseclerk.vercel.app/api/cases/"


def get(case_id):
    req = urllib.request.Request(API + case_id, method="GET", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    with open(os.path.join(ROOT, "docs", "REAL-CASES.md")) as f:
        ids = sorted(set(re.findall(r"PP-R-[A-Z]{3}-\d{8}", f.read())))
    counted, left_out = [], []
    for cid in ids:
        d = get(cid)
        case, money = d["case"], d.get("money") or {}
        filed = any(a["kind"] == "provide_evidence" and a["status"] == "executed" for a in d.get("actions") or [])
        kept = (money.get("kept") or {}).get("value")
        ok = (case["status"] == "resolved" and case["snapshot"]["status"] == "RESOLVED" and filed
              and money.get("source") == "paypal_fund_movements" and kept and float(kept) > 0)
        row = {"id": cid, "amount": case["snapshot"]["amount"]["value"], "status": case["status"],
               "filed": filed, "kept": kept}
        (counted if ok else left_out).append(row)
    out = {
        "about": "N24's on-screen count. Written by scripts/count_cases.py from production GETs; "
                 "only the ids documented in docs/REAL-CASES.md are read.",
        "readAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(counted),
        "counted": counted,
        "leftOut": left_out,
    }
    os.makedirs(os.path.join(VIDEO, "live"), exist_ok=True)
    with open(os.path.join(VIDEO, "live", "real-cases.json"), "w") as f:
        json.dump(out, f, indent=1)
        f.write("\n")
    print(f"{len(counted)} of {len(ids)} documented cases ran the loop and were kept ({out['readAt']})")
    for r in left_out:
        print(f"  left out {r['id']}: {r['status']}, filed {r['filed']}, kept {r['kept']}")


if __name__ == "__main__":
    main()
