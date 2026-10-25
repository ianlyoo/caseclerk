#!/usr/bin/env bash
# Static "slop tells" for Final B (verdict G9/G10/G11 plus B's own rules: PayPal blue only as the PayPal register,
# no brass or gold, shadows only on objects).
#   bash docs/design/finals/b/check-tells-b.sh
cd "$(dirname "$0")/../../../.." || exit 2
SRC="src/app/finals/b"
fails=0
check() { # name, grep pattern, [extra grep args]
  local name="$1" pat="$2"; shift 2
  local hits; hits=$(grep -rnE "$@" "$pat" "$SRC" 2>/dev/null)
  if [ -n "$hits" ]; then echo "FAIL  $name"; echo "$hits" | head -5 | sed 's/^/      /'; fails=$((fails+1)); else echo "PASS  $name"; fi
}
check "no uppercase transforms"                 'text-transform:\s*uppercase|uppercase'                --include=*.css --include=*.tsx
check "no positive letter-spacing"               'letter-spacing:\s*0?\.[0-9]*[1-9]|letter-spacing:\s*[1-9]' --include=*.css
check "no heavy weights (>= 600 or bold)"        'font-weight:\s*([6-9]00|bold)|fontWeight'             --include=*.css --include=*.tsx
check "only Newsreader, Hanken Grotesk, JetBrains Mono" '\bInter\b|Roboto|Geist|Space_Grotesk|Playfair|Fraunces|IBM_Plex|DM_Sans' --include=*.tsx --include=*.css
check "no gradients"                             'gradient\('                                           --include=*.css --include=*.tsx
check "no middots or bullets as separators"      '·|•'                                                  --include=*.tsx --include=*.ts
check "no arrows in copy"                        '→|←|↗|↘|➜|&rarr;'                                     --include=*.tsx --include=*.ts
check "no shimmer, typewriter, confetti, glow"   'shimmer|typewriter|confetti|glow|sparkle|skeleton'   -i --include=*.tsx --include=*.css
check "no overshooting easings"                  'cubic-bezier\([^)]*(-0?\.[0-9]|1\.[0-9])'             --include=*.css --include=*.tsx
check "no bounce springs (bounce/overshoot)"     'bounce|type:\s*"spring"[^}]*damping:\s*[0-9]\b'       --include=*.tsx
check "no blue or teal hex besides the two PayPal tokens" '#(0[0-9a-f]{2}[89a-f][0-9a-f]{2}|[0-3][0-9a-f][4-9a-f][0-9a-f][a-f][0-9a-f])\b' -i --include=*.tsx
pp=$(grep -niE '#(0[0-9a-f]{2}[89a-f][0-9a-f]{2}|[0-3][0-9a-f][4-9a-f][0-9a-f][a-f][0-9a-f])\b|#6fb2ff' "$SRC/b.module.css" | grep -viE '^[0-9]+:\s*--pp(-dark)?:\s*#(0059b8|6fb2ff);')
if [ -n "$pp" ]; then echo "FAIL  PayPal blue only as --pp / --pp-dark"; echo "$pp" | head -5 | sed 's/^/      /'; fails=$((fails+1)); else echo "PASS  PayPal blue only as --pp / --pp-dark"; fi
check "no brass or gold"                         '--brass:|var\(--brass\)|gold|#(b8860b|c9a227|a67c00|d4af37|8a5a00)\b' -i --include=*.css --include=*.tsx
check "no emoji"                                 $'[\xF0][\x9F]'                                        --include=*.tsx --include=*.ts
check "no AI cliches in copy"                    'Seamless|Effortless|Supercharge|Unlock|Revolutioniz|AI-powered|magic|✨' -i --include=*.tsx --include=*.ts
check "no backdrop blur"                         'backdrop-filter'                                      --include=*.css
# Shadows: every box-shadow rule must belong to an object class (mat, sheet paper, decision sheet, reader).
bad=$(awk '
  /\{/ { sel=$0 }
  /box-shadow:/ && !/none/ { if (sel !~ /\.(mat|sheet|sheetDark|sheetBar|reader|page|approve)[ :,{.]/) print NR ": " sel }
' "$SRC/b.module.css")
if [ -n "$bad" ]; then echo "FAIL  box-shadow only on objects"; echo "$bad" | sed 's/^/      /'; fails=$((fails+1)); else echo "PASS  box-shadow only on objects"; fi
echo; [ "$fails" = 0 ] && echo "0 FAIL" || echo "$fails FAIL"
exit $((fails>0))
