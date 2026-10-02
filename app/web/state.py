#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Web 執行時狀態管理模組 (app/web/state.py)
採用 SQLite (app/db.py, autopilot.db) 作為唯一真相來源 (SSOT)。
支援多 Port 隔離、多任務配置、獨立 Session 車票管理與安全日誌維護，
"""

import sys
import os
import time
import threading
from typing import Dict, Any, List, Optional
from .. import db

_SERVER_PORT: int = 8080
_LOCK = threading.RLock()
_DEBUG_MODE: bool = False

# 記錄各任務專屬的背景監控線程 (純記憶體生命週期管理)
_TASK_THREADS: Dict[str, threading.Thread] = {}
# 記錄各任務專屬的停止訊號事件 (供 worker 零延遲響應)
_STOP_EVENTS: Dict[str, threading.Event] = {}


def init_status_paths(port: int):
    """
    依據伺服器啟用的 port 初始化資料庫與狀態。
    自動建表並將舊有 JSON 狀態無損遷移至 SQLite，重啟時將所有任務標記為待機狀態。
    """
    global _SERVER_PORT
    _SERVER_PORT = port
    with _LOCK:
        db.init_db()
        tasks = db.get_all_tasks(port)
        if not tasks:
            db.create_task(port, "任務 1")
            tasks = db.get_all_tasks(port)

        # 伺服器啟動時將所有任務的 is_running 歸 0，保證待命安全
        for t in tasks:
            if t.get("is_running"):
                t["is_running"] = False
                t["countdown"] = 0
                db.upsert_task(port, t)


def cleanup_status_files():
    """伺服器關閉時安全標記所有任務為待機狀態 (is_running = 0)"""
    with _LOCK:
        try:
            tasks = db.get_all_tasks(_SERVER_PORT)
            for t in tasks:
                if t.get("is_running"):
                    t["is_running"] = False
                    t["countdown"] = 0
                    db.upsert_task(_SERVER_PORT, t)
        except Exception:
            pass


def set_debug_mode(debug: bool):
    global _DEBUG_MODE
    _DEBUG_MODE = debug


def is_debug_mode() -> bool:
    return _DEBUG_MODE


def get_lock() -> threading.RLock:
    return _LOCK


def get_server_port() -> int:
    return _SERVER_PORT


def get_task_state(task_id: Optional[str] = None) -> Dict[str, Any]:
    """
    取得指定任務狀態與配置。
    自動自 SQLite tickets 表動態加載當前 Session 所訂得的車票，保證資料絕對一致。
    """
    with _LOCK:
        tasks = db.get_all_tasks(_SERVER_PORT)
        target = None
        if task_id:
            for t in tasks:
                if t.get("task_id") == task_id or t.get("id") == task_id:
                    target = t
                    break
        if not target and tasks:
            target = tasks[0]
        if not target:
            target = db.create_task(_SERVER_PORT, "任務 1")

        # 動態載入當前任務在當前 Session 的車票
        session_id = target.get("session_id", 1)
        tid = target.get("task_id") or target.get("id")
        session_tickets = db.get_session_tickets(_SERVER_PORT, tid, session_id)
        
        target["booked_tickets"] = session_tickets
        target["booked_count"] = len(session_tickets)
        if session_tickets:
            target["ticket_result"] = session_tickets[-1]
            
        target["server_pid"] = os.getpid()
        return target


def get_all_tasks_summary() -> List[Dict[str, Any]]:
    """回傳指定 port 底下所有任務之簡明摘要 (供分頁導航列即時切換)"""
    with _LOCK:
        tasks = db.get_all_tasks(_SERVER_PORT)
        summary = []
        for t in tasks:
            tid = t.get("task_id") or t.get("id")
            session_id = t.get("session_id", 1)
            session_tickets = db.get_session_tickets(_SERVER_PORT, tid, session_id)
            summary.append({
                "id": tid,
                "name": t.get("name", "未命名任務"),
                "is_running": bool(t.get("is_running", False)),
                "round_count": t.get("round_count", 0),
                "start_station_name": t.get("start_station_name", "出發"),
                "end_station_name": t.get("end_station_name", "抵達"),
                "ride_date": t.get("ride_date", ""),
                "booked_count": len(session_tickets),
                "target_count": t.get("target_count", 1),
                "last_log": t.get("last_log", ""),
                "has_success": len(session_tickets) > 0 or bool(t.get("ticket_result"))
            })
        return summary


def create_new_task(name: str = "") -> Dict[str, Any]:
    """建立一個全新撿票任務並存入 SQLite"""
    with _LOCK:
        return db.create_task(_SERVER_PORT, name)


def delete_task(task_id: str) -> bool:
    """刪除指定任務 (若正在運行則先停止線程，且至少保留一個任務)"""
    with _LOCK:
        if task_id in _TASK_THREADS:
            del _TASK_THREADS[task_id]
        return db.delete_task(_SERVER_PORT, task_id)


def rename_task(task_id: str, new_name: str) -> bool:
    """重新命名指定任務"""
    with _LOCK:
        return db.rename_task(_SERVER_PORT, task_id, new_name)


def set_task_thread(task_id: str, thread: Optional[threading.Thread]):
    with _LOCK:
        if thread:
            _TASK_THREADS[task_id] = thread
        elif task_id in _TASK_THREADS:
            del _TASK_THREADS[task_id]


def get_task_thread(task_id: str) -> Optional[threading.Thread]:
    with _LOCK:
        return _TASK_THREADS.get(task_id)


def get_stop_event(task_id: str) -> threading.Event:
    with _LOCK:
        if task_id not in _STOP_EVENTS:
            _STOP_EVENTS[task_id] = threading.Event()
        return _STOP_EVENTS[task_id]


def is_task_running(task_id: str) -> bool:
    """判斷任務是否正在運行中"""
    with _LOCK:
        ev = _STOP_EVENTS.get(task_id)
        if ev and ev.is_set():
            return False
        th = _TASK_THREADS.get(task_id)
        if th and not th.is_alive():
            return False
        task = db.get_task(_SERVER_PORT, task_id)
        return bool(task.get("is_running", False)) if task else False


def start_task(task_id: str):
    """標記任務啟動，清除終止訊號"""
    with _LOCK:
        ev = get_stop_event(task_id)
        ev.clear()


def stop_task(task_id: str):
    """主動發送停止訊號至指定任務之背景線程，並即時更新 SQLite is_running = 0"""
    with _LOCK:
        if task_id in _STOP_EVENTS:
            _STOP_EVENTS[task_id].set()
        db.update_task_fields(_SERVER_PORT, task_id, {"is_running": 0, "countdown": 0})


def finish_task(task_id: str):
    """任務完成或線程退出時標記狀態為停止，並安全清理背景線程參照"""
    with _LOCK:
        if task_id in _STOP_EVENTS:
            _STOP_EVENTS[task_id].set()
        if task_id in _TASK_THREADS:
            del _TASK_THREADS[task_id]
        db.update_task_fields(_SERVER_PORT, task_id, {"is_running": 0, "countdown": 0})


def update_task_progress(task_id: str, round_count: int, countdown: float = 0.0):
    """即時更新當前任務輪次與倒數秒數"""
    db.update_task_fields(_SERVER_PORT, task_id, {"round_count": round_count, "countdown": countdown})


def save_runtime_status():
    """相容性介面：SQLite 每次異動即時自動寫入磁碟 (WAL)，此處保留作為防禦性呼叫"""
    pass


def add_log(msg: str, task_id: Optional[str] = None):
    """追加日誌並持久化至 SQLite"""
    with _LOCK:
        tid = task_id or "default"
        db.add_task_log(_SERVER_PORT, tid, msg)


def remove_booked_ticket(booking_code: str, pid: Optional[str] = None):
    """
    從 SQLite tickets 表中刪除指定車票 (線上退票或過期刪除)。
    一筆 SQL 刪除，本次 Session 明細與歷史紀錄瞬間同步更新！
    """
    with _LOCK:
        return db.delete_ticket(booking_code, pid)


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
    """相容性函數：SQLite 本身已為全行程共享之持久化資料庫"""
    return None

