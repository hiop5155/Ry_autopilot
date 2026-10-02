import os
import pytest
from app import db

@pytest.fixture
def fixtures_dir():
    """返回 tests/fixtures 目錄的絕對路徑"""
    return os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.fixture
def isolated_db(tmp_path, monkeypatch):
    """
    提供完全隔離的測試用 SQLite 資料庫環境，
    保證所有測試都在獨立的臨時檔案中執行，絕不污染正式的 autopilot.db。
    """
    temp_db_path = str(tmp_path / "test_autopilot.db")
    monkeypatch.setattr(db, "get_db_path", lambda: temp_db_path)
    # 初始化資料庫表格與欄位
    db.init_db()
    return temp_db_path
