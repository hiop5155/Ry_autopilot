#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web 執行時狀態管理模組 (app/web/state.py)
支援多任務 (Multi-Task Sessions) 並行撿票管理、日誌緩存、持久化至 JSON 以及跨行程存活狀態偵測。
"""

import sys
import os
import json
import time
import threading
import uuid
from typing import Dict, Any, List, Optional

_SERVER_PORT: int = 0
STATUS_FILE_LOCAL: str = ""
STATUS_FILE_TMP: str = ""

_LOCK = threading.RLock()
_DEBUG_MODE: bool = False

def _create_default_task_payload(task_id: str, name: str = "任務 1") -> Dict[str, Any]:
    return {
        "id": task_id,
        "name": name,
        "server_pid": os.getpid(),
        "is_running": False,
        "round_count": 0,
        "last_log": "系統待命中，請設定條件並查詢車次",
        "logs": ["系統待命中，請設定條件並查詢車次"],
        "target_desc": "",
        "ticket_result": None,
        "countdown": 0,
        "last_update": time.time(),
        "pid": "",
        "ride_date": "",
        "start_station": "1000",
        "start_station_name": "臺北",
        "end_station": "1020",
        "end_station_name": "板橋",
        "start_time": "10:00",
        "end_time": "18:00",
        "ticket_qty": 1,
        "split_mode": "single",
        "booked_count": 0,
        "target_count": 1,
        "target_trains": [],
        "total_target_trains": [],
        "booked_tickets": [],
        "cached_trains": []
    }

# 多任務字典: task_id -> task_state
_TASKS: Dict[str, Dict[str, Any]] = {
    "default": _create_default_task_payload("default", "任務 1")
}

# 記錄各任務專屬的背景線程
_TASK_THREADS: Dict[str, threading.Thread] = {}


def load_saved_status():
    """啟動時嘗試從持久化狀態檔載入先前的任務與設定，直接保留上次的設定結果"""
    global _TASKS
    for path in [STATUS_FILE_TMP, STATUS_FILE_LOCAL]:
        if path and os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    saved_tasks = data.get("tasks")
                    if saved_tasks and isinstance(saved_tasks, dict):
                        with _LOCK:
                            _TASKS = saved_tasks
                            # 重新啟動時更新 server_pid，並確保狀態重置為待機
                            for t in _TASKS.values():
                                t["server_pid"] = os.getpid()
                                t["is_running"] = False
                                t["countdown"] = 0
                        return True
            except Exception:
                pass
    return False


def init_status_paths(port: int):
    """根據實際啟用的 port 初始化狀態持久化路徑，並載入先前留存的設定"""
    global STATUS_FILE_LOCAL, STATUS_FILE_TMP, _SERVER_PORT
    _SERVER_PORT = port
    if getattr(sys, 'frozen', False):
        STATUS_FILE_LOCAL = os.path.abspath(os.path.join(os.getcwd(), f"runtime_status_{port}.json"))
    else:
        STATUS_FILE_LOCAL = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", f"runtime_status_{port}.json")
        )
    STATUS_FILE_TMP = f"/tmp/Ry_autopilot_status_{port}.json"
    load_saved_status()


def set_debug_mode(debug: bool):
    global _DEBUG_MODE
    _DEBUG_MODE = debug


def is_debug_mode() -> bool:
    return _DEBUG_MODE


def get_lock() -> threading.RLock:
    return _LOCK


def get_task_state(task_id: Optional[str] = None) -> Dict[str, Any]:
    """取得指定任務狀態，若未指定或不存在則回傳第一個/預設任務"""
    with _LOCK:
        if task_id and task_id in _TASKS:
            return _TASKS[task_id]
        if "default" in _TASKS:
            return _TASKS["default"]
        # 若無 default 則回傳第一個任務
        if _TASKS:
            first_key = next(iter(_TASKS))
            return _TASKS[first_key]
        # 若完全為空則建立一個
        _TASKS["default"] = _create_default_task_payload("default", "任務 1")
        return _TASKS["default"]


def get_all_tasks_summary() -> List[Dict[str, Any]]:
    """回傳所有任務的簡明摘要（供多分頁標籤導航欄使用）"""
    with _LOCK:
        summary = []
        for tid, t in _TASKS.items():
            summary.append({
                "id": tid,
                "name": t.get("name", "未命名任務"),
                "is_running": t.get("is_running", False),
                "round_count": t.get("round_count", 0),
                "start_station_name": t.get("start_station_name", "出發"),
                "end_station_name": t.get("end_station_name", "抵達"),
                "ride_date": t.get("ride_date", ""),
                "booked_count": t.get("booked_count", 0),
                "target_count": t.get("target_count", 1),
                "last_log": t.get("last_log", ""),
                "has_success": bool(t.get("ticket_result"))
            })
        return summary


def create_new_task(name: str = "") -> Dict[str, Any]:
    """建立一個全新搶票任務"""
    with _LOCK:
        task_idx = len(_TASKS) + 1
        new_id = f"task_{int(time.time())}_{str(uuid.uuid4())[:4]}"
        task_name = name.strip() if name.strip() else f"任務 {task_idx}"
        new_task = _create_default_task_payload(new_id, task_name)
        _TASKS[new_id] = new_task
        save_runtime_status()
        return new_task


def delete_task(task_id: str) -> bool:
    """刪除指定任務（若正在運行則先停止，且至少保留一個任務）"""
    with _LOCK:
        if task_id not in _TASKS:
            return False
        if len(_TASKS) <= 1:
            return False  # 不可刪除最後一個任務
        
        # 標記停止
        _TASKS[task_id]["is_running"] = False
        del _TASKS[task_id]
        if task_id in _TASK_THREADS:
            del _TASK_THREADS[task_id]
        save_runtime_status()
        return True


def rename_task(task_id: str, new_name: str) -> bool:
    """重新命名指定任務"""
    with _LOCK:
        if task_id in _TASKS and new_name.strip():
            _TASKS[task_id]["name"] = new_name.strip()
            save_runtime_status()
            return True
        return False


def set_task_thread(task_id: str, thread: Optional[threading.Thread]):
    with _LOCK:
        if thread:
            _TASK_THREADS[task_id] = thread
        elif task_id in _TASK_THREADS:
            del _TASK_THREADS[task_id]


def get_task_thread(task_id: str) -> Optional[threading.Thread]:
    with _LOCK:
        return _TASK_THREADS.get(task_id)


def save_runtime_status():
    """將當前所有任務之執行狀態與歷史日誌安全持久化至檔案"""
    try:
        tasks_data = {
            "server_pid": os.getpid(),
            "last_update": time.time(),
            "tasks": _TASKS
        }
        for path in [STATUS_FILE_LOCAL, STATUS_FILE_TMP]:
            if not path:
                continue
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(tasks_data, f, ensure_ascii=False, indent=2)
            except Exception:
                pass
    except Exception:
        pass


def add_log(msg: str, task_id: Optional[str] = None):
    """追加日誌並保留最近 60 條歷史記錄，同時持久化存檔"""
    with _LOCK:
        if task_id and task_id in _TASKS:
            target_task = _TASKS[task_id]
        elif "default" in _TASKS:
            target_task = _TASKS["default"]
        elif _TASKS:
            target_task = _TASKS[next(iter(_TASKS))]
        else:
            _TASKS["default"] = _create_default_task_payload("default", "任務 1")
            target_task = _TASKS["default"]
            
        target_task["last_log"] = msg
        logs = target_task.setdefault("logs", [])
        if not logs or logs[-1] != msg:
            logs.append(msg)
            if len(logs) > 60:
                target_task["logs"] = logs[-60:]
        save_runtime_status()


def is_pid_alive(pid: int) -> bool:
    """檢查指定 PID 是否存活於 Linux 系統中 (/proc/<pid>)"""
    if not pid or pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def read_external_status_if_alive() -> Optional[Dict[str, Any]]:
    """若本實例未在運行，嘗試讀取 /tmp 或本機的狀態檔 (檢查 server_pid 是否存活)"""
    for path in [STATUS_FILE_LOCAL, STATUS_FILE_TMP]:
        if path and os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    pid = data.get("server_pid")
                    if pid and is_pid_alive(pid):
                        # 如果存的是多任務格式
                        if "tasks" in data:
                            return data["tasks"].get("default", next(iter(data["tasks"].values()), None))
                        if data.get("is_running"):
                            return data
            except Exception:
                pass
    return None


def cleanup_status_files():
    """關閉伺服器或結束進程時，標記任務為待機停止狀態並妥善存檔，保留上次設定結果不刪除 /tmp 暫存檔"""
    try:
        with _LOCK:
            for t in _TASKS.values():
                t["is_running"] = False
                t["countdown"] = 0
            save_runtime_status()
    except Exception:
        pass
