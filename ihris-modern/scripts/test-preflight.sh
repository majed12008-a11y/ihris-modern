#!/usr/bin/env bash
# Sprint 5.5 — Unix wrapper around the cross-platform preflight script.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/test-preflight.js"
