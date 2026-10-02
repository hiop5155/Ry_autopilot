#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite 統一資料庫管理模組 (app/db.py)
提供全系統唯一的真相來源 (Single Source of Truth, SSOT)，支援多 Port 隔離、
多任務 (Multi-task Session) 配置與狀態持久化、以及車票原子性 CRUD。
"""

import sys
import os
import json
import sqlite3
import time
import uuid
from typing import Dict, Any, List, Optional

_DB_FILE_PATH: str = ""


def get_app_data_dir() -> str:
    """取得應用程式專屬資料目錄 (固定為 ~/.Ry_autopilot/)，確保在任何路徑執行皆有一致的資料庫"""
    home = os.path.expanduser("~")
    data_dir = os.path.join(home, ".Ry_autopilot")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir


def get_db_path() -> str:
    """取得資料庫檔案絕對路徑 (固定為 ~/.Ry_autopilot/autopilot.db)"""
    global _DB_FILE_PATH
    if not _DB_FILE_PATH:
        data_dir = get_app_data_dir()
        _DB_FILE_PATH = os.path.join(data_dir, "autopilot.db")
    return _DB_FILE_PATH


def get_connection() -> sqlite3.Connection:
    """建立執行緒安全的 SQLite 連線，啟用 WAL 模式大幅提升並發與寫入性能"""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


def init_db():
    """初始化 SQLite 資料表結構 (若未存在則自動建立)"""
    conn = get_connection()
    try:
        with conn:
            # 1. 任務表 (以 port + task_id 為複合主鍵)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                port               INTEGER NOT NULL,
                task_id            TEXT NOT NULL,
                name               TEXT NOT NULL,
                session_id         INTEGER DEFAULT 1,
                is_running         INTEGER DEFAULT 0,
                pid                TEXT DEFAULT '',
                ride_date          TEXT DEFAULT '',
                start_station      TEXT DEFAULT '1000',
                start_station_name TEXT DEFAULT '臺北',
                end_station        TEXT DEFAULT '1020',
                end_station_name   TEXT DEFAULT '板橋',
                start_time         TEXT DEFAULT '08:00',
                end_time           TEXT DEFAULT '12:00',
                ticket_qty         INTEGER DEFAULT 1,
                split_mode         TEXT DEFAULT 'single',
                target_trains      TEXT DEFAULT '[]',
                cached_trains      TEXT DEFAULT '[]',
                round_count        INTEGER DEFAULT 0,
                countdown          INTEGER DEFAULT 0,
                booked_count       INTEGER DEFAULT 0,
                target_count       INTEGER DEFAULT 1,
                ticket_result      TEXT DEFAULT NULL,
                last_log           TEXT DEFAULT '',
                logs               TEXT DEFAULT '[]',
                last_update        REAL DEFAULT 0,
                PRIMARY KEY (port, task_id)
            );
            """)

            # 2. 車票表 (以 booking_code 為唯一主鍵，關聯 port 與 task_id)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                booking_code  TEXT PRIMARY KEY,
                port          INTEGER NOT NULL,
                task_id       TEXT NOT NULL,
                task_name     TEXT DEFAULT '',
                session_id    INTEGER NOT NULL,
                pid           TEXT DEFAULT '',
                train_no      TEXT DEFAULT '',
                train_type    TEXT DEFAULT '',
                seat          TEXT DEFAULT '',
                ticket_qty    INTEGER DEFAULT 1,
                ride_date     TEXT DEFAULT '',
                start_station TEXT DEFAULT '',
                end_station   TEXT DEFAULT '',
                trip_info     TEXT DEFAULT '',
                pay_deadline  TEXT DEFAULT '',
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 自動檢查並向既有 tickets 表擴充 ticket_qty 欄位 (向下相容)
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(tickets);")
            columns = [r[1] for r in cur.fetchall()]
            if "ticket_qty" not in columns:
                try:
                    conn.execute("ALTER TABLE tickets ADD COLUMN ticket_qty INTEGER DEFAULT 1;")
                except Exception:
                    pass

            # 建立常用查詢索引
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_port ON tasks(port);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_port_task ON tickets(port, task_id, session_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);")
    finally:
        conn.close()


def _row_to_task_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """將 SQLite 查詢出來的 row 轉換為標準任務字典"""
    if not row:
        return {}
    d = dict(row)
    # 反序列化 JSON 欄位
    for col in ["target_trains", "cached_trains", "logs"]:
        try:
            d[col] = json.loads(d.get(col) or "[]")
        except Exception:
            d[col] = []
    try:
        tr = d.get("ticket_result")
        d["ticket_result"] = json.loads(tr) if tr else None
    except Exception:
        d["ticket_result"] = None

    d["is_running"] = bool(d.get("is_running", 0))
    d["id"] = d.get("task_id", "")
    return d


