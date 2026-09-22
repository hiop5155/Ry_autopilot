#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
背景自動撿票與輪詢工作線程模組 (app/web/worker.py)
負責排程查詢剩餘座位、分批訂票、志願序車次調度與結果更新。
支援多任務 (task_id) 獨立線程與狀態隔離。
"""

import time
import random
from typing import Dict, Any, List, Optional

from ..booking_engine import BookingEngine
from . import state


def polling_worker(
    pid: str,
    ride_date: str,
    start_station: str,
    end_station: str,
    start_time: str,
    end_time: str,
    target_trains: List[str],
    qty: int,
    split_mode: str = "single",
    interval: float = 10.0,
    jitter: float = 3.0,
    task_id: str = "default"
):
    lock = state.get_lock()
    curr_state = state.get_task_state(task_id)
    debug_mode = state.is_debug_mode()

    # 每個任務建立獨立的訂票引擎實例，支援平行獨立搶票
    engine = BookingEngine(headless=True, debug=debug_mode)
    round_count = 0

    # 判斷是否啟用拆成 N 筆 1 張 (逐張撿票)
    is_split = (split_mode == "split" and qty > 1)
    target_per_train = qty
    # 每次調用票務下訂的張數 (拆單為 1 張，整筆為目標張數)
    req_qty = 1 if is_split else target_per_train

    # 清理目標車次列表 (過濾空白並去重保序)
    clean_targets = []
    for t in target_trains:
        t_clean = str(t).strip()
        if t_clean and t_clean not in clean_targets:
            clean_targets.append(t_clean)

    # 追蹤每班目標車次已訂到幾張票
    train_booked_counts = {t: 0 for t in clean_targets}

    # 車次除以三無條件進位，切分成獨立的 req 批次列表: [req1, req2, ..., reqN]
    req_batches: List[List[str]] = [
        clean_targets[i:i + 3] for i in range(0, len(clean_targets), 3)
    ]

    remaining_trains = list(clean_targets)
    booked_tickets: List[Dict[str, Any]] = []

    with lock:
        curr_state["total_target_trains"] = list(clean_targets)
        curr_state["target_trains"] = list(remaining_trains)
        curr_state["booked_tickets"] = list(booked_tickets)
        curr_state["split_mode"] = split_mode
        curr_state["booked_count"] = 0
        curr_state["target_count"] = len(clean_targets) * target_per_train if clean_targets else qty
        state.save_runtime_status()

    def log(m: str):
        state.add_log(m, task_id=task_id)

    try:
        log("正在啟動背景常駐 Chrome 瀏覽器...")
        engine.start()
        log("瀏覽器已就緒，開始自動輪詢監控！")

        if clean_targets:
            total_reqs = len(req_batches)
            if is_split:
                log(f"目標車次共 {len(clean_targets)} 班: {', '.join(clean_targets)} (拆單模式: 分 {total_reqs} 筆請求，需每一班車各訂滿 {target_per_train} 張，每筆 1 張)")
            else:
                log(f"目標車次共 {len(clean_targets)} 班: {', '.join(clean_targets)} (整筆模式: 分 {total_reqs} 筆請求，需每一班車各訂到 1 筆 {target_per_train} 張)")
        else:
            if is_split:
                log(f"目標時段: {start_time}~{end_time} (拆單模式: 每次訂 1 張，累計搶滿 {qty} 張)")
            else:
                log(f"目標時段: {start_time}~{end_time} (依時段單程訂票，每筆 {qty} 張)")

        while True:
            with lock:
                if not curr_state["is_running"]:
                    break

            # ----------------------------------------------------
            # 模式 A: 指定特定車次列表 (每批上限 3 班，訂滿即移除)
            # ----------------------------------------------------
            if clean_targets:
                # 檢查所有 req 佇列是否均已全空 (代表所有車次均已滿額訂妥)
                all_batches_empty = all(len(b) == 0 for b in req_batches)
                if all_batches_empty:
                    with lock:
                        curr_state["is_running"] = False
                        curr_state["target_trains"] = []
                        state.save_runtime_status()
                    log(f"🎊 太棒了！所選之 {len(clean_targets)} 班車次均已全數訂滿 {target_per_train} 張！任務完成。")
                    break

                round_count += 1
                now_str = time.strftime("%H:%M:%S")

                with lock:
                    curr_state["round_count"] = round_count
                    curr_state["countdown"] = 0

                remaining_trains = [t for t in clean_targets if train_booked_counts[t] < target_per_train]
                rem_info = f"{len(remaining_trains)}/{len(clean_targets)} 班待訂: {', '.join(remaining_trains)}"
                log(f"[{now_str}] 第 {round_count} 次檢查座位 ({rem_info})...")

                # 依序執行各個非空訂票 req
                for b_idx, batch in enumerate(req_batches):
                    with lock:
                        if not curr_state["is_running"]:
                            break

                    # 若此 req 內的所有車次都已訂滿移除了，跳過此請求
                    if len(batch) == 0:
                        continue

                    batch_desc = f"批次 {b_idx + 1}/{len(req_batches)} ({', '.join(batch)})"
                    res = engine.book_by_train_numbers(
                        pid=pid,
                        ride_date=ride_date,
                        start_station=start_station,
                        end_station=end_station,
                        train_numbers=list(batch),
                        qty=req_qty,
                    )

                    if res.get("success"):
                        ticket_data = res.get("ticket_info") or res
                        booked_train = str(ticket_data.get("train_no", "")).strip()
                        booking_code = str(ticket_data.get("booking_code", "")).strip()

                        # 若車次欄位未解析出但該批次僅有一班車，保底使用該班車號
                        if not booked_train and len(batch) == 1:
                            booked_train = batch[0]
                            ticket_data["train_no"] = booked_train

                        # 增加該車次的訂票成功張數
                        inc = 1 if is_split else target_per_train
                        if booked_train in train_booked_counts:
                            train_booked_counts[booked_train] += inc
                        elif len(batch) == 1 and batch[0] in train_booked_counts:
                            booked_train = batch[0]
                            train_booked_counts[booked_train] += inc

                        # 若該車次累計已達到 target_per_train 張，從所有包含它的 req 佇列中移除
                        if booked_train in train_booked_counts and train_booked_counts[booked_train] >= target_per_train:
                            for b in req_batches:
                                if booked_train in b:
                                    b.remove(booked_train)

                        remaining_trains = [t for t in clean_targets if train_booked_counts[t] < target_per_train]

                        with lock:
                            booked_tickets.append(ticket_data)
                            curr_state["booked_tickets"] = list(booked_tickets)
                            curr_state["booked_count"] = len(booked_tickets)
                            curr_state["ticket_result"] = ticket_data
                            curr_state["target_trains"] = list(remaining_trains)
                            state.save_runtime_status()

                        if is_split:
                            curr_t_count = train_booked_counts.get(booked_train, 1)
                            log(f"🎉 撿票成功！車次 {booked_train} | 訂票代碼：{booking_code} (進度: {curr_t_count}/{target_per_train} 張)")
                        else:
                            completed_count = len(clean_targets) - len(remaining_trains)
                            log(f"🎉 撿票成功！車次 {booked_train} | 訂票代碼：{booking_code} (進度: {completed_count}/{len(clean_targets)} 班)")

                        # 檢查所有 req 批次是否已全空 (代表所有目標車次全滿)
                        if all(len(b) == 0 for b in req_batches):
                            with lock:
                                curr_state["is_running"] = False
                                curr_state["target_trains"] = []
                                state.save_runtime_status()
                            log(f"🎊 太棒了！所選之 {len(clean_targets)} 班車次均已全數訂滿 {target_per_train} 張！任務完成。")
                            break
                        else:
                            if is_split:
                                rem_status_list = [f"{t}({train_booked_counts[t]}/{target_per_train})" for t in clean_targets if train_booked_counts[t] < target_per_train]
                                log(f"📌 各班待訂進度：{', '.join(rem_status_list)}，持續撿票監控中...")
                            else:
                                log(f"📌 剩餘待訂車次：{', '.join(remaining_trains)}，持續撿票監控中...")
                            engine.reset_for_next_poll()

                    else:
                        status = res.get("status")
                        last_ocr = res.get("last_ocr", "")
                        ocr_hint = f" (OCR: {last_ocr})" if last_ocr else ""

                        if status == "NO_SEATS":
                            log_msg = f"[{now_str}] [{batch_desc}] 目前無剩餘座位{ocr_hint}"
                        elif status == "CAPTCHA_FAIL":
                            log_msg = f"[{now_str}] [{batch_desc}] 驗證碼微誤{ocr_hint}，換圖再試"
                        else:
                            log_msg = f"[{now_str}] [{batch_desc}] 訂票反饋: {res.get('msg', '無座位')}{ocr_hint}"
                        log(log_msg)
                        engine.reset_for_next_poll()

                    # 批次間停留 0.5 ~ 1.0 秒
                    if b_idx < len(req_batches) - 1:
                        time.sleep(random.uniform(0.5, 1.0))

                # 檢查整輪結束後是否已全數完成
                if all(len(b) == 0 for b in req_batches):
                    with lock:
                        curr_state["is_running"] = False
                        curr_state["target_trains"] = []
                        state.save_runtime_status()
                    log(f"🎊 太棒了！所選之 {len(clean_targets)} 班車次均已全數訂滿 {target_per_train} 張！任務完成。")
                    break

            # ----------------------------------------------------
            # 模式 B: 依時段單程訂票 (由官方系統挑選時段內合適車次)
            # ----------------------------------------------------
            else:
                if is_split:
                    rem_info = f"已訂 {len(booked_tickets)}/{target_ticket_count} 張"
                    log(f"[{now_str}] 第 {round_count} 次檢查時段 {start_time}~{end_time} 座位 ({rem_info})...")
                else:
                    log(f"[{now_str}] 第 {round_count} 次檢查時段 {start_time}~{end_time} 座位狀態中...")

                res = engine.book_by_time(
                    pid=pid,
                    ride_date=ride_date,
                    start_station=start_station,
                    end_station=end_station,
                    start_time=start_time,
                    end_time=end_time,
                    qty=req_qty,
                )

                if res.get("success"):
                    ticket_data = res.get("ticket_info") or res
                    booking_code = ticket_data.get("booking_code", "")

                    with lock:
                        booked_tickets.append(ticket_data)
                        curr_state["booked_tickets"] = list(booked_tickets)
                        curr_state["booked_count"] = len(booked_tickets)
                        curr_state["ticket_result"] = ticket_data

                        if is_split:
                            log(f"🎉 撿票成功！訂票代碼：{booking_code} (進度: {len(booked_tickets)}/{target_ticket_count} 張)")
                        else:
                            log(f"🎉 撿票成功！訂票電腦代碼：{booking_code}")

                        state.save_runtime_status()

                    if is_split and len(booked_tickets) >= target_ticket_count:
                        with lock:
                            curr_state["is_running"] = False
                        log(f"🎊 已成功訂妥全部 {target_ticket_count} 張車票（共 {len(booked_tickets)} 筆訂單）！任務完成。")
                        break
                    elif not is_split:
                        with lock:
                            curr_state["is_running"] = False
                        log("🎊 恭喜！已成功訂得車票！任務結束。")
                        break
                    else:
                        log(f"📌 目前已取得 {len(booked_tickets)} 張，尚缺 {target_ticket_count - len(booked_tickets)} 張，持續撿票監控中...")
                        engine.reset_for_next_poll()
                else:
                    status = res.get("status")
                    last_ocr = res.get("last_ocr", "")
                    ocr_hint = f" (OCR: {last_ocr})" if last_ocr else ""
                    finish_str = time.strftime("%H:%M:%S")

                    if status == "NO_SEATS":
                        log_msg = f"[{finish_str}] 目前無剩餘座位{ocr_hint}，等待下次重新查詢..."
                    elif status == "CAPTCHA_FAIL":
                        log_msg = f"[{finish_str}] 驗證碼微誤{ocr_hint}，等待後重新整理再試..."
                    else:
                        log_msg = f"[{finish_str}] {res.get('msg', '查詢完畢')}，等待下次查詢..."

                    log(log_msg)
                    engine.reset_for_next_poll()

            # 該輪檢查結束，隨機倒數等待進入下一輪
            actual_delay = max(2.0, interval + random.uniform(-jitter, jitter))
            sleep_end = time.time() + actual_delay
            while time.time() < sleep_end:
                with lock:
                    if not curr_state["is_running"]:
                        break
                    curr_state["countdown"] = round(max(0.0, sleep_end - time.time()), 1)
                time.sleep(0.5)

            with lock:
                curr_state["countdown"] = 0

    except Exception as e:
        with lock:
            curr_state["countdown"] = 0
            curr_state["is_running"] = False
        log(f"發生異常: {e}")
    finally:
        try:
            engine.close()
        except Exception:
            pass
        with lock:
            curr_state["is_running"] = False
            curr_state["countdown"] = 0
            state.set_task_thread(task_id, None)
        state.save_runtime_status()
