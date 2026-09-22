#!/usr/bin/env bash
# Navigate to project directory and run Railway Auto-Pilot using venv (defaults to Chrome dashboard, supports --cli)
cd "$(dirname "$0")"

if [ ! -f "./venv/bin/python3" ]; then
    echo "[!] Python virtual environment (./venv) not found. Creating venv..."
    python3 -m venv ./venv
    ./venv/bin/pip install -r requirements.txt
fi

# Build React frontend SPA if client/dist is not present and npm is available
if [ ! -f "./client/dist/index.html" ] && [ -d "./client" ] && command -v npm &>/dev/null; then
    echo "[!] client/dist not found. Automatically building React frontend..."
    (cd client && npm install && npm run build)
fi

export PYTHONPATH=.
./venv/bin/python3 main.py "$@"
