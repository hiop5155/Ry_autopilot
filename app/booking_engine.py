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

from selenium.common.exceptions import (
    StaleElementReferenceException,
    InvalidSessionIdException,
    WebDriverException,
    NoSuchWindowException,
)

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

    def is_alive(self) -> bool:
        """檢查底層 Chrome 瀏覽器與 WebDriver Session 是否仍然健康存活"""
        if self.driver is None:
            return False
        try:
            # 存活性探針：嘗試讀取當前 window handle，速度極快 (<5ms)
            _ = self.driver.current_window_handle
            return True
        except Exception:
            return False

    def _is_session_fatal_error(self, ex: Exception) -> bool:
        """判定異常是否屬於 WebDriver Session 死亡或連線中斷"""
        if isinstance(ex, (InvalidSessionIdException, NoSuchWindowException)):
            return True
        msg = str(ex).lower()
        fatal_keywords = [
            "invalid session id",
            "session deleted",
            "disconnected",
            "no such window",
            "chrome not reachable",
            "target frame detached",
            "session not created",
            "refused to connect"
        ]
        return any(k in msg for k in fatal_keywords)

    def start(self, force_restart: bool = False):
        """啟動常駐 Chrome 實例 (具備連線探活、動態 DNS IPv4 強制與自我修復)"""
        if self.driver is not None and not force_restart:
            if self.is_alive():
                return
            self.log("現有 Chrome 實例已失效/中斷，正在清理舊連線...")
            self.close()
        elif force_restart:
            self.close()

        self.log("正在初始化 Chrome 瀏覽器選項...")
        options = Options()
        if self.headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        # 動態透過系統 DNS 解析 tip.railway.gov.tw 之 IPv4 位址，避開 Linux/WSL IPv6 路由超時黑洞
        try:
            import socket
            addr_info = socket.getaddrinfo("tip.railway.gov.tw", None, socket.AF_INET)
            if addr_info:
                ipv4 = addr_info[0][4][0]
                options.add_argument(f"--host-resolver-rules=MAP tip.railway.gov.tw {ipv4}")
                self.log(f"動態 DNS 解析成功: tip.railway.gov.tw -> {ipv4}，已配置 Chrome 直連 IPv4。")
        except Exception as e:
            self.log(f"動態 DNS IPv4 解析微誤 (走預設解析): {e}")

        self.driver = webdriver.Chrome(options=options)
        self.driver.set_page_load_timeout(30)
        self.is_running = True
        self.log("Chrome 瀏覽器啟動完成。")

    def restart(self):
        """強制重啟 Chrome 實例 (常用於長時間運行時定期釋放記憶體)"""
        self.log("觸發強制重啟 Chrome 實例...")
        self.start(force_restart=True)

    def close(self):
        """安全釋放 Chrome 資源 (保證 self.driver 被清空以防殘留失效 Session)"""
        self.is_running = False
        if self.driver is not None:
            self.log("正在關閉 Chrome 瀏覽器...")
            try:
                self.driver.quit()
            except Exception as e:
                self.log(f"關閉 Chrome 異常 (可能程序已提前終止): {e}")
            finally:
                self.driver = None
            self.log("Chrome 瀏覽器已完全關閉釋放。")

    def _dismiss_cookie_and_popups(self):
        """主動關閉官方 Cookie 聲明遮罩或阻擋互動之彈窗"""
        if self.driver is None:
            return
        try:
            self.driver.execute_script("""
                // 1. 點擊 Cookie 同意按鈕
                var cookieBtns = document.querySelectorAll('.btn-cookie, button[title="接受並關閉"], #cbWFS');
                for (var i = 0; i < cookieBtns.length; i++) {
                    try { cookieBtns[i].click(); } catch(e){}
                }
                // 2. 移除殘留的遮罩 div
                var cookieBars = document.querySelectorAll('#cookie-bar, .cookie-notice, .modal-backdrop');
                for (var j = 0; j < cookieBars.length; j++) {
                    try { cookieBars[j].remove(); } catch(e){}
                }
            """)
        except Exception:
            pass



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

    def parse_booking_result(
        self,
        text: str,
        pid: str,
        ride_date: str = "",
        start_station: str = "",
        end_station: str = "",
        qty: int = 1
    ) -> Dict[str, Any]:
        """解析訂票完成頁面之關鍵訊息"""
        start_code = get_station_code(start_station) if start_station else ""
        start_name = get_station_name(start_code) or start_station
        end_code = get_station_code(end_station) if end_station else ""
        end_name = get_station_name(end_code) or end_station

        parsed_qty = max(1, int(qty or 1))

        info = {
            "success": False,
            "pid": pid,
            "booking_code": "",
            "pay_deadline": "",
            "trip_info": "",
            "train_type": "",
            "train_no": "",
            "seat": "",
            "ticket_qty": parsed_qty,
            "ride_date": ride_date,
            "start_station": start_name,
            "end_station": end_name,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # 電腦代碼
        m = re.search(r'(?:訂票代碼|電腦代碼|取票代碼|訂票電腦代碼)[^\w\d]*([A-Za-z0-9]+)', text)
        if not m:
            m = re.search(r'訂票代碼\s*([A-Za-z0-9]+)', text)
        if m:
            info["booking_code"] = m.group(1).strip()
            info["success"] = True

            # 付款期限
            m = re.search(r'(?:請於|並於|須於)\s*([^\n\r]+?)\s*前(?:利用|完成付款)', text)
            if not m:
                m = re.search(r'(?:請於|須於)\s*([^\n\r]+?)\s*前', text)
            if m:
                info["pay_deadline"] = m.group(1).strip()

            # 旅程 (例: 10/15(星期四) 08:00 臺北 到 08:07 板橋 或 09/21 (星期一) 16:54 臺北 至 17:00 松山)
            m = re.search(r'(\d{1,2}/\d{1,2}[^\n\r]+?(?:到|至)[^\n\r]+)', text)
            if not m:
                m = re.search(r'旅程[^\n\r]*?(\d{2,4}/\d{2}/\d{2}[^\n\r]+)', text)
            if m:
                info["trip_info"] = m.group(1).strip()
            elif ride_date and start_name and end_name:
                info["trip_info"] = f"{ride_date} {start_name} ➔ {end_name}"

            # 車種
            m = re.search(r'((?:自強|新自強|普悠瑪|太魯閣|莒光|區間)[^\n\r]*)', text)
            if m:
                info["train_type"] = m.group(1).strip()

            # 車次
            m = re.search(r'車次\s*([A-Za-z0-9]+)', text)
            if m:
                info["train_no"] = m.group(1).strip()
            elif info.get("train_type"):
                num_m = re.findall(r'\b(\d+)\b', info["train_type"])
                if num_m:
                    info["train_no"] = num_m[-1]

            # 清理 train_type 中的車次號碼以防前端重複顯示 (例: "自強(3000) 111" -> "自強(3000)")
            if info.get("train_type") and info.get("train_no"):
                clean_type = re.sub(r'\s*' + re.escape(info["train_no"]) + r'\s*次?$', '', info["train_type"]).strip()
                if clean_type:
                    info["train_type"] = clean_type

            # 座位 (支援一張或多張票的所有座位)
            seats = re.findall(r'(\d+\s*車\s*\d+\s*號)', text)
            if seats:
                info["seat"] = ", ".join(seats)

        # 若未成功解析 trip_info 但有給定起訖與日期，自動補充
        if not info.get("trip_info") and ride_date and start_name and end_name:
            info["trip_info"] = f"{ride_date} {start_name} ➔ {end_name}"

        info["ticket_info"] = dict(info)
        return info

    def _fill_form_fields(
        self,
        pid: str,
        ride_date: str,
        start_station: str,
        end_station: str,
        qty: int,
        is_by_train: bool,
        train_numbers: Optional[List[str]] = None,
        start_time: str = "10:00",
        end_time: str = "18:00"
    ):
        """全面相容新舊兩版票務訂票表單欄位 (自適應 0 與 1，input 與 select，代碼與代碼-名稱)"""
        driver = self.driver
        start_code = get_station_code(start_station)
        start_name = get_station_name(start_code) or start_station
        end_code = get_station_code(end_station)
        end_name = get_station_name(end_code) or end_station
        start_full = f"{start_code}-{start_name}"
        end_full = f"{end_code}-{end_name}"
        trains = [t.strip() for t in (train_numbers or []) if t.strip()]

        self.log(f"自適應填寫表單: PID={pid}, 日期={ride_date}, 起站={start_full}, 訖站={end_full}, 張數={qty}")

        driver.execute_script("""
            var pid = arguments[0];
            var startCode = arguments[1];
            var startFull = arguments[2];
            var endCode = arguments[3];
            var endFull = arguments[4];
            var rideDate = arguments[5];
            var qty = arguments[6];
            var isByTrain = arguments[7];
            var trains = arguments[8];
            var startTime = arguments[9];
            var endTime = arguments[10];

            function dispatch(el) {
                if (!el) return;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                if (window.jQuery) {
                    try { window.jQuery(el).trigger('change'); } catch(e){}
                }
            }

            // 1. PID (#pid)
            var pidEls = document.querySelectorAll('#pid, input.pid');
            for (var i = 0; i < pidEls.length; i++) {
                pidEls[i].value = pid.toUpperCase();
                dispatch(pidEls[i]);
            }

            // 2. 出發站 (相容 select 與 input: #startStation0, #startStation1, input.startStation)
            var startEls = document.querySelectorAll('#startStation0, #startStation1, input.startStation, select.stations');
            for (var i = 0; i < startEls.length; i++) {
                var s = startEls[i];
                if (s.tagName.toLowerCase() === 'select') {
                    s.value = startCode;
                } else {
                    s.value = startFull;
                }
                dispatch(s);
            }

            // 3. 抵達站 (相容 select 與 input: #endStation0, #endStation1, input.endStation)
            var endEls = document.querySelectorAll('#endStation0, #endStation1, input.endStation');
            for (var i = 0; i < endEls.length; i++) {
                var e = endEls[i];
                if (e.tagName.toLowerCase() === 'select') {
                    e.value = endCode;
                } else {
                    e.value = endFull;
                }
                dispatch(e);
            }

            // 4. 搭乘日期 (相容 select 與 input: #rideDate0, #rideDate1, input.rideDate)
            var dateEls = document.querySelectorAll('#rideDate0, #rideDate1, input.rideDate, select.rideDate');
            for (var i = 0; i < dateEls.length; i++) {
                var d = dateEls[i];
                d.value = rideDate;
                dispatch(d);
            }

            // 5. 票數 (相容 select 與 input: #normalQty0, #normalQty1, input.normalSeat, select.normalQty)
            var qtyEls = document.querySelectorAll('#normalQty0, #normalQty1, input.normalSeat, select.normalQty');
            for (var i = 0; i < qtyEls.length; i++) {
                var q = qtyEls[i];
                q.value = qty;
                dispatch(q);
            }

            // 6. 車次或時段設定
            if (isByTrain) {
                var r1 = document.getElementById('orderType1');
                if (r1 && !r1.checked) {
                    r1.click();
                    dispatch(r1);
                }
                for (var t = 0; t < 3; t++) {
                    var val = (t < trains.length) ? trains[t] : '';
                    var tEl = document.getElementById('trainNoList' + (t + 1)) ||
                              document.querySelector("input[name='ticketOrderParamList[0].trainNoList[" + t + "]']");
                    if (tEl) {
                        tEl.disabled = false;
                        tEl.value = val;
                        dispatch(tEl);
                    }
                }
            } else {
                var r2 = document.getElementById('orderType2');
                if (r2 && !r2.checked) {
                    r2.click();
                    dispatch(r2);
                }
                var stEls = document.querySelectorAll('#startTime1, #startTime_0, select[name$="startTime"]');
                for (var si = 0; si < stEls.length; si++) {
                    stEls[si].disabled = false;
                    stEls[si].value = startTime;
                    dispatch(stEls[si]);
                }
                var etEls = document.querySelectorAll('#endTime1, #endTime_0, select[name$="endTime"]');
                for (var ei = 0; ei < etEls.length; ei++) {
                    etEls[ei].disabled = false;
                    etEls[ei].value = endTime;
                    dispatch(etEls[ei]);
                }
            }

            // 強制確保非單程（TRIP2 / TRIP3）的所有欄位保持 disabled，防止污染 POST 參數引發伺服器驗證錯誤
            var extraInputs = document.querySelectorAll('[name*="ticketOrderParamList[1]"], [name*="ticketOrderParamList[2]"]');
            for (var k = 0; k < extraInputs.length; k++) {
                extraInputs[k].disabled = true;
            }
        """, pid, start_code, start_full, end_code, end_full, ride_date, str(qty), is_by_train, trains, start_time, end_time)

    def _select_candidate_train(self, train_numbers: Optional[List[str]] = None) -> Dict[str, Any]:
        """在車次選擇清單頁 (queryTrain) 勾選最符合志願序之車次"""
        trains = [str(t).strip() for t in (train_numbers or []) if str(t).strip()]
        result = self.driver.execute_script("""
            var targetTrains = arguments[0] || [];
            var rows = document.querySelectorAll('tr, .ticket-row, .table-tr');
            var matchedRadio = null;
            var matchedTrain = null;

            // 1. 優先比對使用者指定的車次志願序
            for (var t = 0; t < targetTrains.length; t++) {
                var target = targetTrains[t];
                if (!target) continue;
                for (var i = 0; i < rows.length; i++) {
                    var rowText = rows[i].innerText || '';
                    if (rowText.indexOf(target) !== -1) {
                        var r = rows[i].querySelector('input[type="radio"][name^="selectLoc"], input[type="radio"]');
                        if (r) {
                            matchedRadio = r;
                            matchedTrain = target;
                            break;
                        }
                    }
                }
                if (matchedRadio) break;
            }

            // 2. 若指定車次未在候選名單中，或無指定車次（時段查詢），選取第一列可用車次
            if (!matchedRadio) {
                matchedRadio = document.querySelector('input[type="radio"][name^="selectLoc"], input[type="radio"].radio-check');
            }

            if (matchedRadio) {
                matchedRadio.checked = true;
                matchedRadio.dispatchEvent(new Event('change', { bubbles: true }));
                if (window.jQuery) {
                    try { window.jQuery(matchedRadio).prop('checked', true).trigger('change'); } catch(e){}
                }
                return {
                    selected: true,
                    matchedTrain: matchedTrain,
                    radioId: matchedRadio.id,
                    radioValue: matchedRadio.value
                };
            }
            return { selected: false };
        """, trains)
        return result or {"selected": False}

    def _solve_and_fill_captcha(self, attempt: int = 1) -> str:
        """安全截取可見驗證碼並透過 OCR 填入 #verifyCode"""
        driver = self.driver
        codeimg = driver.find_element(By.ID, "codeimg")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", codeimg)
        time.sleep(0.3)
        img_bytes = codeimg.screenshot_as_png
        code = self.ocr.predict(img_bytes)
        self.log(f"[嘗試 {attempt}] OCR 辨識驗證碼為: {code}")
        self._set_input("verifyCode", code)
        return code

    def _handle_query_train_flow(
        self,
        pid: str,
        train_numbers: Optional[List[str]] = None,
        max_captcha_retries: int = 5,
        ride_date: str = "",
        start_station: str = "",
        end_station: str = "",
        qty: int = 1
    ) -> Dict[str, Any]:
        """處理進入車次清單頁 (queryTrain) 後的車次勾選、驗證碼辨識與確認訂票流程"""
        driver = self.driver
        self.log("偵測到候選車次清單頁 (queryTrain)，開始進行車次勾選與驗證碼流程...")
        last_code = ""

        for attempt in range(1, max_captcha_retries + 1):
            self._dismiss_cookie_and_popups()

            # 1. 確保已勾選目標車次
            sel_res = self._select_candidate_train(train_numbers)
            self.log(f"[queryTrain 嘗試 {attempt}/{max_captcha_retries}] 車次選擇狀態: {sel_res}")

            # 2. 處理驗證碼
            try:
                codeimgs = driver.find_elements(By.ID, "codeimg")
                visible_img = [img for img in codeimgs if img.is_displayed()]
                if visible_img:
                    last_code = self._solve_and_fill_captcha(attempt)
                else:
                    self.log(f"[queryTrain 嘗試 {attempt}] 未發現可見圖形驗證碼，走直接送出模式...")
            except Exception as e:
                self.log(f"[queryTrain 嘗試 {attempt}] 驗證碼辨識異常: {e}")
                if self._is_session_fatal_error(e):
                    raise e

            # 3. 點擊確認訂票送出按鈕
            try:
                self.log(f"[queryTrain 嘗試 {attempt}] 點擊確認訂票送出按鈕...")
                driver.execute_script("""
                    var form = document.getElementById('queryForm') || document.querySelector('form');
                    var btn = document.getElementById('submitBtn') ||
                              document.querySelector("input[type='submit'].btn-3d") ||
                              document.querySelector("input[type='submit']") ||
                              document.querySelector("button[type='submit']");
                    if (btn) {
                        btn.click();
                    } else if (form) {
                        form.submit();
                    }
                """)
            except Exception as e:
                self.log(f"[queryTrain 嘗試 {attempt}] 點擊送出異常: {e}")
                if self._is_session_fatal_error(e):
                    raise e

            # 4. 等待伺服器訂票回應
            body_text = ""
            for tick in range(1, 9):
                time.sleep(0.7)
                try:
                    self._dismiss_cookie_and_popups()
                    if driver.execute_script("return document.readyState") == "complete":
                        body_text = driver.find_element(By.TAG_NAME, "body").text
                        if any(k in body_text for k in [
                            "訂票成功", "訂票明細", "訂票代碼", "電腦代碼",
                            "剩餘座位不足", "均無符合條件車次", "沒有空位", "均沒有空位",
                            "驗證碼驗證失敗", "請輸入驗證碼", "v3 驗證未通過", "輸入資料有誤"
                        ]):
                            break
                except Exception:
                    pass

            self.log(f"[queryTrain 嘗試 {attempt}] 回應摘要: {repr(body_text[:120])}")

            # 判斷結果：
            # A. 訂票成功！
            if any(k in body_text for k in ["訂票成功", "訂票明細", "訂票代碼", "電腦代碼"]):
                info = self.parse_booking_result(
                    body_text,
                    pid,
                    ride_date=ride_date,
                    start_station=start_station,
                    end_station=end_station,
                    qty=qty
                )
                if info.get("success") and info.get("booking_code"):
                    self.log(f">>> 訂票確認成功！代碼={info.get('booking_code')}, 車次={info.get('train_no')}")
                    save_ticket(info)
                    return info
                else:
                    self.log(">>> 發現成功關鍵字，正在重新提取完整資訊...")
                    info["success"] = True
                    save_ticket(info)
                    return info

            # B. 查無座位 / 剩餘座位不足
            if any(k in body_text for k in ["沒有空位", "均無符合條件車次", "無符合條件車次", "剩餘座位不足", "客滿", "查無可售座位", "均沒有空位"]):
                self.log(">>> 判定為: 客滿無剩餘座位")
                return {
                    "success": False,
                    "status": "NO_SEATS",
                    "msg": "該條件目前客滿無剩餘座位",
                    "last_ocr": last_code
                }

            # C. 驗證碼錯誤或需重新輸入驗證碼 -> 更換圖片重試
            if any(k in body_text for k in ["驗證碼驗證失敗", "請輸入驗證碼", "v3 驗證未通過"]):
                self.log(f">>> 驗證碼未吻合 (OCR: {last_code})，更換圖片進行下一次嘗試...")
                if attempt < max_captcha_retries:
                    try:
                        driver.execute_script("""
                            var btn = document.getElementById('changePicture');
                            if (btn && btn.offsetParent !== null) btn.click();
                        """)
                        time.sleep(0.8)
                        continue
                    except Exception:
                        pass

            # D. 其他前端/伺服器錯誤
            if "輸入資料有誤" in body_text:
                if "尚未選擇搭乘車次" in body_text:
                    self.log(">>> 提示尚未選擇車次，於下一輪重新強制勾選...")
                    continue
                else:
                    self.log(">>> 判定為真正輸入資料有誤 (如身分證號或起訖站錯誤)")
                    return {
                        "success": False,
                        "status": "INPUT_ERROR",
                        "msg": "輸入資料有誤，請檢查身分證號或起訖站",
                        "last_ocr": last_code
                    }

        return {
            "success": False,
            "status": "CAPTCHA_FAIL",
            "msg": f"連續 {max_captcha_retries} 次驗證碼辨識微誤，將於下輪重試",
            "last_ocr": last_code
        }

    def submit_and_check(
        self,
        pid: str,
        train_numbers: Optional[List[str]] = None,
        max_captcha_retries: int = 5,
        ride_date: str = "",
        start_station: str = "",
        end_station: str = "",
        qty: int = 1
    ) -> Dict[str, Any]:
        """統一驗證碼辨識、相容送出與結果判斷 (自適應支援 無驗證碼 / reCAPTCHA v3 / 直接送出 / 候選頁車次選擇 / 圖形驗證碼)"""
        driver = self.driver
        self._dismiss_cookie_and_popups()

        # 1. 檢查目前是否已在 queryTrain 候選頁（例如上一輪留存或直接重整）
        curr_url = driver.current_url
        if "queryTrain" in curr_url:
            return self._handle_query_train_flow(
                pid=pid,
                train_numbers=train_numbers,
                max_captcha_retries=max_captcha_retries,
                ride_date=ride_date,
                start_station=start_station,
                end_station=end_station,
                qty=qty
            )

        # 2. 若在第一頁且存在可見圖形驗證碼，先行填寫
        code = ""
        try:
            imgs = driver.find_elements(By.ID, "codeimg")
            visible_img = [img for img in imgs if img.is_displayed()]
            if visible_img:
                code = self._solve_and_fill_captcha(1)
        except Exception:
            pass

        # 3. 點擊送出查詢表單
        self.log("送出訂票查詢表單...")
        try:
            driver.execute_script("""
                var form = document.getElementById('queryForm') || document.querySelector('form');
                var btn = document.getElementById('submitBtn') ||
                          document.querySelector("input[type='submit'].btn-3d") ||
                          document.querySelector("input[type='submit']") ||
                          document.querySelector("button[type='submit']");
                if (btn) {
                    btn.click();
                } else if (form) {
                    form.submit();
                }
            """)
        except Exception as e:
            self.log(f"點擊送出表單異常: {e}")
            if self._is_session_fatal_error(e):
                raise e

        # 4. 等待伺服器回應與頁面跳轉
        self.log("等待訂票查詢回應...")
        body_text = ""
        for tick in range(1, 9):
            time.sleep(0.7)
            try:
                self._dismiss_cookie_and_popups()
                if driver.execute_script("return document.readyState") == "complete":
                    body_text = driver.find_element(By.TAG_NAME, "body").text
                    curr_url = driver.current_url
                    self.log(f"[等待回應 {tick}/8] URL={curr_url}, body長度={len(body_text)}")
                    if "queryTrain" in curr_url or any(k in body_text for k in [
                        "目前可預訂的車次如下", "建議搭乘車次",
                        "沒有空位", "均沒有空位", "均無符合條件車次", "無符合條件車次", "剩餘座位不足", "查無可售座位",
                        "訂票成功", "訂票明細", "訂票代碼", "電腦代碼", "輸入資料有誤"
                    ]):
                        break
            except Exception as e:
                if self._is_session_fatal_error(e):
                    raise e

        self.log(f"查詢回應摘要: URL={curr_url}, 文字={repr(body_text[:120])}")

        # 5. 查無座位 / 剩餘座位不足 (客滿)
        if any(k in body_text for k in ["沒有空位", "均沒有空位", "均無符合條件車次", "無符合條件車次", "剩餘座位不足", "客滿", "查無可售座位"]):
            self.log(">>> 判定為: 客滿無剩餘座位")
            return {
                "success": False,
                "status": "NO_SEATS",
                "msg": "該條件目前客滿無剩餘座位",
                "last_ocr": code
            }

        # 6. 跳轉至車次清單頁 (queryTrain) -> 進入完整選車次與圖形驗證碼流程
        if "queryTrain" in curr_url or any(k in body_text for k in ["目前可預訂的車次如下", "建議搭乘車次"]):
            return self._handle_query_train_flow(
                pid=pid,
                train_numbers=train_numbers,
                max_captcha_retries=max_captcha_retries,
                ride_date=ride_date,
                start_station=start_station,
                end_station=end_station,
                qty=qty
            )

        # 7. 訂票成功
        if any(k in body_text for k in ["訂票成功", "訂票明細", "訂票代碼", "電腦代碼"]):
            info = self.parse_booking_result(
                body_text,
                pid,
                ride_date=ride_date,
                start_station=start_station,
                end_station=end_station,
                qty=qty
            )
            save_ticket(info)
            return info

        # 8. 輸入資料有誤
        if "輸入資料有誤" in body_text:
            return {
                "success": False,
                "status": "INPUT_ERROR",
                "msg": "輸入資料有誤，請檢查身分證號或起訖站",
                "last_ocr": code
            }

        # 9. 若出現驗證碼圖形但未跳轉 queryTrain (需要輸入驗證碼)
        codeimgs = driver.find_elements(By.ID, "codeimg")
        if any(img.is_displayed() for img in codeimgs):
            return self._handle_query_train_flow(
                pid=pid,
                train_numbers=train_numbers,
                max_captcha_retries=max_captcha_retries,
                ride_date=ride_date,
                start_station=start_station,
                end_station=end_station,
                qty=qty
            )

        return {
            "success": False,
            "status": "RETRY",
            "msg": "本輪查詢未完成，準備重新查詢",
            "last_ocr": code
        }

    def book_by_time(self, pid: str, ride_date: str, start_station: str, end_station: str,
                     start_time: str = "10:00", end_time: str = "18:00", qty: int = 1,
                     ticket_qty: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        """依時段範圍訂票 (tip123 標準個人訂票依時段)"""
        if ticket_qty is not None:
            qty = ticket_qty

        max_session_retries = 1
        for attempt_idx in range(max_session_retries + 1):
            try:
                self.start()
                driver = self.driver
                url = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip123/query"

                self.log(f"打開訂票網址 (byTime): {url}")
                driver.get(url)
                self._dismiss_cookie_and_popups()
                self.log("等待 #pid 出現...")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "pid")))
                self._dismiss_cookie_and_popups()

                # 自適應填寫所有欄位
                self._fill_form_fields(
                    pid=pid,
                    ride_date=ride_date,
                    start_station=start_station,
                    end_station=end_station,
                    qty=qty,
                    is_by_train=False,
                    start_time=start_time,
                    end_time=end_time
                )

                return self.submit_and_check(
                    pid=pid,
                    train_numbers=[],
                    ride_date=ride_date,
                    start_station=start_station,
                    end_station=end_station,
                    qty=qty
                )

            except Exception as e:
                self.log(f"book_by_time 發生異常: {e}")
                if self._is_session_fatal_error(e):
                    self.log("偵測到 Chrome Session 中斷/失效，執行清理與自癒重置...")
                    self.close()
                    if attempt_idx < max_session_retries:
                        self.log("已自動重建瀏覽器 Session，立即重試本輪查詢...")
                        time.sleep(1.0)
                        continue
                    return {"success": False, "status": "SESSION_ERROR", "msg": "瀏覽器連線中斷，已完成自動重啟修復"}

                if self.debug:
                    import traceback
                    traceback.print_exc()
                return {"success": False, "status": "ERROR", "msg": str(e)}

    def book_by_train_numbers(self, pid: str, ride_date: str, start_station: str, end_station: str,
                              train_numbers: Optional[List[str]] = None, qty: int = 1) -> Dict[str, Any]:
        """依特定車次列表訂票 (最多支援3個志願序) (tip123 標準個人訂票依車次)"""
        if train_numbers is None:
            train_numbers = []

        max_session_retries = 1
        for attempt_idx in range(max_session_retries + 1):
            try:
                self.start()
                driver = self.driver
                url = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip123/query"

                self.log(f"打開訂票網址 (byTrainNo): {url}")
                driver.get(url)
                self._dismiss_cookie_and_popups()
                self.log("等待 #pid 出現...")
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "pid")))
                self._dismiss_cookie_and_popups()

                # 自適應填寫所有欄位
                self._fill_form_fields(
                    pid=pid,
                    ride_date=ride_date,
                    start_station=start_station,
                    end_station=end_station,
                    qty=qty,
                    is_by_train=True,
                    train_numbers=train_numbers
                )

                return self.submit_and_check(
                    pid=pid,
                    train_numbers=train_numbers,
                    ride_date=ride_date,
                    start_station=start_station,
                    end_station=end_station,
                    qty=qty
                )

            except Exception as e:
                self.log(f"book_by_train_numbers 發生異常: {e}")
                if self._is_session_fatal_error(e):
                    self.log("偵測到 Chrome Session 中斷/失效，執行清理與自癒重置...")
                    self.close()
                    if attempt_idx < max_session_retries:
                        self.log("已自動重建瀏覽器 Session，立即重試本輪查詢...")
                        time.sleep(1.0)
                        continue
                    return {"success": False, "status": "SESSION_ERROR", "msg": "瀏覽器連線中斷，已完成自動重啟修復"}

                if self.debug:
                    import traceback
                    traceback.print_exc()
                return {"success": False, "status": "ERROR", "msg": str(e)}


    def reset_for_next_poll(self):
        """重設狀態準備下一輪輪詢 (下一輪將在等待結束後重新 get 乾淨頁面)"""
        pass




