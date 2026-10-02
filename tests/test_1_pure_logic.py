#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
項目 1：純邏輯與日期解析單元測試 (tests/test_1_pure_logic.py)
驗證項目：
  1. 身分證字號檢核與亂數生成 (app.id_helper)
  2. 官方繳費期限格式解析、24:00跨日邏輯與過期判定 (app.cancel_ticket)
"""

import pytest
from datetime import datetime, timedelta
from app.id_helper import validate_roc_id, generate_roc_id
from app.cancel_ticket import parse_pay_deadline, is_pay_deadline_passed


class TestIdHelper:
    """身分證輔助工具測試"""

    def test_generate_roc_id_validity(self):
        """測試自動產生的身分證號是否 100% 合規"""
        for _ in range(50):
            pid = generate_roc_id()
            assert len(pid) == 10
            assert validate_roc_id(pid) is True

    @pytest.mark.parametrize("valid_id", [
        "A123456789",  # 台北市男性
        "b230041282",  # 台中市女性 (驗證小寫英文字母轉換)
        "f186518350",  # 新北市男性 (驗證小寫英文字母轉換)
    ])
    def test_verify_valid_ids(self, valid_id):
        """測試有效身分證號之驗證通過"""
        assert validate_roc_id(valid_id) is True

    @pytest.mark.parametrize("invalid_id", [
        "",             # 空字串
        "A12345678",    # 長度不足 9 碼
        "A1234567890",  # 長度過長 11 碼
        "1123456789",   # 首碼非英文字母
        "A323456789",   # 第二碼非 1 或 2
        "A123456780",   # 檢查碼錯誤
        "ABCDEFGHIJ",   # 全英文字元
    ])
    def test_verify_invalid_ids(self, invalid_id):
        """測試非法身分證號是否被嚴格阻擋"""
        assert validate_roc_id(invalid_id) is False


class TestPayDeadlineLogic:
    """繳費期限與時間計算測試"""

    def test_parse_24_clock_next_day(self):
        """核心關鍵：驗證官方特有之 24:00 是否能正確自動跨日為次日 00:00:00"""
        # 例如 09/24 24:00 應轉換為 2026/09/25 00:00:00
        dt = parse_pay_deadline("09/24 24:00", base_year=2026)
        assert dt is not None
        assert dt == datetime(2026, 9, 25, 0, 0, 0)

        # 含年份格式 2026/12/31 24:00 應進位至 2027/01/01 00:00:00
        dt_yearend = parse_pay_deadline("2026/12/31 24:00", base_year=2026)
        assert dt_yearend is not None
        assert dt_yearend == datetime(2027, 1, 1, 0, 0, 0)

    @pytest.mark.parametrize("deadline_str,expected_hour,expected_minute", [
        ("2026-09-24 15:30", 15, 30),
        ("09/24 18:45", 18, 45),
        ("2026/09/24 23:59", 23, 59),
        ("09/24 (Thu) 24:00", 0, 0),  # 包含星期英文括號
    ])
    def test_parse_standard_formats(self, deadline_str, expected_hour, expected_minute):
        """測試常見日期格式解析"""
        dt = parse_pay_deadline(deadline_str, base_year=2026)
        assert dt is not None
        assert dt.hour == expected_hour
        assert dt.minute == expected_minute

    def test_parse_empty_or_invalid_deadline(self):
        """測試異常輸入防呆"""
        assert parse_pay_deadline("") is None
        assert parse_pay_deadline(None) is None
        assert parse_pay_deadline("非法格式字串") is None

    def test_is_pay_deadline_passed(self):
        """測試繳費期限逾期判斷"""
        past_time = (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M")
        assert is_pay_deadline_passed(past_time) is True

        future_time = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d %H:%M")
        assert is_pay_deadline_passed(future_time) is False

        # 無法解析時預設不判定為過期，保護資料安全
        assert is_pay_deadline_passed("無效時間") is False
