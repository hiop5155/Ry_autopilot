#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地 Web 儀表板伺服器啟動器 (app/web/server.py)
負責網路埠號指派、HTTP 伺服器生命週期管理與本機瀏覽器分頁喚起。
具體狀態管理與 API 處理已解耦至 state.py, worker.py 與 handlers.py。
"""

import atexit
import subprocess
import webbrowser
from http.server import ThreadingHTTPServer

from . import state
from .. import db
from .handlers import AppRequestHandler

# 程序結束時安全標記任務停止並持久化保存設定（不刪除 /tmp 暫存檔）
atexit.register(state.cleanup_status_files)


def run_web_server(port: int = 8080, open_chrome: bool = True, debug: bool = False):
    """啟動 Web 儀表板伺服器，若 port 被佔用則自動跳至下一個可用 port 並開啟 Chrome 分頁"""
    state.set_debug_mode(debug)

    current_port = port
    httpd = None
    max_tries = 100

    for _ in range(max_tries):
        try:
            server_address = ("", current_port)
            httpd = ThreadingHTTPServer(server_address, AppRequestHandler)
            break
        except OSError as e:
            if e.errno == 98 or "Address already in use" in str(e):
                print(f"[INFO] 埠號 {current_port} 已被佔用，自動切換至下一個可用埠號 {current_port + 1}...")
                current_port += 1
            else:
                raise e

    if not httpd:
        raise RuntimeError(f"[ERROR] 無法在 {port} ~ {current_port} 找到可用的連接埠！")

    actual_port = current_port
    state.init_status_paths(actual_port)
    print(f"[INFO] 狀態持久化資料庫: {db.get_db_path()}")
    print(f"\n[INFO] 本地 Web 伺服器已於 http://127.0.0.1:{actual_port} 啟動")
    if debug:
        print("[INFO] >>> DEBUG 詳細除錯日誌模式已啟動 <<<")

    if open_chrome:
        app_url = f"http://127.0.0.1:{actual_port}/index.html"
        print(f"[INFO] 正在開啟 Google Chrome 分頁: {app_url}")
        try:
            subprocess.Popen(["google-chrome", app_url])
        except Exception as e:
            print(f"[WARN] 調用 google-chrome 失敗: {e}，改用預設瀏覽器開啟")
            try:
                webbrowser.open(app_url)
            except Exception:
                print(f"[INFO] 請手動開啟瀏覽器前往: {app_url}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Web 伺服器關閉。")
    finally:
        state.cleanup_status_files()
        httpd.server_close()


if __name__ == "__main__":
    run_web_server()
