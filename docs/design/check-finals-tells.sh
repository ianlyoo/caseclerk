#!/bin/bash
# Source checks for Final A: the verdict's grep guardrails (G5, G8, G10, G11, G16, G17) and the old tells, scoped to Final A
# and the shared fixtures. Run from the repo root: bash docs/design/check-finals-tells.sh [deploy-url]
D="src/app/finals/a src/app/finals/_shared"
fail=0
check() { # name, expected-count, actual-count, note
  if [ "$3" -eq "$2" ]; then echo "PASS  $1 ($3)"; else echo "FAIL  $1 (found $3, expected $2) $4"; fail=1; fi
}
n() { grep -rEn --include='*.tsx' --include='*.ts' --include='*.css' "$@" $D | wc -l; }
css() { grep -rEn --include='*.css' "$@" $D; }

check "G5 no backdrop-filter, conic-gradient, blur"              0 "$(n 'backdrop-filter|conic-gradient|blur\(')"
check "G8 box-shadow only on .slip .sheet .mat .tooltip"         0 "$(awk '/^[^ ].*\{/{sel=$0} /box-shadow/ && sel !~ /\.(slip|sheet|mat|tooltip)[ ,:{]/ && $0 !~ /box-shadow: *none/ {print FILENAME": "sel}' src/app/finals/a/a.module.css | wc -l)"
check "G8 the well colour only on the well rules"                0 "$(awk '/^[^ ].*\{/{sel=$0} /(#ECE7DB|#ece7db|var\(--well\))/ && $0 !~ /--well:/ && sel !~ /\.(wellBox|bar)[ ,:{]/ {print sel}' src/app/finals/a/a.module.css | wc -l)"
check "G10 banned fonts (Geist Inter Jakarta Manrope ...)"       0 "$(grep -rEn 'Geist|Inter\b|Plus_Jakarta|Manrope|Source_Serif|Spline_Sans_Mono' $D src/app/layout.tsx | wc -l)"
check "G10 bold weights"                                         0 "$(n 'font-weight: *[6-9]00|bold')"
check "G11 radial / repeating gradients"                         0 "$(n 'radial-gradient|repeating-linear-gradient|repeating-radial')"
check "G11 svg files in public/finals, inline svg"               0 "$(( $(find public/finals -name '*.svg' | wc -l) + $(n '<svg') ))"
check "G11 photos <= 40 KB and listed in CREDITS.md"             0 "$(for f in public/finals/*.webp; do [ "$(stat -c %s "$f")" -le 40960 ] && grep -q "$(basename "$f")" public/finals/CREDITS.md || echo "$f"; done | wc -l)"
check "G11 every <img> carries data-credit"                      0 "$(grep -rEn '<img' $D | grep -vc 'data-credit')"
check "G16 motion cliches (typewriter shimmer steps( confetti)"  0 "$(n 'typewriter|shimmer|steps\(|confetti|particle|gradient-border')"
check "G16 no overshoot easing"                                  0 "$(n 'cubic-bezier\([^)]*,\s*1\.[0-9]')"
check "G16 spring damping >= 2*sqrt(stiffness*mass)"             0 "$(grep -rhoE 'stiffness: *[0-9.]+, *damping: *[0-9.]+(, *mass: *[0-9.]+)?' $D | python3 -c '
import sys,re,math
bad=0
for l in sys.stdin:
    v=dict((k,float(x)) for k,x in re.findall(r"(\w+): *([0-9.]+)",l)); bad+= v["damping"] < 2*math.sqrt(v["stiffness"]*v.get("mass",1))
