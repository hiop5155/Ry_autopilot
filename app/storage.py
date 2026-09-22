#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
資料持久化儲存模組 (app/storage.py)
負責將訂票成功的PID號、電腦取票代號、車次、座位與繳費期限
同時追加寫入 successful_tickets.txt 與 successful_tickets.json。
"""

import sys
import os
import json
from datetime import datetime
from typing import Dict, Any, List

def get_storage_paths():
    if getattr(sys, 'frozen', False):
        root_dir = os.getcwd()
    else:
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    txt_file = os.path.join(root_dir, "successful_tickets.txt")
    json_file = os.path.join(root_dir, "successful_tickets.json")
    return txt_file, json_file

def save_ticket(info: Dict[str, Any]) -> bool:
    """將訂票結果永久寫入檔案"""
    txt_file, json_file = get_storage_paths()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. 寫入人類易讀的 successful_tickets.txt (追加模式)
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

    # 2. 寫入結構化 JSON 檔
    try:
        all_records = []
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as jf:
                    all_records = json.load(jf)
            except Exception:
                all_records = []
        all_records.append(info)
        with open(json_file, "w", encoding="utf-8") as jf:
            json.dump(all_records, jf, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[警告] 寫入 {json_file} 失敗: {e}")
        return False

def get_saved_tickets() -> List[Dict[str, Any]]:
    """讀取歷史成功訂票紀錄"""
    _, json_file = get_storage_paths()
    if os.path.exists(json_file):
        try:
            with open(json_file, "r", encoding="utf-8") as jf:
                return json.load(jf)
        except Exception:
            return []
    return []

def delete_saved_ticket(booking_code: str, pid: str = "") -> bool:
    """
    從 successful_tickets.json 與 successful_tickets.txt 中刪除指定訂票紀錄。
    若成功刪除回傳 True，未找到或失敗回傳 False。
    """
    txt_file, json_file = get_storage_paths()
    code_clean = str(booking_code).strip()
    if not code_clean:
        return False

    records = get_saved_tickets()
    remaining = []
    found = False

    for r in records:
        r_code = str(r.get("booking_code", "")).strip()
        r_pid = str(r.get("pid", "")).strip()
        if r_code == code_clean and (not pid or r_pid == str(pid).strip()):
            found = True
        else:
            remaining.append(r)

    if not found:
        return False

    # 1. 覆寫 JSON
    try:
        with open(json_file, "w", encoding="utf-8") as jf:
            json.dump(remaining, jf, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[警告] 更新 {json_file} 失敗: {e}")
        return False

    # 2. 重新產生 TXT
    try:
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

    return True
