#!/usr/bin/env bash
# Runs the live PayPal sandbox contract tests with keys from the key file (never printed).
#   scripts/test-live.sh                 all live tests
#   scripts/test-live.sh -t evidence     vitest filters pass through
set -euo pipefail
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_CUSTOM_HEADERS ANTHROPIC_API_KEY
set -a; . "${CASECLERK_ENV:-/srv/company/work/g251-pm-104/secrets/caseclerk.env}"; set +a
unset ANTHROPIC_API_KEY
cd "$(dirname "$0")/.."
PAYPAL_LIVE_TESTS=1 exec npx vitest run tests/paypal/live.test.ts --testTimeout=60000 --silent=false "$@"
