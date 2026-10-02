#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
資料持久化儲存模組 (app/storage.py)
負責將訂票成功的 PID、電腦取票代號、車次、座位與繳費期限存入 SQLite 資料庫 (autopilot.db)，
並輔助追加寫入 successful_tickets.txt 供本機純文字查閱。
"""

import sys
import os
from datetime import datetime
from typing import Dict, Any, List
from . import db


def get_txt_path() -> str:
    """取得人類可讀之 successful_tickets.txt 路徑 (固定於 ~/.Ry_autopilot/ 下)"""
    data_dir = db.get_app_data_dir()
    return os.path.join(data_dir, "successful_tickets.txt")


def save_ticket(info: Dict[str, Any]) -> bool:
    """將訂票結果永久寫入 SQLite 資料庫與文字日誌檔"""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. 寫入 SQLite tickets 表
    try:
        db.save_ticket(info)
    except Exception as e:
        print(f"[警告] 寫入 SQLite 資料庫失敗: {e}")

    # 2. 追加寫入人類易讀的 successful_tickets.txt
    txt_file = get_txt_path()
    banner = "=" * 60
    entry_txt = (
        f"\n{banner}\n"
        f"【訂票成功紀錄】 - 記錄時間: {now_str}\n"
        f"  * 訂票電腦代碼 : {info.get('booking_code', 'N/A')}\n"
        f"  * 取票PID號 : {info.get('pid', 'N/A')}\n"
        f"  * 乘車行程資訊 : {info.get('trip_info', 'N/A')}\n"
        f"  * 車種與車次號 : {info.get('train_type', '')} {info.get('train_no', 'N/A')} 次\n"
        f"  * 預定車廂座位 : {info.get('seat', 'N/A')}\n"
        f"  * 付款取票期限 : {info.get('pay_deadline', 'N/A')}\n"
        f"{banner}\n"
    )
    try:
        with open(txt_file, "a", encoding="utf-8") as f:
            f.write(entry_txt)
    except Exception as e:
        print(f"[警告] 寫入 {txt_file} 失敗: {e}")

    return True


def get_saved_tickets(port: int = None) -> List[Dict[str, Any]]:
    """自 SQLite 讀取所有歷史成功訂票紀錄 (依時間倒序排列)"""
    try:
        return db.get_all_tickets(port)
    except Exception as e:
        print(f"[警告] 讀取 SQLite 車票失敗: {e}")
        return []


def delete_saved_ticket(booking_code: str, pid: str = "") -> bool:
    """
    從 SQLite tickets 表中刪除指定訂票紀錄 (支援退票與過期刪除)。
    一筆 SQL 刪除，本次 Session 明細與歷史紀錄瞬間同步更新！
    """
    code_clean = str(booking_code).strip()
    if not code_clean:
        return False

    # 1. 自 SQLite 刪除
    ok = db.delete_ticket(code_clean, pid)

    # 2. 重新產生 successful_tickets.txt
    try:
        txt_file = get_txt_path()
        remaining = db.get_all_tickets()
        banner = "=" * 60
        txt_content = ""
        for r in remaining:
            c_time = r.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            txt_content += (
                f"\n{banner}\n"
                f"【訂票成功紀錄】 - 記錄時間: {c_time}\n"
                f"  * 訂票電腦代碼 : {r.get('booking_code', 'N/A')}\n"
                f"  * 取票PID號 : {r.get('pid', 'N/A')}\n"
                f"  * 乘車行程資訊 : {r.get('trip_info', 'N/A')}\n"
                f"  * 車種與車次號 : {r.get('train_type', '')} {r.get('train_no', 'N/A')} 次\n"
                f"  * 預定車廂座位 : {r.get('seat', 'N/A')}\n"
                f"  * 付款取票期限 : {r.get('pay_deadline', 'N/A')}\n"
                f"{banner}\n"
            )
        with open(txt_file, "w", encoding="utf-8") as f:
            f.write(txt_content)
    except Exception as e:
        print(f"[警告] 更新 {txt_file} 失敗: {e}")

    return ok
