#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
設定管理模組 (app/config.py)
負責讀取、更新設定檔，並提供時間範圍 8 小時限制之防呆校驗。
"""

import sys
import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

DEFAULT_CONFIG: Dict[str, Any] = {
    "base_url": "https://tip.railway.gov.tw",
    "host_header": "tip.railway.gov.tw",
    "ride_date": "2026/09/24",
    "train_no": "",
    "start_time": "10:00",
    "end_time": "18:00",
    "preferred_trains": ["442"],
    "start_station": "臺北",
    "end_station": "松山",
    "ticket_qty": 1,
    "split_mode": "single",
    "pid": "A153457990",
    "poll_interval_seconds": 10,
    "poll_jitter_seconds": 3,
    "web_port": 8080
}

def get_config_path() -> str:
    # 若為打包二進位檔 (frozen)，讀取當前工作目錄的 config.json
    if getattr(sys, 'frozen', False):
        return os.path.join(os.getcwd(), "config.json")
    # 專案根目錄下的 config.json
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(root_dir, "config.json")

def load_config() -> Dict[str, Any]:
    """載入設定檔，若不存在則回傳預設值。起訖站保留中文站名，同時提供標準 4 碼站號"""
    from .stations import get_station_code, get_station_name
    config = dict(DEFAULT_CONFIG)
    config_file = get_config_path()
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                user_conf = json.load(f)
                config.update(user_conf)
        except Exception as e:
            print(f"[WARN] 讀取 config.json 失敗，使用預設值: {e}")

    # 確保 start_station, end_station 為標準中文站名
    config["start_station"] = get_station_name(config.get("start_station", "臺北"))
    config["end_station"] = get_station_name(config.get("end_station", "板橋"))
    # 同時提供 4 碼站號供內部秒級查表與送請求
    config["start_station_code"] = get_station_code(config["start_station"])
    config["end_station_code"] = get_station_code(config["end_station"])
    return config


def save_config(new_config: Dict[str, Any]) -> bool:
    """更新並寫入設定檔，確保起訖站一律以中文站名寫入 config.json"""
    from .stations import get_station_name
    config_file = get_config_path()
    try:
        current = load_config()
        # 移除內部運算用欄位
        current.pop("start_station_code", None)
        current.pop("end_station_code", None)

        current.update(new_config)

        # 轉換起訖站為中文站名存檔
        if "start_station" in current:
            current["start_station"] = get_station_name(current["start_station"])
        if "end_station" in current:
            current["end_station"] = get_station_name(current["end_station"])

        # 再次移除可能被 update 進來的 code 欄位
        current.pop("start_station_code", None)
        current.pop("end_station_code", None)

        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[ERROR] 儲存 config.json 失敗: {e}")
        return False

def validate_time_range(start_time: str, end_time: str) -> Tuple[str, str]:
    """
    檢查並修正查詢時段：
    官方票務伺服器要求起訖時間差距必須小於等於 8 小時。
    若超過 8 小時或起始大於結束，自動校正為起始時間起算的 8 小時內。
    """
    start_time = (start_time or "10:00").strip()
    end_time = (end_time or "18:00").strip()

    try:
        t_start = datetime.strptime(start_time, "%H:%M")
        t_end = datetime.strptime(end_time, "%H:%M")
        diff_hours = (t_end - t_start).total_seconds() / 3600.0

        if diff_hours <= 0:
            t_max_end = min(t_start + timedelta(hours=8), t_start.replace(hour=23, minute=59))
            end_time = t_max_end.strftime("%H:%M")
        elif diff_hours > 8.0:
            t_max_end = min(t_start + timedelta(hours=8), t_start.replace(hour=23, minute=59))
            end_time = t_max_end.strftime("%H:%M")
    except Exception:
        start_time, end_time = "10:00", "18:00"

    return start_time, end_time
