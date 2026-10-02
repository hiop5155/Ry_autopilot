#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
單元測試統一執行腳本 (run_tests.py)

使用方式：
  1. 執行全部測試：
     python3 run_tests.py
     ./venv/bin/pytest tests/

  2. 執行單一特定模組：
     python3 run_tests.py 1     # 或 python3 run_tests.py logic
     python3 run_tests.py 2     # 或 python3 run_tests.py html
     python3 run_tests.py 3     # 或 python3 run_tests.py db
"""

import sys
import subprocess
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTEST = os.path.join(SCRIPT_DIR, "venv", "bin", "pytest")
PYTEST_CMD = VENV_PYTEST if os.path.exists(VENV_PYTEST) else "pytest"

MODULE_MAP = {
    "1": "tests/test_1_pure_logic.py",
    "logic": "tests/test_1_pure_logic.py",
    "id": "tests/test_1_pure_logic.py",
    "2": "tests/test_2_html_parsing.py",
    "html": "tests/test_2_html_parsing.py",
    "fixtures": "tests/test_2_html_parsing.py",
    "3": "tests/test_3_db_and_state.py",
    "db": "tests/test_3_db_and_state.py",
    "state": "tests/test_3_db_and_state.py",
}


def main():
    args = sys.argv[1:]
    target_files = []

    if not args:
        target_files = ["tests/"]
        print("🚀 [測試啟動器] 正在執行所有單元測試 (tests/)...")
    else:
        for arg in args:
            key = arg.lower().strip()
            if key in MODULE_MAP:
                target_files.append(MODULE_MAP[key])
            elif os.path.exists(arg):
                target_files.append(arg)
            else:
                print(f"⚠️  未知目標: '{arg}'。可選參數: 1 (logic), 2 (html), 3 (db)")
                sys.exit(1)
        print(f"🚀 [測試啟動器] 正在執行指定測試模組: {', '.join(target_files)}")

    cmd = [PYTEST_CMD] + target_files + ["-v"]
    try:
        ret = subprocess.call(cmd)
        sys.exit(ret)
    except FileNotFoundError:
        print("❌ 未找到 pytest，請先執行: ./venv/bin/pip install pytest")
        sys.exit(1)


if __name__ == "__main__":
    main()
