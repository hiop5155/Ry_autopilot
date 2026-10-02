#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
項目 3：SQLite 持久化與狀態隔離單元測試 (tests/test_3_db_and_state.py)
核心目標：
  1. 使用 pytest 臨時目錄 (tmp_path) 完全隔離 SQLite 資料庫，絕不污染正式環境。
  2. 測試車票紀錄 CRUD、ticket_qty (張數) 儲存與校驗、繳費期限。
  3. 測試多任務 (Tasks) 持久化、重新命名、刪除。
  4. 測試任務日誌最大容量限制 (避免日誌累積過長造成記憶體膨脹)。
"""

import pytest
from app import db
from app.web import state


class TestDatabaseIsolation:
    """SQLite 資料庫操作與欄位持久化測試"""

    def test_save_and_retrieve_ticket(self, isolated_db):
        """測試儲存新車票紀錄與張數欄位 (ticket_qty)"""
        ticket_data = {
            "booking_code": "TEST888999",
            "pid": "A123456789",
            "train_no": "419",
            "train_type": "自強(3000)",
            "seat": "4車28號, 4車30號, 4車32號, 4車26號",
            "ride_date": "2026/09/25",
            "start_station": "臺北",
            "end_station": "板橋",
            "trip_info": "09/25 16:22 臺北 到 16:29 板橋",
            "pay_deadline": "09/24 (Thu) 24:00",
            "ticket_qty": 4,
            "created_at": "2026-09-24 16:40:43"
        }

        # 寫入車票
        db.save_ticket(ticket_data)

        # 讀取並檢驗
        tickets = db.get_all_tickets()
        assert len(tickets) == 1
        saved = tickets[0]
        assert saved["booking_code"] == "TEST888999"
        assert saved["pid"] == "A123456789"
        assert saved["train_no"] == "419"
        assert saved["ticket_qty"] == 4, "張數欄位必須準確持久化"
        assert saved["pay_deadline"] == "09/24 (Thu) 24:00"

    def test_delete_ticket(self, isolated_db):
        """測試依 booking_code 刪除車票紀錄"""
        ticket1 = {"booking_code": "TK_001", "pid": "A123456789", "train_no": "175", "ticket_qty": 1}
        ticket2 = {"booking_code": "TK_002", "pid": "B220000000", "train_no": "419", "ticket_qty": 2}
        db.save_ticket(ticket1)
        db.save_ticket(ticket2)

        assert len(db.get_all_tickets()) == 2

        # 刪除其中一筆
        db.delete_ticket("TK_001", "A123456789")

        remaining = db.get_all_tickets()
        assert len(remaining) == 1
        assert remaining[0]["booking_code"] == "TK_002"

    def test_tasks_crud_persistence(self, isolated_db):
        """測試任務列表新增、讀取與刪除 (驗證至少保留一個任務之防呆機制)"""
        port = 9999
        t1 = db.create_task(port, name="任務 1")
        t2 = db.create_task(port, name="任務 2")
        task1_id = t1["id"]
        task2_id = t2["id"]

        # 載入所有任務
        all_tasks = db.get_all_tasks(port)
        task_ids = [t["id"] for t in all_tasks]
        assert task1_id in task_ids
        assert task2_id in task_ids

        # 測試重命名
        db.rename_task(port, task1_id, "已重命名任務")
        task_obj = db.get_task(port, task1_id)
        assert task_obj["name"] == "已重命名任務"

        # 刪除任務 2 (成功)
        ok = db.delete_task(port, task2_id)
        assert ok is True
        remaining_tasks = [t["id"] for t in db.get_all_tasks(port)]
        assert task2_id not in remaining_tasks
        assert task1_id in remaining_tasks

        # 測試防呆：僅剩 1 個任務時不允許刪除
        cannot_delete_last = db.delete_task(port, task1_id)
        assert cannot_delete_last is False


class TestStateManagement:
    """任務狀態與日誌佇列上限管理測試"""

    def test_log_queue_capacity_limit(self, isolated_db):
        """測試 state 中的日誌自動滾動截斷機制，避免日誌膨脹"""
        state.init_status_paths(9998)
        new_task = state.create_new_task("LogTestTask")
        task_id = new_task["id"]

        import json
        # 預先設置 498 條基礎日誌以測試邊界值 (避免單元測試執行數百次磁碟寫入延遲)
        base_logs = [f"Base Log #{i}" for i in range(498)]
        db.update_task_fields(9998, task_id, {"logs": json.dumps(base_logs, ensure_ascii=False)})

        # 再追加 5 條日誌，累計達 503 條，觸發上限截斷
        for i in range(5):
            state.add_log(f"New Test Entry #{i}", task_id)

        task_st = state.get_task_state(task_id)
        logs = task_st.get("logs", [])

        # 驗證日誌數量精準被截斷並維持在上限 500 條
        assert len(logs) == 500
        # 驗證最新日誌保留在結尾
        assert "New Test Entry #4" in logs[-1]
        assert "Base Log #0" not in logs, "最舊的日誌應已被滾動淘汰"
