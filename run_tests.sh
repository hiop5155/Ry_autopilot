#!/usr/bin/env bash
# tn_test 單元測試快捷執行腳本
# 用法:
#   ./run_tests.sh        (跑全部測試)
#   ./run_tests.sh 1      (只跑項目 1: 純邏輯)
#   ./run_tests.sh 2      (只跑項目 2: HTML解析)
#   ./run_tests.sh 3      (只跑項目 3: DB與State)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$DIR/venv/bin/python3"

if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

exec "$PYTHON_BIN" "$DIR/run_tests.py" "$@"
