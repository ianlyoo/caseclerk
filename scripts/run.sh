#!/usr/bin/env bash
# Runs a TypeScript script against the sandbox with keys loaded from the key file (never printed).
#   scripts/run.sh scripts/open-test-dispute.ts not_received
set -euo pipefail
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_CUSTOM_HEADERS ANTHROPIC_API_KEY
set -a; . "${CASECLERK_ENV:-/srv/company/work/g251-pm-104/secrets/caseclerk.env}"; set +a
unset ANTHROPIC_API_KEY
here="$(cd "$(dirname "$0")" && pwd)"
exec node --no-warnings --import "$here/lib/register.mjs" "$@"
