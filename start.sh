#!/usr/bin/env bash
# Start SmartCommute backend and frontend concurrently
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v python3 &>/dev/null; then
    python3 "$SCRIPT_DIR/run.py"
elif command -v python &>/dev/null; then
    python "$SCRIPT_DIR/run.py"
else
    echo "Python is not installed or not in PATH."
    exit 1
fi
