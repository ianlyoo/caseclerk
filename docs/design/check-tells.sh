#!/bin/bash
# Source checks for the slop tells (docs/design/TELLS.md). Run from the repo root: bash docs/design/check-tells.sh [deploy-url]
D=src/app/drafts
fail=0
check() { # name, expected-count, actual-count, note
  if [ "$3" -eq "$2" ]; then echo "PASS  $1 ($3)"; else echo "FAIL  $1 (found $3, expected $2) $4"; fail=1; fi
}
n() { grep -rEn --include='*.tsx' --include='*.ts' --include='*.css' "$@" $D | wc -l; }

check "T1 tracked caps: text-transform uppercase"            0 "$(n -i 'text-transform: *uppercase')"
check "T1 tracked caps: positive letter-spacing >= .05em"     0 "$(n 'letter-spacing: *(0?\.(0[5-9]|[1-9])|[1-9])')"
check "T2 hero filler words"                                  0 "$(n -i 'seamless|effortless|supercharge|powerful|revolution|AI-powered|let the agent|magic|unlock')"
check "T3 dashed drop zones"                                  0 "$(n 'dashed|dropzone|drop-zone')"
check "T4 middot meta strings"                                0 "$(n '·|&middot;|\\u00b7')"
check "T5 arrows on links"                                    0 "$(n '→|&rarr;|\\u2192|›|»|&raquo;')"
check "T6 letter avatars"                                     0 "$(n -i 'avatar|initials|charAt\(0\)')"
check "T7 fake charts (svg/canvas/sparkline/meter)"           0 "$(n -i '<svg|<canvas|sparkline|<progress|<meter')"
check "T9 underlined tabs"                                    0 "$(n 'text-decoration: *underline|border-bottom: *[23]px')"
check "T10 card shadows / rounded panels (radius >6px non-button)" 0 "$(grep -rEn 'border-radius: *([7-9]|[1-9][0-9])px' $D --include='*.css' | grep -v '999px' | wc -l)"
check "T11 bold weights in the UI (PDF page excluded)"        0 "$(grep -rEn 'font-weight: *(6|7|8|9)00|bold' $D --include='*.css' | grep -v pages.module.css | wc -l)"
check "T13 teal/cyan hex colours"                             0 "$(grep -rhoE '#[0-9a-fA-F]{6}\b' $D | sort -u | python3 -c '
import sys,colorsys
c=0
for h in sys.stdin.read().split():
    r,g,b=(int(h[i:i+2],16)/255 for i in (1,3,5)); hh,l,s=colorsys.rgb_to_hls(r,g,b)
    if 150<=hh*360<=200 and s>0.25: c+=1
print(c)')"
check "T14 placeholder data"                                  0 "$(n -i 'lorem|john doe|jane doe|acme|item [0-9]|example\.com|customer [0-9]')"
check "T14 dispute ids not PP-R-XXX-12345678"                 0 "$(grep -oE 'PP-R-[A-Z0-9]+-[0-9]+' $D/_data.ts | grep -vcE '^PP-R-[A-Z]{3}-[0-9]{8}$')"
check "T14 amounts without cents"                             0 "$(grep -oE 'amount: \"[^\"]+\"' $D/_data.ts | grep -vcE '\"[0-9]+\.[0-9]{2}\"')"
check "T14 reason codes outside PayPal's enum"                0 "$(grep -oE 'reason: \"[A-Z_]+\"' $D/_data.ts | grep -vcE 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED|MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED|UNAUTHORISED|CREDIT_NOT_PROCESSED|DUPLICATE_TRANSACTION|INCORRECT_AMOUNT|PAYMENT_BY_OTHER_MEANS|CANCELED_RECURRING_BILLING|PROBLEM_WITH_REMITTANCE|OTHER')"
check "T14 tracking numbers with a bad check digit"           0 "$(grep -oE 'tracking: \"[^\"]+\"' $D/_data.ts | cut -d'"' -f2 | python3 -c '
import sys
def ups(t):
    s=0
    for i,c in enumerate(t[2:17]):
        v=int(c) if c.isdigit() else (ord(c)-63)%10
        s+= v*2 if i%2 else v
    return (10-s%10)%10==int(t[17])
def s10(t):
    w=[8,6,4,2,3,5,9,7]; s=sum(int(d)*w[i] for i,d in enumerate(t[2:10])); c=11-s%11; c={10:0,11:5}.get(c,c); return c==int(t[10])
def usps(t):
    s=sum(int(d)*(3 if i%2==0 else 1) for i,d in enumerate(reversed(t[:-1]))); return (10-s%10)%10==int(t[-1])
def fedex(t):
    w=[1,3,7]; s=sum(int(d)*w[i%3] for i,d in enumerate(reversed(t[:-1]))); return s%11%10==int(t[-1])
bad=0
for t in sys.stdin.read().split():
    ok = ups(t) if t.startswith("1Z") else s10(t) if len(t)==13 else usps(t) if len(t)==22 else fedex(t) if len(t)==12 else False
    bad+= not ok
print(bad)')"
check "extra: emoji"                                          0 "$(grep -rnP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' $D | wc -l)"
check "extra: eyebrow numbering (01, 02 labels)"              0 "$(n '>0[1-9] ')"
check "T12 distinct grids: A uses 3-pane desk, B a margin column" 2 "$(( $(grep -c 'grid-template-columns: 17.5em minmax(0, 1fr) 31em' $D/a/a.module.css) + $(grep -c 'grid-template-columns: var(--m) var(--t) var(--r)' $D/b/b.module.css | awk '{print ($1>0)}') ))"
check "R2 no link to the /board spike from the drafts"         0 "$(n '/board')"
check "R2 no way back to Approve after sending"               0 "$(n 'Back to the proposal|Show the proposal again')"
check "R2 per-step cost column gone (cost(st.costUsd))"       0 "$(n 'cost\(st\.costUsd\)|tlCost')"
check "R2 A progress-meter lane bars and stats trio gone"     0 "$(n 'barHot|bar2|className=\{s\.totals\}')"
check "R2 B reason code breaks only at underscores (<wbr>)"   1 "$(grep -c '<wbr' $D/b/CaseView.tsx)"
check "R2 RESOLVED_WITH_PAYOUT reads 'PayPal covered it'"     1 "$(grep -c 'RESOLVED_WITH_PAYOUT: \"PayPal covered it\"' $D/_data.ts)"
echo "border-radius uses (buttons and the live dot only):"; grep -rn 'border-radius' $D --include='*.css' | sed 's/^/      /'
echo "1px boxes (border on all four sides):"; grep -rn 'border: 1px' $D --include='*.css' | sed 's/^/      /'
# Browser checks (docs/design/check-ui.cjs): pass the deploy URL to run them on the Mac over ssh.
# Approve click path, the fold at 1920x940 and 1536x752 @1.25, nav targets, calendar overflow, contrast, type size, phone.
if [ -n "${1:-}" ]; then
  echo "-- browser checks against $1"
  ssh mac "bash -c 'T=\$(mktemp -d /tmp/ccui.XXXXXX); trap \"rm -rf \$T\" EXIT; cat > \$T/c.cjs; /opt/homebrew/bin/node \$T/c.cjs $1'" < docs/design/check-ui.cjs || fail=1
fi
exit $fail
