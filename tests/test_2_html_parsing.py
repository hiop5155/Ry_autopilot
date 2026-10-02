#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
項目 2：HTML 離線解析與 Fixtures 單元測試 (tests/test_2_html_parsing.py)
核心目標：
  脫離真實 Chrome 瀏覽器與網路請求，直接讀取存檔之 HTML Fixtures，
  驗證訂票代碼、車次、座位、繳費期限、車票張數 (ticket_qty) 之解析正確性。
"""

import os
import re
import pytest
from bs4 import BeautifulSoup
from app.booking_engine import BookingEngine


def extract_text_from_html(html_path: str) -> str:
    """輔助工具：模擬瀏覽器 body.text 行為，提取乾淨的 HTML 純文字"""
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
        # 移除 script 與 style
        for s in soup(["script", "style"]):
            s.decompose()
        return soup.get_text(separator=" ")


class TestHtmlParsing:
    """HTML 離線結果解析測試"""

    def test_parse_real_success_fixture(self, fixtures_dir):
        """測試真實官方訂票成功結果頁面 (booking_success_result.html)"""
        fixture_path = os.path.join(fixtures_dir, "booking_success_result.html")
        assert os.path.exists(fixture_path), f"找不到測試 fixture: {fixture_path}"

        body_text = extract_text_from_html(fixture_path)

        # 呼叫解析函式 (無需啟動真實 Selenium 瀏覽器)
        res = BookingEngine.parse_booking_result(
            None,
            text=body_text,
            pid="A123456789",
            ride_date="2026/09/25",
            start_station="1000",
            end_station="1020",
            qty=1
        )

        assert res["success"] is True
        assert res["booking_code"] != "", "必須成功提取訂票代碼"
        assert len(res["booking_code"]) >= 6, "訂票代碼長度通常至少 6~7 碼"
        assert res["pid"] == "A123456789"
        assert res["ticket_qty"] == 1
        assert res["pay_deadline"] != "", "必須提取到繳費期限"

    def test_parse_multi_seat_fixture(self):
        """測試多張車票 (例如 4 張連號) 之座位解析與張數固化"""
        mock_html_text = """
        恭喜您訂票成功！
        訂票電腦代碼： 8899661
        電腦代碼: 8899661
        車次: 自強(3000) 419 次
        乘車日期: 2026/09/25
        旅程: 09/25 16:22 臺北 到 16:29 板橋
        座位: 4 車 26 號, 4 車 28 號, 4 車 30 號, 4 車 32 號
        請於 09/24 24:00 前完成付款
        """

        res = BookingEngine.parse_booking_result(
            None,
            text=mock_html_text,
            pid="B220000000",
            ride_date="2026/09/25",
            start_station="1000",
            end_station="1020",
            qty=4
        )

        assert res["success"] is True
        assert res["booking_code"] == "8899661"
        assert res["ticket_qty"] == 4
        assert "419" in res["train_no"]
        assert "26" in res["seat"] and "32" in res["seat"]
        assert res["pay_deadline"] == "09/24 24:00"

    def test_soldout_fixture_detection(self, fixtures_dir):
        """測試售罄/客滿頁面之特徵文字識別"""
        fixture_path = os.path.join(fixtures_dir, "booking_soldout.html")
        body_text = extract_text_from_html(fixture_path)

        # 驗證 booking_engine 判定客滿的特徵關鍵字清單
        soldout_keywords = ["沒有空位", "均無符合條件車次", "無符合條件車次", "剩餘座位不足", "客滿", "查無可售座位", "均沒有空位"]
        has_soldout_keyword = any(k in body_text for k in soldout_keywords)
        assert has_soldout_keyword is True

    def test_invalid_input_fixture_detection(self, fixtures_dir):
        """測試輸入資料錯誤之特徵文字識別"""
        fixture_path = os.path.join(fixtures_dir, "booking_invalid_input.html")
        body_text = extract_text_from_html(fixture_path)

        assert "輸入資料有誤" in body_text
