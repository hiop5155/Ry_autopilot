#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
列車時刻表查詢模組 (app/timetable.py)
負責在使用者設定乘車日期、起訖站與時段後，
查詢官方時刻表，解析出所有班次的完整資訊（車次、車種、出發時間、到達時間、行駛歷時）。
"""

import re
import time
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

from .stations import get_station_fullname, get_station_code, get_station_name

def query_train_timetable(ride_date: str, start_station: str, end_station: str,
                          start_time: str = "00:00", end_time: str = "23:59") -> List[Dict[str, Any]]:
    """
    查詢指定日期、起訖站與時段內的所有列車資訊。
    回傳範例：
    [
        {
            "train_no": "442",
            "train_type": "新自強(3000)",
            "start_time": "17:05",
            "end_time": "20:07",
            "duration": "3 小時 2 分",
            "route": "樹林→臺東",
            "raw_name": "自強(3000) 442(樹林→臺東)"
        },
        ...
    ]
    """
    # 確保乘車日期格式為官方所要求的 YYYY/MM/DD
    ride_date = (ride_date or "").replace("-", "/").strip()
    start_full = get_station_fullname(start_station)
    end_full = get_station_fullname(end_station)

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    try:
        import socket
        addr_info = socket.getaddrinfo("tip.railway.gov.tw", None, socket.AF_INET)
        if addr_info:
            ipv4 = addr_info[0][4][0]
            options.add_argument(f"--host-resolver-rules=MAP tip.railway.gov.tw {ipv4}")
    except Exception:
        pass

    driver = None
    trains: List[Dict[str, Any]] = []

    try:
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        url = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime"
        driver.get(url)

        # 等待輸入框元素出現在 DOM 中 (最長等待 12 秒)
        start_input = WebDriverWait(driver, 12).until(
            EC.presence_of_element_located((By.ID, "startStation"))
        )
        end_input = WebDriverWait(driver, 12).until(
            EC.presence_of_element_located((By.ID, "endStation"))
        )

        # 填入起訖站 (透過 JavaScript 賦值並觸發事件，穩定度高且無延遲)
        driver.execute_script("""
            arguments[0].value = arguments[1];
            arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
        """, start_input, start_full)

        driver.execute_script("""
            arguments[0].value = arguments[1];
            arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
        """, end_input, end_full)

        # 填入日期 (必須為 YYYY/MM/DD 並觸發 change 事件)
        ride_date_el = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "rideDate"))
        )
        driver.execute_script("""
            arguments[0].value = arguments[1];
            arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
        """, ride_date_el, ride_date)

        # 填入時間起訖並觸發事件
        start_time_el = driver.find_element(By.ID, "startTime")
        end_time_el = driver.find_element(By.ID, "endTime")
        driver.execute_script("""
            arguments[0].value = arguments[1];
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
        """, start_time_el, start_time)
        driver.execute_script("""
            arguments[0].value = arguments[1];
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
        """, end_time_el, end_time)

        # 點擊送出查詢
        submit_btn = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='submit'][value='查詢']"))
        )
        driver.execute_script("arguments[0].click();", submit_btn)

        # 等待查詢結果載入 (等待 table 或查無結果提示)
        try:
            WebDriverWait(driver, 10).until(
                lambda d: len(d.find_elements(By.TAG_NAME, "table")) > 0 or
                          "查無" in d.page_source or "未找到" in d.page_source
            )
        except Exception:
            pass
        time.sleep(1)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        # 直接查找具有 trip-column 類別的列車主要資料列
        trip_rows = soup.find_all("tr", class_="trip-column")
        if not trip_rows:
            # fallback
            trip_rows = [tr for tr in soup.find_all("tr") if len(tr.find_all("td")) >= 4]

        for tr in trip_rows:
            tds = [td.get_text(strip=True) for td in tr.find_all("td")]
            if len(tds) >= 4:
                raw_train = tds[0]

                # 排除無需購票/直接刷卡進站之車種 (區間車、區間快車、復興號)
                if any(ex in raw_train for ex in ["區間車", "區間快", "區間", "復興號", "復興"]):
                    continue

                # 精確匹配車次 (排除自強3000型號字樣)
                m_no = re.search(r'(?:\)|\s|^)(\d{3,4})\s*\(', raw_train)
                if not m_no:
                    m_no = re.search(r'(?:自強|普悠瑪|太魯閣|莒光|\))\s*(\d{3,4})', raw_train)
                if not m_no:
                    continue
                train_no = m_no.group(1)

                # 提取車種
                t_type = "自強號"
                if "3000" in raw_train:
                    t_type = "新自強(3000)"
                elif "普悠瑪" in raw_train:
                    t_type = "普悠瑪"
                elif "太魯閣" in raw_train:
                    t_type = "太魯閣"
                elif "莒光" in raw_train:
                    t_type = "莒光號"
                elif "復興" in raw_train:
                    t_type = "復興號"
                elif "區間快" in raw_train:
                    t_type = "區間快"
                elif "區間" in raw_train:
                    t_type = "區間車"

                if t_type in ["區間車", "區間快", "復興號"]:
                    continue

                # 路線起訖點 (如 "樹林→臺東")
                m_route = re.search(r'\(([^)]+→[^)]+)\)', raw_train)
                route_info = m_route.group(1) if m_route else ""

                dep_time = tds[1]
                arr_time = tds[2]
                duration = tds[3]

                # 驗證時間格式 (HH:MM)
                if re.match(r'^\d{1,2}:\d{2}$', dep_time) and re.match(r'^\d{1,2}:\d{2}$', arr_time):
                    if not any(t["train_no"] == train_no for t in trains):
                        trains.append({
                            "train_no": train_no,
                            "train_type": t_type,
                            "start_time": dep_time,
                            "end_time": arr_time,
                            "duration": duration,
                            "route": route_info,
                            "raw_name": raw_train
                        })

    except Exception as e:
        import traceback
        err_detail = traceback.format_exc()
        print(f"[ERROR] 查詢時刻表失敗 (ride_date={ride_date}, {start_full}->{end_full}):\n{err_detail}")

    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass

    return trains
