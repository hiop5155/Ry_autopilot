# 單元測試與品質保證體系指引 (TESTING.md)

本專案建立了一套**「脫離外部網路與 Selenium 依賴、毫秒級極速回饋」**的單元測試體系。  
即使在離線環境下，也能在 1 秒內驗證全系統核心邏輯、官方 HTML 結果解析、以及 SQLite 資料持久化狀態。

---

## 一、 測試架構設計 (測試金字塔)

| 測試模組檔案 | 測試範疇 | 核心檢核重點 | 執行耗時 |
| :--- | :--- | :--- | :--- |
| **`tests/test_1_pure_logic.py`** | **純邏輯與日期解析** | 1. 身分證格式驗證、大小寫容錯、亂數生成合規性<br>2. 官方特有 `24:00` 跨日換算（進位至次日 `00:00:00`）<br>3. 跨年與各類字串格式解析、繳費過期判定 | **~0.13 秒** |
| **`tests/test_2_html_parsing.py`** | **HTML 離線解析與 Fixtures** | 1. 脫離真實瀏覽器，讀取本機 HTML 範本<br>2. 訂票代碼、車次、座位清單、張數 (`ticket_qty`) 提取<br>3. 客滿售罄/無座、輸入錯誤特徵字串識別 | **~0.30 秒** |
| **`tests/test_3_db_and_state.py`** | **SQLite 持久化與狀態隔離** | 1. 使用 `pytest tmp_path` 隔離資料庫，絕不污染正式環境<br>2. 車票 CRUD、張數持久化、繳費期限欄位<br>3. 多任務管理防呆（至少保留一個任務）<br>4. 日誌佇列滾動截斷（上限 500 條保護記憶體） | **~0.80 秒** |

---

## 二、 快速執行指令

專案根目錄提供了便攜啟動腳本 `./run_tests.sh` 與 `run_tests.py`。

### 1. 執行全部測試（一鍵全模組執行）
```bash
# 方法 1：使用便捷 Shell 腳本
./run_tests.sh

# 方法 2：使用 Python 啟動器
python3 run_tests.py

# 方法 3：使用原生的 pytest
./venv/bin/pytest tests/ -v
```
> **執行結果**：全量 26 項測試均在 **1 秒內**（~0.9 秒）綠燈全數通過。

---

### 2. 單獨測試特定模組（獨立分項測試）
在日常開發或特定模組除錯時，可針對單一模組快速執行：

```bash
# 只測【項目 1：純邏輯與日期解析】 (tests/test_1_pure_logic.py)
./run_tests.sh 1
# 或
python3 run_tests.py logic

# 只測【項目 2：HTML 離線結果解析】 (tests/test_2_html_parsing.py)
./run_tests.sh 2
# 或
python3 run_tests.py html

# 只測【項目 3：SQLite 資料庫與狀態隔離】 (tests/test_3_db_and_state.py)
./run_tests.sh 3
# 或
python3 run_tests.py db
```

---

## 三、 官網改版維護 SOP (HTML Fixtures 驅動除錯)

當官方網站調整版面結構導致線上訂票結果無法正確提取時，請遵循以下 3 步驟快速定位修復：

### 步驟 1：擷取當下出錯的新版 HTML
在 [app/booking_engine.py](file:///home/jimmy/testcode/tn_test/app/booking_engine.py) 解析失敗處（或手動於除錯模式下）：
```python
with open("tests/fixtures/booking_new_version.html", "w", encoding="utf-8") as f:
    f.write(driver.page_source)
```

### 步驟 2：使用比對工具 (Diff)
將新存的 `booking_new_version.html` 與舊的 `tests/fixtures/booking_success_result.html` 進行文字比對：
- 確認訂票代碼的標籤、Class 或前後文字是否微調。
- 確認座位號碼排版格式是否有異動。

### 步驟 3：本機 0.05 秒內單元除錯
在 `tests/test_2_html_parsing.py` 加入新版測試案例，修改 [app/booking_engine.py](file:///home/jimmy/testcode/tn_test/app/booking_engine.py) 的正則提取規則後，執行：
```bash
./run_tests.sh 2
```
完全不需連網、不需等驗證碼、不需真實花錢訂票，即可在幾毫秒內確認正則與解析邏輯是否修復成功，同時確保既有舊版情境不會被改壞！