# =========================================================================
# Task 任務 CRUD 模組
# =========================================================================

def get_all_tasks(port: int) -> List[Dict[str, Any]]:
    """取得指定 port 底下所有任務清單"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM tasks WHERE port = ? ORDER BY rowid ASC", (port,))
        rows = cur.fetchall()
        return [_row_to_task_dict(r) for r in rows]
    finally:
        conn.close()


def get_task(port: int, task_id: str) -> Optional[Dict[str, Any]]:
    """取得指定 port 與 task_id 的任務詳情"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM tasks WHERE port = ? AND task_id = ?", (port, task_id))
        row = cur.fetchone()
        if row:
            return _row_to_task_dict(row)
        return None
    finally:
        conn.close()


def upsert_task(port: int, task: Dict[str, Any]):
    """儲存或更新指定任務的所有 Config 與執行狀態"""
    conn = get_connection()
    try:
        task_id = str(task.get("id") or task.get("task_id") or "default").strip()
        name = str(task.get("name") or "任務 1").strip()
        session_id = int(task.get("session_id", 1))
        is_running = 1 if task.get("is_running") else 0
        pid = str(task.get("pid", "")).strip()
        ride_date = str(task.get("ride_date", "")).strip()
        start_station = str(task.get("start_station", "1000")).strip()
        start_station_name = str(task.get("start_station_name", "臺北")).strip()
        end_station = str(task.get("end_station", "1020")).strip()
        end_station_name = str(task.get("end_station_name", "板橋")).strip()
        start_time = str(task.get("start_time", "08:00")).strip()
        end_time = str(task.get("end_time", "12:00")).strip()
        ticket_qty = int(task.get("ticket_qty", 1))
        split_mode = str(task.get("split_mode", "single")).strip()
        
        target_trains_json = json.dumps(task.get("target_trains", []), ensure_ascii=False)
        cached_trains_json = json.dumps(task.get("cached_trains", []), ensure_ascii=False)
        
        round_count = int(task.get("round_count", 0))
        countdown = int(task.get("countdown", 0))
        booked_count = int(task.get("booked_count", 0))
        target_count = int(task.get("target_count", 1))
        
        tr = task.get("ticket_result")
        ticket_result_json = json.dumps(tr, ensure_ascii=False) if tr else None
        last_log = str(task.get("last_log", "")).strip()
        logs_json = json.dumps(task.get("logs", []), ensure_ascii=False)
        last_update = float(task.get("last_update") or time.time())

        with conn:
            conn.execute("""
            INSERT INTO tasks (
                port, task_id, name, session_id, is_running,
                pid, ride_date, start_station, start_station_name,
                end_station, end_station_name, start_time, end_time,
                ticket_qty, split_mode, target_trains, cached_trains,
                round_count, countdown, booked_count, target_count,
                ticket_result, last_log, logs, last_update
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
            )
            ON CONFLICT(port, task_id) DO UPDATE SET
                name = excluded.name,
                session_id = excluded.session_id,
                is_running = excluded.is_running,
                pid = excluded.pid,
                ride_date = excluded.ride_date,
                start_station = excluded.start_station,
                start_station_name = excluded.start_station_name,
                end_station = excluded.end_station,
                end_station_name = excluded.end_station_name,
                start_time = excluded.start_time,
                end_time = excluded.end_time,
                ticket_qty = excluded.ticket_qty,
                split_mode = excluded.split_mode,
                target_trains = excluded.target_trains,
                cached_trains = excluded.cached_trains,
                round_count = excluded.round_count,
                countdown = excluded.countdown,
                booked_count = excluded.booked_count,
                target_count = excluded.target_count,
                ticket_result = excluded.ticket_result,
                last_log = CASE 
                    WHEN excluded.last_log IS NOT NULL AND excluded.last_log != '' THEN excluded.last_log 
                    ELSE tasks.last_log 
                END,
                logs = CASE 
                    WHEN excluded.logs IS NOT NULL AND excluded.logs != '[]' AND json_array_length(excluded.logs) >= json_array_length(COALESCE(tasks.logs, '[]')) THEN excluded.logs 
                    ELSE tasks.logs 
                END,
                last_update = excluded.last_update;
            """, (
                port, task_id, name, session_id, is_running,
                pid, ride_date, start_station, start_station_name,
                end_station, end_station_name, start_time, end_time,
                ticket_qty, split_mode, target_trains_json, cached_trains_json,
                round_count, countdown, booked_count, target_count,
                ticket_result_json, last_log, logs_json, last_update
            ))
    finally:
        conn.close()


