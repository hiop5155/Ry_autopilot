#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
官方線上取消訂票與繳費期限檢核模組 (app/cancel_ticket.py)
"""

import re
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from .storage import get_saved_tickets, delete_saved_ticket


def parse_pay_deadline(deadline_str: str, base_year: Optional[int] = None) -> Optional[datetime]:
    """
    解析官方繳費期限字串為 datetime 物件。
    重要規則：
      "24:00" 代表隔日的 "00:00:00" (例如: 9/24 24:00 -> 9/25 00:00:00)。
    """
    if not deadline_str:
        return None

    if base_year is None:
        base_year = datetime.now().year

    clean_str = deadline_str.strip()

    # 1. 匹配 含年份格式: YYYY-MM-DD 或 YYYY/MM/DD ... HH:MM
    m_full = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2}).*?(\d{1,2}):(\d{2})', clean_str)
    if m_full:
        year = int(m_full.group(1))
        month = int(m_full.group(2))
        day = int(m_full.group(3))
        hour = int(m_full.group(4))
        minute = int(m_full.group(5))
        if hour == 24:
            base_dt = datetime(year, month, day, 0, minute)
            return base_dt + timedelta(days=1)
        return datetime(year, month, day, hour, minute)

    # 2. 匹配 MM/DD ... HH:MM (例: 09/22 (Tue) 24:00 或 09/21 16:34 (Mon))
    m_short = re.search(r'(\d{1,2})[/-](\d{1,2}).*?(\d{1,2}):(\d{2})', clean_str)
    if m_short:
        month = int(m_short.group(1))
        day = int(m_short.group(2))
        hour = int(m_short.group(3))
        minute = int(m_short.group(4))
        if hour == 24:
            base_dt = datetime(base_year, month, day, 0, minute)
            return base_dt + timedelta(days=1)
        return datetime(base_year, month, day, hour, minute)

    return None


def is_pay_deadline_passed(deadline_str: str, created_at: str = "") -> bool:
    """
    判斷車票之繳費期限是否已經截止。
    """
    base_year = datetime.now().year
    if created_at:
        m = re.search(r'(\d{4})', created_at)
        if m:
            base_year = int(m.group(1))

    deadline_dt = parse_pay_deadline(deadline_str, base_year=base_year)
    if not deadline_dt:
        return False

    return datetime.now() > deadline_dt


def cancel_ticket_online(
    pid: str,
    booking_code: str,
    headless: bool = True
) -> Dict[str, Any]:
    """
    向官方網站發出線上取消訂票請求。
    採用原生事件觸發 (點擊 #cancel -> 彈出 confirm -> 點擊 .btn-danger 取消訂票)，
    並以 WebDriverWait 驗證跳轉至 /complete 頁面且確認文字。
    """
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        query_url = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip115/query"
        driver.get(query_url)

        # 1. 填寫查詢表單
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, "pid")))
        driver.find_element(By.ID, "pid").clear()
        driver.find_element(By.ID, "pid").send_keys(pid.strip())

        driver.find_element(By.ID, "bookingcode").clear()
        driver.find_element(By.ID, "bookingcode").send_keys(booking_code.strip())

        # 送出查詢表單
        driver.execute_script("document.getElementById('queryForm').submit();")

        # 2. 等待跳轉至 queryHistory
        WebDriverWait(driver, 15).until(
            lambda d: "queryHistory" in d.current_url or "查無" in d.page_source or "complete" in d.current_url
        )

        page_source = driver.page_source
        if "查無訂票紀錄" in page_source or "查無" in page_source:
            return {
                "success": True,
                "already_cancelled": True,
                "message": "官方網站顯示查無此訂票紀錄 (可能已取消或已失效)"
            }

        # 檢查是否已是取消狀態
        if "已取消" in page_source or "訂單已取消" in page_source:
            return {
                "success": True,
                "already_cancelled": True,
                "message": "該訂票在官方網站已處於已取消狀態"
            }

        # 查找 #cancel 按鈕
        cancel_buttons = driver.find_elements(By.ID, "cancel")
        if not cancel_buttons:
            return {
                "success": False,
                "message": "查無取消訂票按鈕 (可能已付款或非可取消狀態)"
            }

        # 3. 點擊 #cancel 按鈕觸發官方原生 jQuery confirm 彈窗
        driver.execute_script("$('#cancel').click();")

        # 等待彈窗內的確認按鈕出現 (.btn-danger)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".jconfirm .btn-danger, .btn-danger"))
        )

        # 點擊「取消訂票」按鈕
        danger_buttons = driver.find_elements(By.CSS_SELECTOR, ".jconfirm .btn-danger, .btn-danger")
        if not danger_buttons:
            return {
                "success": False,
                "message": "未能定位到取消確認視窗中的確認按鈕"
            }

        driver.execute_script("arguments[0].click();", danger_buttons[0])

        # 4. 嚴格等待跳轉至 complete 頁面
        WebDriverWait(driver, 15).until(EC.url_contains("/complete"))

        # 5. 檢核頁面內容
        result_text = driver.find_element(By.TAG_NAME, "body").text
        if "已取消" in result_text or "訂單已取消" in result_text or "訂單代碼已成功取消" in result_text:
            return {
                "success": True,
                "message": "官方網站已成功取消訂票"
            }
        else:
            return {
                "success": False,
                "message": f"跳轉至完成頁但未識別到取消成功標記: {result_text[:150]}"
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"線上退票過程發生異常: {str(e)}"
        }
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass


def handle_ticket_cancellation(booking_code: str, pid: str = "") -> Dict[str, Any]:
    """
    統一處理車票取消與刪除流程：
      1. 依 booking_code 查出本機車票紀錄
      2. 判斷繳費期限是否已過
      3. 若已過期 -> 僅刪除本機存檔
      4. 若未過期 -> 先向官方發出線上取消，確認官網已釋出或取消後，再刪除本機存檔
    """
    clean_code = str(booking_code).strip()
    if not clean_code:
        return {"success": False, "msg": "未指定訂票代碼 (booking_code)"}

    tickets = get_saved_tickets()
    target_ticket = None
    for t in tickets:
        if str(t.get("booking_code", "")).strip() == clean_code:
            if not pid or str(t.get("pid", "")).strip() == str(pid).strip():
                target_ticket = t
                break

    if not target_ticket:
        return {"success": False, "msg": f"在歷史紀錄中未找到訂票代碼 {clean_code} 的車票"}

    ticket_pid = target_ticket.get("pid", pid).strip()
    pay_deadline = target_ticket.get("pay_deadline", "")
    created_at = target_ticket.get("created_at", "")

    # 判斷繳費期限是否過期
    is_expired = is_pay_deadline_passed(pay_deadline, created_at)

    if is_expired:
        # 情況 1: 繳費期限已過 -> 僅刪除 local 存檔
        ok = delete_saved_ticket(clean_code, ticket_pid)
        if ok:
            return {
                "success": True,
                "is_expired": True,
                "booking_code": clean_code,
                "msg": f"訂票 {clean_code} 繳費期限已逾期 ({pay_deadline})，已直接自本機紀錄刪除。"
            }
        else:
            return {
                "success": False,
                "is_expired": True,
                "booking_code": clean_code,
                "msg": f"訂票 {clean_code} 刪除本機紀錄失敗。"
            }
    else:
        # 情況 2: 繳費期限未過 -> 發出官方線上取消，成功後再刪除本機存檔
        cancel_res = cancel_ticket_online(ticket_pid, clean_code)
        if cancel_res.get("success"):
            delete_saved_ticket(clean_code, ticket_pid)
            return {
                "success": True,
                "is_expired": False,
                "booking_code": clean_code,
                "msg": f"官方網站已成功取消訂票 {clean_code}，並已自本機紀錄同步移除。"
            }
        else:
            return {
                "success": False,
                "is_expired": False,
                "booking_code": clean_code,
                "msg": f"官方網站線上退票失敗: {cancel_res.get('message', '未知原因')}，為保護資料完整，未刪除本機紀錄。"
            }
