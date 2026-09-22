#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動訂票引擎 (app/booking_engine.py)
撿票成功時自動將取票代碼與PID號寫入檔案保存。
"""

import io
import time
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from PIL import Image

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium.common.exceptions import StaleElementReferenceException

from .ocr import get_captcha_ocr
from .stations import get_station_code, get_station_name
from .storage import save_ticket

class BookingEngine:
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
        self.driver: Optional[webdriver.Chrome] = None
        self.ocr = get_captcha_ocr()
        self.is_running = False

    def log(self, msg: str):
        """除錯模式專用日誌輸出"""
        if self.debug:
            print(f"[DEBUG] {datetime.now().strftime('%H:%M:%S.%f')[:-3]} {msg}", flush=True)

    def start(self):
        """啟動常駐 Chrome 實例"""
        if self.driver is not None:
            return

        self.log("正在初始化 Chrome 瀏覽器選項...")
        options = Options()
        if self.headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        self.driver = webdriver.Chrome(options=options)
        self.driver.set_page_load_timeout(30)
        self.is_running = True
        self.log("Chrome 瀏覽器啟動完成。")

    def close(self):
        """安全釋放 Chrome 資源"""
        self.is_running = False
        if self.driver is not None:
            self.log("正在關閉 Chrome 瀏覽器...")
            try:
                self.driver.quit()
            except Exception as e:
                self.log(f"關閉 Chrome 異常: {e}")
            self.driver = None
            self.log("Chrome 瀏覽器已關閉。")


    def _set_input(self, element_id: str, value: str):
        """透過原生 JS 安全指派 input 數值並觸發事件 (防範 StaleElement)"""
        self.driver.execute_script("""
            var el = document.getElementById(arguments[0]);
            if (el) {
                el.value = arguments[1];
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        """, element_id, value)

    def _set_select(self, element_id: str, value: str):
        """透過原生 JS 安全指派 select 數值並觸發事件 (防範 StaleElement)"""
        self.driver.execute_script("""
            var el = document.getElementById(arguments[0]);
            if (el) {
                el.value = arguments[1];
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        """, element_id, value)

    def parse_booking_result(self, text: str, pid: str) -> Dict[str, Any]:
        """解析訂票完成頁面之關鍵訊息"""
        info = {
            "success": False,
            "pid": pid,
            "booking_code": "",
            "pay_deadline": "",
            "trip_info": "",
            "train_type": "",
            "train_no": "",
            "seat": "",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # 電腦代碼
        m = re.search(r'訂票代碼\s*([A-Za-z0-9]+)', text)
        if m:
            info["booking_code"] = m.group(1).strip()
            info["success"] = True

            # 付款期限
            m = re.search(r'請於\s*([^\n\r]+?)\s*前利用', text)
            if m:
                info["pay_deadline"] = m.group(1).strip()

            # 旅程 (例: 09/21 (星期一) 16:54 臺北 至 17:00 松山)
            m = re.search(r'(\d{2}/\d{2}\s*\([^)]+\)\s*\d{1,2}:\d{2}\s*[^\n\r]+至\s*\d{1,2}:\d{2}\s*[^\n\r]+)', text)
            if m:
                info["trip_info"] = m.group(1).strip()

            # 車種
            m = re.search(r'((?:自強|新自強|普悠瑪|太魯閣|莒光|區間)[^\n\r]*)', text)
            if m:
                info["train_type"] = m.group(1).strip()

            # 車次
            m = re.search(r'車次\s*([A-Za-z0-9]+)', text)
            if m:
                info["train_no"] = m.group(1).strip()

            # 座位 (支援一張或多張票的所有座位)
            seats = re.findall(r'(\d+\s*車\s*\d+\s*號)', text)
            if seats:
                info["seat"] = ", ".join(seats)

        info["ticket_info"] = dict(info)
        return info

    def submit_and_check(self, pid: str, max_captcha_retries: int = 3) -> Dict[str, Any]:
        """統一驗證碼辨識、送出與結果判斷 (每輪動態獲取元素以杜絕 StaleElementReference)"""
        driver = self.driver

        for attempt in range(1, max_captcha_retries + 1):
            self.log(f"[嘗試 {attempt}/{max_captcha_retries}] 準備獲取驗證碼截圖...")
            try:
                codeimg = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID, "codeimg"))
                )
                time.sleep(0.4)
                img_bytes = codeimg.screenshot_as_png
                img = Image.open(io.BytesIO(img_bytes))
                code = self.ocr.predict(img)
                self.log(f"[嘗試 {attempt}] OCR 辨識驗證碼為: {code}")

                # 填寫驗證碼
                self._set_input("verifyCode", code)
                self.log(f"[嘗試 {attempt}] 已將驗證碼填入 #verifyCode")

                # 點擊送出
                submit_btn = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.ID, "submitBtn"))
                )
                self.log(f"[嘗試 {attempt}] 點擊 #submitBtn 送出表單...")
                driver.execute_script("arguments[0].click();", submit_btn)

            except StaleElementReferenceException:
                self.log(f"[嘗試 {attempt}] 遇到 StaleElementReferenceException，稍候重試...")
                time.sleep(0.5)
                continue
            except Exception as e:
                self.log(f"[嘗試 {attempt}] 填寫送出表單過程發生異常: {e}")
                if self.debug:
                    import traceback
                    traceback.print_exc()

            # 等待網頁載入
            self.log(f"[嘗試 {attempt}] 等待伺服器回應...")
            body_text = ""
            for tick in range(1, 8):
                time.sleep(0.8)
                try:
                    state = driver.execute_script("return document.readyState")
                    if state == "complete":
                        body_text = driver.find_element(By.TAG_NAME, "body").text
                        self.log(f"[等待回應 {tick}/7] document.readyState=complete, body長度={len(body_text)}")
                        if any(k in body_text for k in ["訂票成功", "訂票明細", "訂票代碼", "剩餘座位不足", "均無符合條件車次", "無符合條件車次", "驗證碼驗證失敗"]):
                            self.log(f"[等待回應 {tick}/7] 偵測到關鍵關鍵字！")
                            break
                except StaleElementReferenceException:
                    self.log(f"[等待回應 {tick}/7] 讀取 body 遇 StaleElement，重試...")
                except Exception as e:
                    self.log(f"[等待回應 {tick}/7] 讀取 body 異常: {e}")

            self.log(f"頁面文字摘要: {repr(body_text[:150])}")

            # 1. 訂票成功
            if "訂票成功" in body_text or "訂票明細" in body_text or "訂票代碼" in body_text:
                info = self.parse_booking_result(body_text, pid)
                if info.get("success") and info.get("booking_code"):
                    self.log(f">>> 判定為: 訂票成功！車次={info.get('train_no')}, 代碼={info.get('booking_code')}")
                    save_ticket(info)
                    return info
                else:
                    self.log(">>> 發現關鍵字但未解析出有效訂票代碼，繼續檢查其他狀態...")

            # 2. 查無座位 / 剩餘座位不足
            if "剩餘座位不足" in body_text or "均無符合條件車次" in body_text or "無符合條件車次" in body_text:
                self.log(">>> 判定為: 客滿無剩餘座位")
                return {
                    "success": False,
                    "status": "NO_SEATS",
                    "msg": "該條件目前客滿無剩餘座位",
                    "last_ocr": code
                }

            # 3. 驗證碼錯誤
            if "驗證碼驗證失敗" in body_text or "驗證碼" in body_text:
                self.log(">>> 判定為: 驗證碼辨識微誤，點擊更換圖形...")
                if attempt < max_captcha_retries:
                    try:
                        driver.execute_script("""
                            var btn = document.getElementById('changePicture');
                            if (btn) btn.click();
                        """)
                        time.sleep(1.0)
                        continue
                    except Exception as e:
                        self.log(f"點擊更換圖形異常: {e}")

        return {
            "success": False,
            "status": "CAPTCHA_FAIL",
            "msg": "本輪驗證碼辨識微誤，準備重新查詢",
            "last_ocr": code if 'code' in locals() else ""
        }

    def book_by_time(self, pid: str, ride_date: str, start_station: str, end_station: str,
                     start_time: str = "10:00", end_time: str = "18:00", qty: int = 1,
                     ticket_qty: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        """依時段範圍訂票 (tip122 tripOne byTime)"""
        if ticket_qty is not None:
            qty = ticket_qty
        self.start()
        driver = self.driver
        url = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip122/tripOne/byTime"

        try:
            self.log(f"打開訂票網址 (byTime): {url}")
            driver.get(url)
            self.log("等待 #pid 出現...")
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "pid")))

            # 取得標準車站代碼 (如 1000, 6180)
            start_code = get_station_code(start_station)
            end_code = get_station_code(end_station)
            self.log(f"設定起訖站代碼: 起站={start_station}({start_code}), 訖站={end_station}({end_code})")

            # PID與起訖站
            self._set_input("pid", pid)
            self._set_select("startStation0", start_code)
            self._set_select("endStation0", end_code)

            # 日期與時段
            self.log(f"設定乘車日期={ride_date}, 時段={start_time}~{end_time}, 張數={qty}")
            self._set_select("rideDate0", ride_date)
            self._set_select("startTime_0", start_time)
            self._set_select("endTime_0", end_time)

            # 張數
            self._set_select("normalQty0", str(qty))

            return self.submit_and_check(pid)

        except Exception as e:
            self.log(f"book_by_time 發生重大異常: {e}")
            if self.debug:
                import traceback
                traceback.print_exc()
            return {"success": False, "status": "ERROR", "msg": str(e)}

    def book_by_train_numbers(self, pid: str, ride_date: str, start_station: str, end_station: str,
                              train_numbers: Optional[List[str]] = None, qty: int = 1) -> Dict[str, Any]:
        """依特定車次列表訂票 (最多支援3個志願序) (tip122 tripOne byTrainNo)"""
        if train_numbers is None:
            train_numbers = []

        self.start()
        driver = self.driver
        url = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip122/tripOne/byTrainNo"

        try:
            self.log(f"打開訂票網址 (byTrainNo): {url}")
            driver.get(url)
            self.log("等待 #pid 出現...")
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "pid")))

            # 取得標準車站代碼
            start_code = get_station_code(start_station)
            end_code = get_station_code(end_station)
            self.log(f"設定起訖站代碼: 起站={start_station}({start_code}), 訖站={end_station}({end_code})")

            # PID與起訖站
            self._set_input("pid", pid)
            self._set_select("startStation0", start_code)
            self._set_select("endStation0", end_code)

            # 日期
            self.log(f"設定乘車日期={ride_date}, 車次列表={train_numbers}, 張數={qty}")
            self._set_select("rideDate0", ride_date)

            # 車次志願序列表
            for idx in range(3):
                t_val = train_numbers[idx].strip() if idx < len(train_numbers) else ""
                driver.execute_script("""
                    var inps = document.querySelectorAll("input[name^='ticketOrderParamList[0].trainNoList']");
                    if (inps && inps[arguments[0]]) {
                        inps[arguments[0]].value = arguments[1];
                        inps[arguments[0]].dispatchEvent(new Event('input', { bubbles: true }));
                        inps[arguments[0]].dispatchEvent(new Event('change', { bubbles: true }));
                    }
                """, idx, t_val)

            # 張數
            self._set_select("normalQty0", str(qty))

            return self.submit_and_check(pid)

        except Exception as e:
            self.log(f"book_by_train_numbers 發生重大異常: {e}")
            if self.debug:
                import traceback
                traceback.print_exc()
            return {"success": False, "status": "ERROR", "msg": str(e)}

    def reset_for_next_poll(self):
        """重設狀態準備下一輪輪詢 (下一輪將在等待結束後重新 get 乾淨頁面)"""
        pass