def update_task_fields(port: int, task_id: str, fields: Dict[str, Any]) -> bool:
    """
    精準更新指定任務的一個或多個特定欄位，絕不觸碰或覆蓋其他未指定的欄位 (例如 logs)。
    自動處理 JSON 欄位序列化與時間戳更新。
    """
    if not fields:
        return False
    
    json_cols = {"target_trains", "cached_trains", "ticket_result"}
    clean_fields = {}
    for k, v in fields.items():
        if k in json_cols and not isinstance(v, str):
            clean_fields[k] = json.dumps(v, ensure_ascii=False) if v is not None else None
        elif k == "is_running":
            clean_fields[k] = 1 if v else 0
        else:
            clean_fields[k] = v
            
    if "last_update" not in clean_fields:
        clean_fields["last_update"] = time.time()
        
    set_clauses = [f"{k} = ?" for k in clean_fields.keys()]
    values = list(clean_fields.values())
    values.extend([port, task_id])
    
    conn = get_connection()
    try:
        with conn:
            cur = conn.cursor()
            cur.execute(f"UPDATE tasks SET {', '.join(set_clauses)} WHERE port = ? AND task_id = ?", tuple(values))
            return cur.rowcount > 0
    finally:
        conn.close()


def add_task_log(port: int, task_id: str, msg: str):
    """追加任務日誌至資料庫，獨立維護 logs 陣列與 last_log，絕不干擾或覆蓋其他狀態欄位"""
    clean_msg = str(msg).strip()
    if not clean_msg:
        return
    conn = get_connection()
    try:
        with conn:
            cur = conn.cursor()
            cur.execute("SELECT logs FROM tasks WHERE port = ? AND task_id = ?", (port, task_id))
            row = cur.fetchone()
            if not row:
                return
            try:
                logs = json.loads(row[0] or "[]")
            except Exception:
                logs = []
            if not logs or logs[-1] != clean_msg:
                logs.append(clean_msg)
                # 保留最近 500 筆，避免無限制膨脹
                if len(logs) > 500:
                    logs = logs[-500:]
                now_ts = time.time()
                cur.execute("""
                    UPDATE tasks
                    SET logs = ?, last_log = ?, last_update = ?
                    WHERE port = ? AND task_id = ?
                """, (json.dumps(logs, ensure_ascii=False), clean_msg, now_ts, port, task_id))
    finally:
        conn.close()


def create_task(port: int, name: str = "") -> Dict[str, Any]:
    """於指定 port 建立新任務"""
    task_id = f"task_{int(time.time())}_{str(uuid.uuid4())[:4]}"
    existing = get_all_tasks(port)
    task_name = name.strip() if name.strip() else f"任務 {len(existing) + 1}"
    
    new_payload = {
        "id": task_id,
        "task_id": task_id,
        "name": task_name,
        "session_id": 1,
        "is_running": False,
        "pid": "",
        "ride_date": "",
        "start_station": "1000",
        "start_station_name": "臺北",
        "end_station": "1020",
        "end_station_name": "板橋",
        "start_time": "08:00",
        "end_time": "12:00",
        "ticket_qty": 1,
        "split_mode": "single",
        "target_trains": [],
        "cached_trains": [],
        "round_count": 0,
        "countdown": 0,
        "booked_count": 0,
        "target_count": 1,
        "ticket_result": None,
        "last_log": "系統待命中，請設定條件並查詢車次",
        "logs": ["系統待命中，請設定條件並查詢車次"],
        "last_update": time.time()
    }
    upsert_task(port, new_payload)
    return new_payload


def delete_task(port: int, task_id: str) -> bool:
    """刪除指定 port 的任務 (若僅剩一個則不允許刪除)"""
    existing = get_all_tasks(port)
    if len(existing) <= 1:
        return False
    conn = get_connection()
    try:
        with conn:
            conn.execute("DELETE FROM tasks WHERE port = ? AND task_id = ?", (port, task_id))
        return True
    finally:
        conn.close()


def rename_task(port: int, task_id: str, new_name: str) -> bool:
    """重新命名指定任務"""
    clean_name = new_name.strip()
    if not clean_name:
        return False
    conn = get_connection()
    try:
        with conn:
            conn.execute("UPDATE tasks SET name = ? WHERE port = ? AND task_id = ?", (clean_name, port, task_id))
        return True
    finally:
        conn.close()


