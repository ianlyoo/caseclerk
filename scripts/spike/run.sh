#!/usr/bin/env bash
# Runs a spike script with the sandbox keys loaded from the key file (never printed).
set -euo pipefail
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_CUSTOM_HEADERS ANTHROPIC_API_KEY
set -a; . "${CASECLERK_ENV:-/srv/company/work/g251-pm-104/secrets/caseclerk.env}"; set +a
unset ANTHROPIC_API_KEY
cd "$(dirname "$0")"
# Non-secret sandbox account emails (gitignored local file)
if [ -f .env.spike ]; then set -a; . ./.env.spike; set +a; fi
exec node "$@"