print(bad)')"
check "G17 tracked caps: text-transform uppercase"               0 "$(n -i 'text-transform: *uppercase')"
check "G17 tracking >= .1em"                                     0 "$(n 'letter-spacing: *(0?\.[1-9]|[1-9])')"
check "G17 middot meta strings"                                  0 "$(n '·|&middot;|\\u00b7')"
check "G17 arrows"                                               0 "$(n '→|&rarr;|\\u2192|›|»|&raquo;')"
check "G17 letter avatars"                                       0 "$(n -i 'avatar|initials|charAt\(0\)')"
check "G17 four-decimal costs"                                   0 "$(n '\$0\.[0-9]{4}|toFixed\(4\)|maximumFractionDigits: *4')"
check "T2 hero filler words"                                     0 "$(n -i 'seamless|effortless|supercharge|powerful|revolution|AI-powered|let the agent|magic|unlock')"
check "T3 dashed drop zones"                                     0 "$(n 'dashed|dropzone|drop-zone')"
check "T7 fake charts (canvas sparkline meter progress)"         0 "$(n -i '<canvas|sparkline|<progress|<meter')"
# T9 is scoped to the nav: Final A underlines inline links only (verdict §3), never tabs.
check "T9 nav links are not underlined tabs"                     0 "$(awk '/^\.nav/{f=1} f && /text-decoration: *underline|border-bottom: *[23]px/{c++} /^\}/{f=0} END{print c+0}' src/app/finals/a/a.module.css)"
check "T10 rounded panels (radius > 6px)"                        0 "$(css 'border-radius: *([7-9]|[1-9][0-9])px' | grep -v '999px' | wc -l)"
check "T13 teal/cyan hex colours"                                0 "$(grep -rhoE '#[0-9a-fA-F]{6}\b' $D | sort -u | python3 -c '
import sys,colorsys
c=0
for h in sys.stdin.read().split():
    r,g,b=(int(h[i:i+2],16)/255 for i in (1,3,5)); hh,l,s=colorsys.rgb_to_hls(r,g,b)
    if 150<=hh*360<=200 and s>0.25: c+=1
print(c)')"
check "T13 Wire blue hue 205-225 (G20 source)"                   0 "$(grep -oE '#(0059B8|6FB2FF)' src/app/finals/a/a.module.css | sort -u | python3 -c '
import sys,colorsys
c=0
for h in sys.stdin.read().split():
    r,g,b=(int(h[i:i+2],16)/255 for i in (1,3,5)); hh,l,s=colorsys.rgb_to_hls(r,g,b); c+= not (205<=hh*360<=225)
print(c)')"
check "T14 placeholder data"                                     0 "$(n -i 'lorem|john doe|jane doe|acme|item [0-9]|example\.com|customer [0-9]')"
check "T14 dispute ids PP-R-XXX-12345678"                        0 "$(grep -rhoE 'PP-R-[A-Z0-9]+-[0-9]+' $D | grep -vcE '^PP-R-[A-Z]{3}-[0-9]{8}$')"
check "G12 no debug id in the sample fixtures"                   0 "$(grep -E 'debugId: *"' src/app/finals/_shared/cases.ts src/app/finals/_shared/data.ts | wc -l)"
check "G7 Wire never shows model, cost or policy"                0 "$(grep -nE 'claude-|costUsd|model' src/app/finals/a/ui.tsx | wc -l)"
check "Policy page: shared POLICY is the app's DEFAULT_POLICY"   1 "$(grep -c 'export const POLICY: SellerPolicy = DEFAULT_POLICY;' src/app/finals/_shared/data.ts)"
check "extra: emoji"                                             0 "$(grep -rnP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' $D | wc -l)"
check "extra: no edits outside owned paths on this branch"       0 "$(git diff --name-only 69f5756^ HEAD | grep -vE '^(src/app/finals/(a|_shared)/|public/finals/|docs/design/(finals/a/|check-)|src/app/layout\.tsx$)' | wc -l)"
echo "border-radius uses:"; css 'border-radius' | sed 's/^/      /'
echo "box-shadow uses:"; css 'box-shadow' | sed 's/^/      /'
# Browser checks (docs/design/check-finals-a.cjs) on the Mac over ssh: the 5 viewports, the Approve click, ids against the real run.
if [ -n "${1:-}" ]; then
  echo "-- browser checks against $1"
  ssh mac "bash -c 'T=\$(mktemp -d /tmp/ccfa.XXXXXX); trap \"rm -rf \$T\" EXIT; cat > \$T/c.cjs; /opt/homebrew/bin/node \$T/c.cjs $1'" < docs/design/check-finals-a.cjs || fail=1
fi
exit $fail
