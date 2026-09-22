#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智慧鐵路票務自動化監控系統主進入點 (main.py)
預設啟動 Chrome 現代 Web 儀表板視窗，亦支援純終端互動模式 (--cli)。
"""

import sys
import os
import argparse

# 將專案根目錄加入模組搜尋路徑
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.config import load_config
from app.cli import run_cli_interactive
from app.web.server import run_web_server

def main():
    parser = argparse.ArgumentParser(description="智慧鐵路票務自動化監控系統 (Railway Auto-Pilot)")
    parser.add_argument("--cli", action="store_true", help="使用純終端機互動問答與監控模式")
    parser.add_argument("--debug", action="store_true", help="開啟詳細除錯日誌輸出 (含每步驟進度與例外堆疊)")
    parser.add_argument("--port", type=int, default=None, help="Web 儀表板伺服器埠號 (預設優先讀取 config.json，或 8080)")
    parser.add_argument("--no-browser", action="store_true", help="Web 模式下不自動開啟 Chrome 視窗")

    args = parser.parse_args()
    config = load_config()

    if args.cli:
        # 純終端互動模式
        run_cli_interactive(debug=args.debug)
    else:
        # 預設：啟動 Web 儀表板並自動以 Chrome 分頁開啟
        port = args.port or config.get("web_port", 8080)
        open_chrome = not args.no_browser
        run_web_server(port=port, open_chrome=open_chrome, debug=args.debug)


if __name__ == "__main__":
    main()