# =========================================================================
# Ticket 車票 CRUD 模組
# =========================================================================

def save_ticket(ticket_dict: Dict[str, Any]):
    """
    保存訂票成功紀錄至 SQLite tickets 表。
    若已存在相同 booking_code 則覆蓋更新。
    """
    conn = get_connection()
    try:
        code = str(ticket_dict.get("booking_code", "")).strip()
        if not code:
            return
        port = int(ticket_dict.get("port", 0))
        task_id = str(ticket_dict.get("task_id", "default")).strip()
        task_name = str(ticket_dict.get("task_name", "")).strip()
        session_id = int(ticket_dict.get("session_id", 1))
        pid = str(ticket_dict.get("pid", "")).strip()
        train_no = str(ticket_dict.get("train_no", "")).strip()
        train_type = str(ticket_dict.get("train_type", "")).strip()
        seat = str(ticket_dict.get("seat", "")).strip()
        raw_qty = ticket_dict.get("ticket_qty") or ticket_dict.get("qty")
        if raw_qty is not None:
            try:
                ticket_qty = int(raw_qty)
            except Exception:
                ticket_qty = 1
        else:
            # 根據 seat 計算有幾個座位 (例如 "8車50號, 8車52號")
            import re
            m = re.findall(r'\d+\s*車\s*\d+\s*號', seat)
            ticket_qty = len(m) if m else 1

        ride_date = str(ticket_dict.get("ride_date", "")).strip()
        start_station = str(ticket_dict.get("start_station", "")).strip()
        end_station = str(ticket_dict.get("end_station", "")).strip()
        trip_info = str(ticket_dict.get("trip_info", "")).strip()
        pay_deadline = str(ticket_dict.get("pay_deadline") or ticket_dict.get("payment_deadline") or "").strip()
        created_at = str(ticket_dict.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")).strip()

        with conn:
            conn.execute("""
            INSERT INTO tickets (
                booking_code, port, task_id, task_name, session_id,
                pid, train_no, train_type, seat, ticket_qty, ride_date,
                start_station, end_station, trip_info, pay_deadline, created_at
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
            ON CONFLICT(booking_code) DO UPDATE SET
                port = excluded.port,
                task_id = excluded.task_id,
                task_name = excluded.task_name,
                session_id = excluded.session_id,
                pid = excluded.pid,
                train_no = excluded.train_no,
                train_type = excluded.train_type,
                seat = excluded.seat,
                ticket_qty = excluded.ticket_qty,
                ride_date = excluded.ride_date,
                start_station = excluded.start_station,
                end_station = excluded.end_station,
                trip_info = excluded.trip_info,
                pay_deadline = excluded.pay_deadline,
                created_at = excluded.created_at;
            """, (
                code, port, task_id, task_name, session_id,
                pid, train_no, train_type, seat, ticket_qty, ride_date,
                start_station, end_station, trip_info, pay_deadline, created_at
            ))
    finally:
        conn.close()


def get_session_tickets(port: int, task_id: str, session_id: int) -> List[Dict[str, Any]]:
    """取得指定 Task 在當前 Session 所訂到的所有車票 (供 Start/Stop 下方卡片使用)"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM tickets
            WHERE port = ? AND task_id = ? AND session_id = ?
            ORDER BY created_at ASC
        """, (port, task_id, session_id))
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_all_tickets(port: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    取得所有歷史成功訂票紀錄 (供 Booking History 彈窗使用)。
    若指定 port 則僅回傳該 port，若未指定則回傳全系統所有車票，依時間倒序排列。
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        if port:
            cur.execute("SELECT * FROM tickets WHERE port = ? ORDER BY created_at DESC", (port,))
        else:
            cur.execute("SELECT * FROM tickets ORDER BY created_at DESC")
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def delete_ticket(booking_code: str, pid: Optional[str] = None) -> bool:
    """
    從 SQLite tickets 表中刪除指定車票 (線上退票或過期刪除)。
    一筆 SQL 刪除，本次 Session 明細與歷史紀錄瞬間同步更新！
    """
    clean_code = str(booking_code).strip()
    if not clean_code:
        return False
    conn = get_connection()
    try:
        with conn:
            if pid:
                clean_pid = str(pid).strip()
                cur = conn.execute("DELETE FROM tickets WHERE booking_code = ? AND pid = ?", (clean_code, clean_pid))
            else:
                cur = conn.execute("DELETE FROM tickets WHERE booking_code = ?", (clean_code,))
            return cur.rowcount > 0
    finally:
        conn.close()
