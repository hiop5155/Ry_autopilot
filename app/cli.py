#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
終端機互動模式 (app/cli.py)
提供終端友善之互動問答、即時時刻表列車清單選單、
常駐 Chrome Headless 高速輪詢監控與訂票成功存檔。
"""

import sys
import time
import random
from datetime import datetime
from typing import List, Dict, Any

from .config import load_config, save_config, validate_time_range
from .stations import get_station_fullname, get_station_name, get_station_code
from .timetable import query_train_timetable
from .booking_engine import BookingEngine

# ANSI 顏色標籤
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def prompt_input(prompt_text: str, default_val: str) -> str:
    """提供預設值的互動輸入"""
    user_val = input(f"{prompt_text} [{BOLD}{CYAN}{default_val}{RESET}]: ").strip()
    return user_val if user_val else default_val

def render_train_table(trains: List[Dict[str, Any]]) -> None:
    """美化輸出時刻表班次資訊"""
    print(f"\n{BOLD}{CYAN}時段內可追蹤之列車班次清單：{RESET}")
    print("┌───┬──────┬──────────────┬──────────┬──────────┬────────────┬─────────────┐")
    print("│ # │ 車次 │ 車種         │ 出發時間 │ 抵達時間 │ 行車歷時   │ 行駛區間    │")
    print("├───┼──────┼──────────────┼──────────┼──────────┼────────────┼─────────────┤")
    for idx, t in enumerate(trains, 1):
        idx_str = str(idx).center(3)
        no_str = t["train_no"].center(6)
        type_str = t["train_type"].ljust(12)
        # 處理中文字元寬度排版
        dep_str = t["start_time"].center(10)
        arr_str = t["end_time"].center(10)
        dur_str = t["duration"].center(12)
        route_str = (t.get("route") or "-").center(13)
        print(f"│{idx_str}│{no_str}│ {t['train_type']:<11}│{dep_str}│{arr_str}│{dur_str}│{route_str}│")
    print("└───┴──────┴──────────────┴──────────┴──────────┴────────────┴─────────────┘")

def run_cli_interactive(debug: bool = False):
    """CLI 互動問答主流程"""
    cfg = load_config()

    print(f"\n{BOLD}{CYAN}===================================================={RESET}")
    print(f"{BOLD}{CYAN}    鐵路票務自動 Polling 監控系統 (終端互動模式)     {RESET}")
    if debug:
        print(f"{BOLD}{YELLOW}           >>> DEBUG 詳細除錯模式已開啟 <<<          {RESET}")
    print(f"{BOLD}{CYAN}===================================================={RESET}\n")

    # 1. 互動式詢問PID號 (支援輸入 gen 隨機生成)
    from .id_helper import validate_roc_id, generate_roc_id

    raw_pid = prompt_input("1. 請輸入訂票PID號 (輸入 g 可隨機生成)", cfg.get("pid", "A153457990")).strip().upper()
    if raw_pid.lower() in ("g", "gen", "rand", "random"):
        pid = generate_roc_id()
        print(f"   {GREEN}🎲 已隨機生成合規PID號: {BOLD}{pid}{RESET}")
    else:
        pid = raw_pid
        if not validate_roc_id(pid):
            print(f"   {YELLOW}[提醒] PID號檢核碼未完全符合內政部規則，請確認是否正確。{RESET}")
    
    # 2. 乘車日期
    ride_date = prompt_input("2. 請輸入乘車日期 (格式 YYYY/MM/DD)", cfg.get("ride_date", "2026/09/24"))
    
    # 3. 起訖站 (支援輸入站名或代碼，一律轉為標準站號)
    start_raw = prompt_input("3. 請輸入出發站 (站名或代碼)", cfg.get("start_station", "1000"))
    end_raw = prompt_input("4. 請輸入抵達站 (站名或代碼)", cfg.get("end_station", "1020"))
    start_station = get_station_code(start_raw)
    end_station = get_station_code(end_raw)
    print(f"   出發站: {BOLD}{get_station_fullname(start_station)}{RESET} | 抵達站: {BOLD}{get_station_fullname(end_station)}{RESET}")


    # 4. 時段 (起訖時間需在 8 小時內)
    start_time = prompt_input("5. 請輸入查詢起始時間 (HH:MM)", cfg.get("start_time", "10:00"))
    end_time = prompt_input("6. 請輸入查詢結束時間 (HH:MM，上限8小時)", cfg.get("end_time", "18:00"))
    start_time, end_time = validate_time_range(start_time, end_time)

    # 5. 張數
    qty = int(prompt_input("7. 請輸入訂票張數 (1~9)", str(cfg.get("ticket_qty", 1))))

    # 自動保存這次輸入至 config.json
    save_config({
        "pid": pid, "ride_date": ride_date, "start_station": start_station,
        "end_station": end_station, "start_time": start_time, "end_time": end_time,
        "ticket_qty": qty
    })

    # 6. 線上即時查詢列車時刻表
    print(f"\n{CYAN}[*] 正在向官方系統查詢 {ride_date} ({start_time}~{end_time}) {get_station_fullname(start_station)} ➔ {get_station_fullname(end_station)} 之所有班次...{RESET}")
    trains = query_train_timetable(ride_date, start_station, end_station, start_time, end_time)

    target_trains: List[str] = []
    if not trains:
        print(f"{YELLOW}[提醒] 該時段內未查得直達列車，將採用時段全域自動比對模式。{RESET}")
    else:
        render_train_table(trains)
        sel_input = input(f"\n請選擇要追蹤的車次 (輸入編號如 {BOLD}1{RESET}，或車次號碼如 {BOLD}442{RESET}，多選用逗號隔開；直接按 Enter 追蹤時段內全部): ").strip()

        if sel_input:
            parts = [p.strip() for p in sel_input.replace("，", ",").split(",") if p.strip()]
            for p in parts:
                # 判斷是序號還是車次號碼
                if p.isdigit():
                    num = int(p)
                    if 1 <= num <= len(trains):
                        target_trains.append(trains[num - 1]["train_no"])
                    else:
                        target_trains.append(p)
                else:
                    target_trains.append(p)

    # 整理監控目標描述
    if target_trains:
        target_desc = f"鎖定指定車次: {', '.join(target_trains)} 次"
    else:
        target_desc = f"監控時段 {start_time}~{end_time} 內所有班次 (有票即搶)"

    print(f"\n{BOLD}{GREEN}===================================================={RESET}")
    print(f"{BOLD}{GREEN}      開始啟動常駐 Chrome 進行自動 Polling 撿票     {RESET}")
    print(f"{BOLD}{GREEN}===================================================={RESET}")
    print(f"  * 乘車日期: {BOLD}{YELLOW}{ride_date}{RESET}")
    print(f"  * 監控區間: {BOLD}{get_station_fullname(start_station)} ➔ {get_station_fullname(end_station)}{RESET}")
    print(f"  * 監控目標: {BOLD}{YELLOW}{target_desc}{RESET}")
    print(f"  * 訂票張數: {BOLD}{qty}{RESET} 張 | PID號: {BOLD}{pid[:3]}****{pid[-3:]}{RESET}")
    print(f"  * 檔案存檔: {CYAN}successful_tickets.txt / successful_tickets.json{RESET}")
    print(f"{BOLD}{GREEN}===================================================={RESET}\n")

    # 7. 啟動訂票引擎
    interval = float(cfg.get("poll_interval_seconds", 10.0))
    jitter = float(cfg.get("poll_jitter_seconds", 3.0))

    engine = BookingEngine(headless=True, debug=debug)
    round_count = 0

    try:
        print(f"{CYAN}[INFO] 正在建立常駐 Headless Chrome 背景程序...{RESET}", flush=True)
        engine.start()
        print(f"{GREEN}[INFO] 瀏覽器常駐就緒，正式進入監控循環 (隨時可按 Ctrl+C 停止)！{RESET}\n", flush=True)

        while True:
            round_count += 1
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{now_str}] [第 {round_count} 次查詢] 檢查 {target_desc} 餘票中...", end="", flush=True)

            # 依車次或依時段下訂
            if target_trains and len(target_trains) <= 3:
                res = engine.book_by_train_numbers(pid, ride_date, start_station, end_station, target_trains, qty)
            else:
                res = engine.book_by_time(pid, ride_date, start_station, end_station, start_time, end_time, qty)

            if res.get("success"):
                # 訂票成功！
                booking_code = res.get("booking_code", "未知代碼")
                trip_info = res.get("trip_info", f"{start_station} -> {end_station}")
                train_info = f"{res.get('train_type', '')} {res.get('train_no', '')} 次"
                seat_info = res.get("seat", "系統配位")
                pay_deadline = res.get("pay_deadline", "依官方規定")

                # 發出終端提示音
                sys.stdout.write("\a\a\a")
                sys.stdout.flush()

                print(f"\n\n{BOLD}{GREEN}===================================================={RESET}")
                print(f"{BOLD}{GREEN}🎉🎉🎉 恭喜！成功搶到車票！訂票已確認！ 🎉🎉🎉{RESET}")
                print(f"{BOLD}{GREEN}===================================================={RESET}")
                print(f"  * 電腦取票代碼 : {BOLD}{YELLOW}{booking_code}{RESET}")
                print(f"  * 取票PID號 : {BOLD}{pid}{RESET}")
                print(f"  * 乘車行程資訊 : {trip_info}")
                print(f"  * 搭乘車種車次 : {train_info}")
                print(f"  * 預定車廂座位 : {BOLD}{GREEN}{seat_info}{RESET}")
                print(f"  * 繳費取票期限 : {BOLD}{RED}{pay_deadline}{RESET}")
                print(f"{BOLD}{GREEN}===================================================={RESET}")
                print(f"{BOLD}[通知] 完整取票資料已永久保存至: {CYAN}successful_tickets.txt{RESET} 與 {CYAN}successful_tickets.json{RESET}！\n")
                break
            else:
                status = res.get("status")
                msg = res.get("msg", "")
                if status == "NO_SEATS":
                    print(f" {RED}[目前無剩餘座位，持續監控中...]{RESET}")
                elif status == "CAPTCHA_FAIL":
                    print(f" {YELLOW}[驗證碼辨識微誤，準備重試]{RESET}")
                else:
                    print(f" {YELLOW}[提示: {msg}]{RESET}")

                engine.reset_for_next_poll()

            # 計算隨機浮動秒數並平滑倒數
            actual_delay = round(max(2.0, interval + random.uniform(-jitter, jitter)), 2)
            poll_deadline = time.time() + actual_delay

            while True:
                remain = poll_deadline - time.time()
                if remain <= 0:
                    break
                sys.stdout.write(f"\r[{datetime.now().strftime('%H:%M:%S')}] 等待下次查詢: {remain:.2f} 秒 (間隔: {actual_delay:.2f}s)...   ")
                sys.stdout.flush()
                time.sleep(min(0.1, remain))
            sys.stdout.write("\r" + " " * 75 + "\r")
            sys.stdout.flush()

    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}[*] 使用者中斷程式 (Ctrl+C)，停止監控並釋放資源。{RESET}")
    finally:
        engine.close()
        print(f"{CYAN}[INFO] Chrome 瀏覽器程序已安全關閉。{RESET}")
