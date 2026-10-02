#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web HTTP 請求處理模組 (app/web/handlers.py)
實作 RESTful API 與靜態資源託管，整合時刻表查詢、多任務並行監控啟動/停止、車票管理與線上取消退票。
"""

import sys
import os
import json
import threading
from http.server import SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Any

from ..config import load_config, save_config, validate_time_range
from ..stations import get_common_stations, get_all_stations, get_station_code, get_station_name
from ..timetable import query_train_timetable
from ..storage import get_saved_tickets
from ..cancel_ticket import handle_ticket_cancellation
from . import state
from .. import db
from .worker import polling_worker


class AppRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # 優先檢查 client/dist (React 生產包)，若無則 fallback 至 app/web/static (原生靜態檔)
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            frozen_dist = os.path.join(sys._MEIPASS, "client", "dist")
            if os.path.isdir(frozen_dist) and os.path.exists(os.path.join(frozen_dist, "index.html")):
                static_dir = frozen_dist
            else:
                static_dir = os.path.join(sys._MEIPASS, "app", "web", "static")
        else:
            dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "client", "dist"))
            if os.path.isdir(dist_dir) and os.path.exists(os.path.join(dist_dir, "index.html")):
                static_dir = dist_dir
            else:
                static_dir = os.path.join(os.path.dirname(__file__), "static")
        super().__init__(*args, directory=static_dir, **kwargs)

    def log_message(self, format, *args):
        if len(args) > 0 and isinstance(args[0], str):
            if "/api/status" in args[0] or "/api/tasks" in args[0]:
                return
        if not state.is_debug_mode():
            return
        super().log_message(format, *args)

    def end_headers(self):
        if hasattr(self, "path") and (self.path == "/" or self.path.endswith(".html") or self.path.endswith(".js") or self.path.endswith(".css")):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def _send_json(self, data: Any, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        try:
            url = urlparse(self.path)
            query_params = parse_qs(url.query)
            task_id = query_params.get("task_id", [None])[0]

            lock = state.get_lock()
            curr_state = state.get_task_state(task_id)

            if url.path == "/api/tasks":
                self._send_json({
                    "success": True,
                    "tasks": state.get_all_tasks_summary()
                })

            elif url.path == "/api/config":
                cfg = load_config()
                cfg["common_stations"] = get_common_stations()
                cfg["all_stations"] = get_all_stations()

                active_state = dict(curr_state)
                if active_state.get("is_running") or active_state.get("pid"):
                    for k in ["pid", "ride_date", "start_station", "end_station", "start_time", "end_time", "ticket_qty", "split_mode"]:
                        if active_state.get(k):
                            cfg[k] = active_state[k]

                cfg["current_task_id"] = curr_state.get("id", "default")
                cfg["current_task_name"] = curr_state.get("name", "任務 1")
                self._send_json(cfg)

            elif url.path == "/api/status":
                self._send_json(dict(curr_state))

            elif url.path == "/api/tickets":
                self._send_json(get_saved_tickets())

            else:
                super().do_GET()

        except Exception as e:
            import traceback
            err_detail = traceback.format_exc()
            print(f"[ERROR] GET {self.path} 處理失敗:\n{err_detail}")
            try:
                self._send_json({
                    "error": True,
                    "msg": f"{type(e).__name__}: {str(e)}",
                    "path": self.path,
                    "detail": err_detail.splitlines()[-1] if err_detail else str(e)
                }, status=500)
            except Exception:
                pass

    def do_POST(self):
        url = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            params = json.loads(body)
        except Exception:
            params = {}

        task_id = params.get("task_id", "default")
        lock = state.get_lock()
        curr_state = state.get_task_state(task_id)

        try:
            # 建立新任務
            if url.path in ["/api/tasks/create", "/api/tasks"]:
                name = params.get("name", "")
                new_task = state.create_new_task(name)
                self._send_json({"success": True, "task": new_task, "tasks": state.get_all_tasks_summary()})

            # 刪除任務
            elif url.path in ["/api/tasks/delete"]:
                target_id = params.get("task_id", "")
                ok = state.delete_task(target_id)
                self._send_json({
                    "success": ok,
                    "msg": "已刪除任務" if ok else "刪除失敗（至少保留一個任務）",
                    "tasks": state.get_all_tasks_summary()
                })

            # 重新命名任務
            elif url.path in ["/api/tasks/rename"]:
                target_id = params.get("task_id", "")
                new_name = params.get("name", "")
                ok = state.rename_task(target_id, new_name)
                self._send_json({
                    "success": ok,
                    "tasks": state.get_all_tasks_summary()
                })

            # 時刻表查詢
            elif url.path == "/api/timetable":
                ride_date = params.get("ride_date", "").replace("-", "/").strip()
                start = get_station_code(params.get("start_station", "1000"))
                end = get_station_code(params.get("end_station", "1020"))
                start_t = params.get("start_time", "00:00")
                end_t = params.get("end_time", "23:59")
                start_t, end_t = validate_time_range(start_t, end_t)

                try:
                    trains = query_train_timetable(ride_date, start, end, start_t, end_t)
                except Exception as ex:
                    print(f"[WARN] query_train_timetable 發生異常: {ex}")
                    trains = []

                with lock:
                    curr_state["cached_trains"] = trains
                    db.upsert_task(state.get_server_port(), curr_state)
                self._send_json({"success": True, "trains": trains})

            # 啟動自動搶票
            elif url.path == "/api/start":
                if state.is_task_running(task_id):
                    self._send_json({"success": False, "msg": f"任務 [{curr_state.get('name')}] 正在撿票監控中，請勿重複啟動"})
                    return

                pid = params.get("pid", "")
                ride_date = params.get("ride_date", "").replace("-", "/").strip()
                start = get_station_code(params.get("start_station", "1000"))
                end = get_station_code(params.get("end_station", "1020"))

                start_t, end_t = validate_time_range(params.get("start_time", "10:00"), params.get("end_time", "18:00"))
                target_trains = params.get("target_trains", [])
                qty = int(params.get("ticket_qty", 1))
                split_mode = str(params.get("split_mode", "single"))
                cached_trains = params.get("cached_trains", [])

                with lock:
                    curr_state["is_running"] = True
                    curr_state["round_count"] = 0
                    curr_state["ticket_result"] = None
                    curr_state["booked_tickets"] = []
                    curr_state["last_log"] = "準備啟動撿票監控..."
                    curr_state["pid"] = pid
                    curr_state["ride_date"] = ride_date
                    curr_state["start_station"] = start
                    curr_state["start_station_name"] = get_station_name(start)
                    curr_state["end_station"] = end
                    curr_state["end_station_name"] = get_station_name(end)
                    curr_state["start_time"] = start_t
                    curr_state["end_time"] = end_t
                    curr_state["ticket_qty"] = qty
                    curr_state["split_mode"] = split_mode
                    curr_state["booked_count"] = 0
                    curr_state["target_count"] = qty
                    curr_state["target_trains"] = target_trains
                    curr_state["total_target_trains"] = target_trains
                    curr_state["booked_tickets"] = []
                    if cached_trains:
                        curr_state["cached_trains"] = cached_trains
                    curr_state["logs"] = [f"準備啟動撿票監控 (PID: {pid}, {get_station_name(start)} ➔ {get_station_name(end)})..."]
                    db.upsert_task(state.get_server_port(), curr_state)

                # 存檔最新全域設定
                save_config({
                    "pid": pid, "ride_date": ride_date, "start_station": start,
                    "end_station": end, "start_time": start_t, "end_time": end_t,
                    "ticket_qty": qty, "split_mode": split_mode, "preferred_trains": target_trains
                })

                # 初始化任務停止訊號並啟動背景線程
                state.start_task(task_id)
                poll_thread = threading.Thread(
                    target=polling_worker,
                    args=(pid, ride_date, start, end, start_t, end_t, target_trains, qty, split_mode, 10.0, 3.0, task_id),
                    daemon=True
                )
                state.set_task_thread(task_id, poll_thread)
                poll_thread.start()

                self._send_json({"success": True, "msg": f"任務 [{curr_state.get('name')}] 撿票監控啟動成功", "task_id": task_id})

            # 停止自動搶票
            elif url.path == "/api/stop":
                state.stop_task(task_id)
                state.add_log("已收到停止指示，正在釋放背景程序...", task_id=task_id)
                self._send_json({"success": True, "msg": f"任務 [{curr_state.get('name')}] 已停止監控", "task_id": task_id})

            # 取消/退票
            elif url.path == "/api/cancel_ticket":
                booking_code = str(params.get("booking_code", "")).strip()
                pid = str(params.get("pid", "")).strip()
                if not booking_code:
                    self._send_json({"success": False, "msg": "缺少訂票代碼 (booking_code)"})
                    return

                res = handle_ticket_cancellation(booking_code, pid)
                if res.get("success"):
                    state.remove_booked_ticket(booking_code, pid)
                self._send_json(res)

            else:
                self.send_error(404)

        except Exception as e:
            import traceback
            err_detail = traceback.format_exc()
            print(f"[ERROR] POST {url.path} 處理失敗:\n{err_detail}")
            try:
                self._send_json({
                    "success": False,
                    "msg": f"{type(e).__name__}: {str(e)}",
                    "path": url.path,
                    "detail": err_detail.splitlines()[-1] if err_detail else str(e),
                    "trains": []
                }, status=500)
            except Exception:
                pass
