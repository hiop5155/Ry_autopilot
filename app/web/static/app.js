// 前端控制邏輯 (app.js)

// 多國語言字典 (繁體中文、English、日本語、한국어)
const I18N = {
  "zh-TW": {
    app_title: "鐵路智慧自動訂票系統",
    status_idle: "系統待命中",
    status_running: "自動撿票監控中...",
    status_waiting_countdown: "等待下次查詢 ({s}s)...",
    status_checking_seats: "正在檢查座位狀態中...",
    status_completed_tpl: "🎉 撿票完成 (共訂到 {n} 班)！",
    status_stopped: "已停止監控",
    status_partial_tpl: "已成功撿到 {booked}/{total} 班！正在監控剩餘 {rem} 班...",
    nav_history: "📜 歷史取票紀錄",
    card1_title: "1. 乘車行程條件",
    lbl_pid: "訂票PID",
    pid_ph: "例如: A153457990",
    pid_valid: "✓ 合規PID",
    pid_invalid: "✗ 檢核碼錯誤",
    pid_digits_tpl: "{n}/10 碼",
    btn_gen_pid: "🎲 產生",
    log_pid_generated: "已隨機生成合規PID號: {id}",
    lbl_start_station: "出發站",
    start_station_ph: "輸入站名或站號 (例: 臺北/1000)",
    lbl_end_station: "抵達站",
    end_station_ph: "輸入站名或站號 (例: 松山/0990)",
    log_stations_swapped: "起訖站已對調: {start} ➔ {end}",
    lbl_ride_date: "乘車日期",
    hint_booking_window_28d: "📌 依官方規定，對號列車一般於乘車日前 28 天（00:00）開放預訂，國定連續假期會提前公布開賣（本系統不設限，均可正常設定與監控）。若非連續假期且超過 28 天，可能因官方尚未開賣而失敗。",
    lbl_start_time: "時段起點",
    lbl_end_time: "時段迄點 (上限8hr)",
    lbl_qty: "預定張數",
    opt_qty_1: "1 張",
    opt_qty_2: "2 張",
    opt_qty_3: "3 張",
    opt_qty_4: "4 張",
    btn_query_trains: "🔍 查詢時段內列車班次",
    btn_querying: "⏳ 正在向官方系統查詢時刻表...",
    log_querying_trains_raw: "正在查詢 {date} {start} ➔ {end} ({times}) 列車班次...",
    log_query_success: "成功查得 {n} 班列車資訊！請勾選欲追蹤的車次。",
    log_query_fail: "查詢車次失敗: {err}",
    card2_title: "2. 欲追蹤之列車號碼",
    btn_select_all: "全選",
    btn_clear_all: "取消全選",
    empty_state_desc: "請先於左側填妥條件，點擊「查詢時段內列車班次」以載入可追蹤車次。",
    trains_empty_state: "該時段內未查詢到班次，建議擴大時段範圍重新查詢。",
    train_unit: "次",
    selected_all_trains: "已選取 0 班 (將監控時段內所有車次)",
    selected_locked_tpl: "已鎖定 {n} 班車次: {trains}",
    selected_summary_tpl: "已選取 {n} 班列車",
    btn_start_polling: "開始自動監控撿票",
    btn_stop_polling: "停止監控",
    card3_title: "3. 即時監控日誌",
    round_badge_initial: "輪詢次數: 0",
    round_badge_tpl: "輪詢次數: {n}",
    save_hint: "📌 訂到票後自動保存至 successful_tickets.txt",
    sys_ready_log: "[系統] 票務撿票引擎就緒，支援本地 OCR 自動辨識與常駐 Chrome 連線。",
    log_monitor_stopped: "已停止自動撿票監控。",
    log_sync_running: "偵測到背景撿票監控正在運行中，已自動同步所有狀態！",
    log_conn_error: "系統連線異常: {err}",
    log_starting_chrome: "正在啟動背景常駐 Chrome 瀏覽器...",
    log_chrome_ready: "瀏覽器已就緒，開始自動輪詢監控！",
    log_target_trains_tpl: "目標車次共 {count} 班: {trains} (需全部訂到才結束)",
    log_target_trains_batch_tpl: "目標車次共 {count} 班: {trains} (整筆模式: 分 {reqs} 筆請求，需每一班車各訂到 1 筆 {qty} 張)",
    log_target_trains_split_reqs_tpl: "目標車次共 {count} 班: {trains} (拆單模式: 分 {reqs} 筆請求，需每一班車各訂滿 {qty} 張，每筆 1 張)",
    log_target_time_tpl: "目標時段: {range} (依時段單程訂票)",
    log_check_round_tpl: "[{time}] 第 {round} 次檢查座位 ({rem}/{total} 班待訂: {trains})...",
    log_check_round_time_tpl: "[{time}] 第 {round} 次檢查時段 {range} 座位狀態中...",
    log_no_seats_tpl: "[{time}] {batch}目前無剩餘座位{ocr}",
    log_captcha_retry_tpl: "[{time}] {batch}驗證碼微誤{ocr}，換圖再試",
    log_ticket_success_tpl: "🎉 撿票成功！車次 {train} | 訂票代碼：{code} (進度: {curr}/{total} 班)",
    log_ticket_success_single_tpl: "🎉 撿票成功！訂票電腦代碼：{code}",
    log_all_completed_tpl: "🎊 太棒了！所選之 {n} 班車次已全部訂妥！任務完成。",
    log_remaining_trains_tpl: "📌 剩餘待訂車次：{trains}，持續撿票監控中...",
    alert_input_pid: "請輸入PID字號！",
    alert_start_failed: "啟動監控失敗: {err}",
    modal_success_title: "恭喜！已成功搶到車票！",
    modal_success_btn: "我知道了（資料已存檔）",
    modal_ticket_header: "🎫 第 {n} 班車票: {type} {no} 次",
    modal_saved_hint: "📌 資料已全數寫入本機 successful_tickets.txt 與 successful_tickets.json！",
    modal_history_title: "📜 成功訂票紀錄歷史",
    filter_by_date_prefix: "📅 依乘車日期篩選：",
    filter_summary_tpl: "顯示 {n} / {total} 筆",
    history_empty: "尚無成功訂票紀錄",
    history_filter_empty: "該日期 ({date}) 無相符的訂票紀錄",
    loading_history: "載入歷史車票中...",
    history_load_failed: "載入失敗: {err}",
    pill_all: "全部",
    code_label: "電腦取票代碼",
    pid_label: "取票PID號",
    train_label: "搭乘車次",
    seat_label: "車廂與座位",
    trip_label: "行程區間",
    deadline_label: "繳費取票期限",
    ride_day_label: "乘車日",
    recorded_at: "記錄於",
    other_date: "其他",
    deadline_policy_default: "依官方規定",
    seat_auto_assigned: "系統配位",
    badge_expired: "⚠️ 繳費期限已截止 (已失效)",
    badge_active: "⏱️ 繳費期限內 (可線上退票)",
    btn_delete_expired: "🗑️ 刪除紀錄 (已過期)",
    btn_cancel_online: "❌ 取消訂票並刪除",
    confirm_delete_expired: "【車票代碼 {code}】\n此車票繳費期限已截止。\n是否自本機刪除此筆歷史紀錄？",
    confirm_cancel_online: "【車票代碼 {code}】\n⚠️ 此車票繳費期限尚未截止！\n取消後將向官方系統執行線上退票並即刻釋出座位，隨後自本機刪除此紀錄。\n\n是否確定要線上取消並刪除這張車票？",
    op_processing: "⏳ 處理中...",
    op_success: "操作成功！",
    op_failed: "操作失敗: {msg}",
    network_error: "網路或伺服器異常: {err}",
    station_not_found: "查無符合車站",
    alert_cancel_online_success: "官方系統已成功取消訂票 {code}，並已自本機紀錄同步移除。",
    alert_delete_expired_success: "訂票 {code} 繳費期限已逾期，已直接自本機紀錄刪除。",
    alert_cancel_online_failed: "官方線上退票失敗：{reason}，為保護資料完整，未刪除本機紀錄。",
    alert_ticket_not_found: "歷史紀錄中查無此車票。",
    alert_already_running: "自動撿票監控已在運行中，請勿重複啟動！",
    title_gen_pid: "隨機產生合規PID號",
    title_swap_stations: "對調出發站與抵達站",
    title_expand_stations: "展開所有車站",
    summary_initial: "共 0 筆紀錄",
    trip_to: "至",
    duration_tpl: "{h}小時{m}分",
    seat_tpl: "{car} 車 {seat} 號",
    lbl_split_mode: "多張配票方式",
    opt_mode_single_tpl: "一筆 {n} 張 (同筆訂單/代碼，座位連號機率高)",
    opt_mode_split_tpl: "拆成 {n} 筆 1 張 (逐張搶票，有 1 個位子就搶，推薦)",
    hint_mode_single: "📌 需該班次同時剩餘 ≥ {n} 個座位才會配位成功；若只剩 1 個位子則整筆失敗。",
    hint_mode_split: "📌 搶熱門車次必備！每次只訂 1 個座位，只要有人退 1 張票就先拿到，直到集滿 {n} 張。",
    log_target_split_tpl: "目標車次共 {count} 班: {trains} (拆單模式: 每次訂 1 張，逐張搶票直到滿 {qty} 張)",
    log_target_time_split_tpl: "目標時段: {range} (拆單模式: 每次訂 1 張，逐張搶票直到滿 {qty} 張)",
    log_check_round_split_tpl: "[{time}] 第 {round} 次檢查座位 (已訂 {curr}/{total} 張)...",
    log_check_round_time_split_tpl: "[{time}] 第 {round} 次檢查時段 {range} 座位 (已訂 {curr}/{total} 張)...",
    log_ticket_success_split_tpl: "🎉 撿票成功！車次 {train} | 訂票代碼：{code} (進度: {curr}/{total} 張)",
    log_all_completed_split_tpl: "🎊 已成功訂妥全部 {n} 張車票（共 {orders} 筆訂單）！任務完成。",
    log_remaining_split_tpl: "📌 目前已取得 {curr} 張，尚缺 {rem} 張，持續撿票監控中...",
    status_partial_split_tpl: "已成功搶得 {booked}/{total} 張！持續追蹤第 {next} 張中...",
    log_stop_signal_received: "已收到停止指示，正在釋放背景程序...",
    log_batch_tpl: "批次 {curr}/{total} ({trains})",
    log_batch_simple_tpl: "批次 {curr}/{total}",
    log_booking_feedback_tpl: "[{time}] {batch}訂票反饋: {msg}{ocr}",
    log_query_finished_wait_tpl: "[{time}] {msg}，等待下次查詢...",
    log_session_error_retry_tpl: "[{time}] {batch}瀏覽器連線中斷，已完成自動重啟修復，將於下輪重試",
    log_session_error_wait_tpl: "[{time}] 瀏覽器連線中斷，已完成自動重啟修復，將於下次重新查詢...",
    log_maint_recycling_tpl: "♻️ [定期維護] 已連續監控 {n} 輪，正在主動回收 Chrome 資源以釋放記憶體...",
    log_maint_restarted: "♻️ [定期維護] Chrome 瀏覽器資源回收完成，重啟就緒。",
    log_maint_error_tpl: "⚠️ [定期維護] 重啟瀏覽器發生微誤: {err}",
    msg_input_error: "輸入資料有誤，請檢查身分證號或起訖站",
    msg_no_seats: "該條件目前客滿無剩餘座位",
    msg_server_retry: "票務伺服器回應臨時異常，準備自動重試",
    msg_captcha_retry: "本輪查詢未完成，準備重新查詢",
    msg_session_error: "瀏覽器連線中斷，已完成自動重啟修復",
    msg_no_seats_short: "無座位",
    msg_query_done: "查詢完畢"
  },
  "en": {
    app_title: "Railway Smart Auto-Booking System",
    status_idle: "System Idle",
    status_running: "Auto-Monitoring Seats...",
    status_waiting_countdown: "Waiting for next check ({s}s)...",
    status_checking_seats: "Checking seat availability...",
    status_completed_tpl: "🎉 Booking Complete ({n} train(s) booked)!",
    status_stopped: "Monitoring Stopped",
    status_partial_tpl: "Successfully booked {booked}/{total}! Monitoring remaining {rem}...",
    nav_history: "📜 Booking History",
    card1_title: "1. Travel Itinerary Criteria",
    lbl_pid: "Passenger ID",
    pid_ph: "e.g., A153457990",
    pid_valid: "✓ Valid ID",
    pid_invalid: "✗ Checksum Error",
    pid_digits_tpl: "{n}/10 digits",
    btn_gen_pid: "🎲 Generate",
    log_pid_generated: "Random valid ID generated: {id}",
    lbl_start_station: "Departure",
    start_station_ph: "Station name or code (e.g. Taipei/1000)",
    lbl_end_station: "Arrival",
    end_station_ph: "Station name or code (e.g. Songshan/0990)",
    log_stations_swapped: "Stations swapped: {start} ➔ {end}",
    lbl_ride_date: "Travel Date",
    hint_booking_window_28d: "📌 Official ticket booking opens 28 days prior to departure at 00:00 midnight (public holidays announced separately). Dates more than 28 days ahead may fail as booking is not yet open.",
    lbl_start_time: "Start Time",
    lbl_end_time: "End Time (Max 8h)",
    lbl_qty: "Ticket Quantity",
    opt_qty_1: "1 Ticket",
    opt_qty_2: "2 Tickets",
    opt_qty_3: "3 Tickets",
    opt_qty_4: "4 Tickets",
    btn_query_trains: "🔍 Search Available Trains",
    btn_querying: "⏳ Querying timetable...",
    log_querying_trains_raw: "Searching trains for {date} {start} ➔ {end} ({times})...",
    log_query_success: "Found {n} train(s)! Please select trains to monitor.",
    log_query_fail: "Failed to query trains: {err}",
    card2_title: "2. Trains to Monitor",
    btn_select_all: "Select All",
    btn_clear_all: "Clear All",
    empty_state_desc: "Please configure criteria on the left and search trains to load options.",
    trains_empty_state: "No trains found in this time range. Please expand the time range and search again.",
    train_unit: "",
    selected_all_trains: "0 selected (will monitor all trains in time window)",
    selected_locked_tpl: "{n} train(s) locked: {trains}",
    selected_summary_tpl: "{n} train(s) selected",
    btn_start_polling: "⚡ Start Auto-Monitoring",
    btn_stop_polling: "⏹ Stop Monitoring",
    card3_title: "3. Live Monitoring Logs",
    round_badge_initial: "Poll Count: 0",
    round_badge_tpl: "Poll Count: {n}",
    save_hint: "📌 Booked tickets will be saved to successful_tickets.txt",
    sys_ready_log: "[System] Booking engine ready, supports local OCR and persistent Chrome.",
    log_monitor_stopped: "Auto-monitoring stopped.",
    log_sync_running: "Background monitoring session detected and synced!",
    log_conn_error: "System connection error: {err}",
    log_starting_chrome: "Starting background persistent Chrome browser...",
    log_chrome_ready: "Browser ready, starting automatic seat polling!",
    log_target_trains_tpl: "Target: {count} train(s): {trains} (Will finish when all booked)",
    log_target_time_tpl: "Target time: {range} (Book by time window)",
    log_check_round_tpl: "[{time}] Check #{round} ({rem}/{total} pending: {trains})...",
    log_check_round_time_tpl: "[{time}] Check #{round} for time slot {range}...",
    log_no_seats_tpl: "[{time}] {batch}No seats available currently{ocr}",
    log_captcha_retry_tpl: "[{time}] {batch}Captcha mismatch{ocr}, retrying...",
    log_ticket_success_tpl: "🎉 Booking Success! Train {train} | Code: {code} (Progress: {curr}/{total})",
    log_ticket_success_single_tpl: "🎉 Booking Success! Booking Code: {code}",
    log_all_completed_tpl: "🎊 Awesome! All {n} selected train(s) have been booked! Task completed.",
    log_remaining_trains_tpl: "📌 Remaining trains: {trains}, continuing monitoring...",
    alert_input_pid: "Please enter Passenger ID!",
    alert_start_failed: "Failed to start monitoring: {err}",
    modal_success_title: "Congratulations! Ticket Booked Successfully!",
    modal_success_btn: "Got It (Saved Locally)",
    modal_ticket_header: "🎫 Ticket #{n}: {type} {no}",
    modal_saved_hint: "📌 All data written locally to successful_tickets.txt & successful_tickets.json!",
    modal_history_title: "📜 Booking History Records",
    filter_by_date_prefix: "📅 Filter by Travel Date:",
    filter_summary_tpl: "Showing {n} / {total}",
    history_empty: "No booking records yet.",
    history_filter_empty: "No tickets found for {date}.",
    loading_history: "Loading history tickets...",
    history_load_failed: "Failed to load: {err}",
    pill_all: "All",
    code_label: "Booking Code",
    pid_label: "Passenger ID",
    train_label: "Train No.",
    seat_label: "Car & Seat",
    trip_label: "Route Segment",
    deadline_label: "Payment Deadline",
    ride_day_label: "Travel Date",
    recorded_at: "Recorded at",
    other_date: "Other",
    deadline_policy_default: "Per official policy",
    seat_auto_assigned: "Auto-assigned",
    badge_expired: "⚠️ Payment deadline expired",
    badge_active: "⏱️ Active (Eligible for cancellation)",
    btn_delete_expired: "🗑️ Delete Record (Expired)",
    btn_cancel_online: "❌ Cancel Ticket & Delete",
    confirm_delete_expired: "【Booking Code: {code}】\nPayment deadline has expired.\nDelete this local record?",
    confirm_cancel_online: "【Booking Code: {code}】\n⚠️ Payment deadline has NOT passed!\nCancelling will release the seat on official website and delete local record.\n\nProceed to cancel online?",
    op_processing: "⏳ Processing...",
    op_success: "Operation succeeded!",
    op_failed: "Operation failed: {msg}",
    network_error: "Network or server error: {err}",
    station_not_found: "No matching station",
    alert_cancel_online_success: "Official booking {code} cancelled successfully and removed from local records.",
    alert_delete_expired_success: "Booking {code} payment deadline has expired. Removed from local records.",
    alert_cancel_online_failed: "Online cancellation failed: {reason}. Local record preserved.",
    alert_ticket_not_found: "Ticket record not found in history.",
    alert_already_running: "Auto-monitoring is already running. Please do not start repeatedly!",
    title_gen_pid: "Generate valid random ID",
    title_swap_stations: "Swap departure and arrival stations",
    title_expand_stations: "Expand all stations",
    summary_initial: "0 records in total",
    trip_to: "to",
    duration_tpl: "{h}h {m}m",
    seat_tpl: "Car {car}, Seat {seat}",
    lbl_split_mode: "Allocation Mode",
    opt_mode_single_tpl: "Single order of {n} tickets (1 booking code, adjacent seats)",
    opt_mode_split_tpl: "Split into {n} orders of 1 ticket (Grabs 1 seat at a time, recommended)",
    hint_mode_single: "📌 Requires ≥ {n} seats available simultaneously; fails completely if only 1 seat is left.",
    hint_mode_split: "📌 Recommended for popular trains: Grabs 1 seat whenever released until {n} tickets reached.",
    log_target_split_tpl: "Target: {count} train(s): {trains} (Split mode: 1 ticket per order until {qty} reached)",
    log_target_time_split_tpl: "Target time: {range} (Split mode: 1 ticket per order until {qty} reached)",
    log_check_round_split_tpl: "[{time}] Check #{round} ({curr}/{total} tickets booked)...",
    log_check_round_time_split_tpl: "[{time}] Check #{round} for time {range} ({curr}/{total} tickets booked)...",
    log_ticket_success_split_tpl: "🎉 Booking Success! Train {train} | Code: {code} (Progress: {curr}/{total} tickets)",
    log_all_completed_split_tpl: "🎊 Awesome! Successfully booked all {n} tickets (in {orders} orders)! Task completed.",
    log_remaining_split_tpl: "📌 Secured {curr} ticket(s), {rem} more needed. Continuing monitoring...",
    status_partial_split_tpl: "Secured {booked}/{total} tickets! Hunting for ticket #{next}...",
    log_stop_signal_received: "Stop signal received, releasing background processes...",
    log_batch_tpl: "Batch {curr}/{total} ({trains})",
    log_batch_simple_tpl: "Batch {curr}/{total}",
    log_booking_feedback_tpl: "[{time}] {batch}Booking feedback: {msg}{ocr}",
    log_query_finished_wait_tpl: "[{time}] {msg}, waiting for next check...",
    log_session_error_retry_tpl: "[{time}] {batch}Browser connection lost, auto-restart completed, will retry next round",
    log_session_error_wait_tpl: "[{time}] Browser connection lost, auto-restart completed, waiting for next check...",
    log_maint_recycling_tpl: "♻️ [Maintenance] Monitored for {n} rounds continuously, recycling Chrome resources to free memory...",
    log_maint_restarted: "♻️ [Maintenance] Chrome resource recycling completed, browser restarted and ready.",
    log_maint_error_tpl: "⚠️ [Maintenance] Minor error while restarting browser: {err}",
    msg_input_error: "Invalid input data, please check Passenger ID or stations",
    msg_no_seats: "Currently sold out, no seats available",
    msg_server_retry: "Ticket server temporary anomaly, preparing to retry automatically",
    msg_captcha_retry: "Current round incomplete, preparing to retry",
    msg_session_error: "Browser connection lost, auto-restart completed",
    msg_no_seats_short: "No seats",
    msg_query_done: "Query completed"
  },
  "ja": {
    app_title: "スマート鉄道自動予約システム",
    status_idle: "待機中",
    status_running: "空席自動監視中...",
    status_waiting_countdown: "次回確認まで待機中 ({s}秒)...",
    status_checking_seats: "空席状況を確認中...",
    status_completed_tpl: "🎉 予約完了 (計 {n} 本確保)！",
    status_stopped: "監視停止",
    status_partial_tpl: "{booked}/{total} 本確保成功！残り {rem} 本を監視中...",
    nav_history: "📜 予約履歴",
    card1_title: "1. 乗車条件設定",
    lbl_pid: "身分証明書番号",
    pid_ph: "例: A153457990",
    pid_valid: "✓ 有効なID",
    pid_invalid: "✗ 検査数字エラー",
    pid_digits_tpl: "{n}/10 桁",
    btn_gen_pid: "🎲 自動生成",
    log_pid_generated: "有効なIDを自動生成しました: {id}",
    lbl_start_station: "出発駅",
    start_station_ph: "駅名または駅番号 (例: 臺北/1000)",
    lbl_end_station: "到着駅",
    end_station_ph: "駅名または駅番号 (例: 松山/0990)",
    log_stations_swapped: "発着駅を入れ替えました: {start} ➔ {end}",
    lbl_ride_date: "乗車日",
    hint_booking_window_28d: "📌 指定席乗車券は乗車日28日前の深夜00:00より予約受付が開始されます（祝日は別途発表）。28日以上先の乗車日を指定した場合、未発売のため予約に失敗する可能性があります。",
    lbl_start_time: "開始時間",
    lbl_end_time: "終了時間 (最大8時間)",
    lbl_qty: "予約枚数",
    opt_qty_1: "1 枚",
    opt_qty_2: "2 枚",
    opt_qty_3: "3 枚",
    opt_qty_4: "4 枚",
    btn_query_trains: "🔍 指定時間帯の列車を検索",
    btn_querying: "⏳ 公式時刻表を照会中...",
    log_querying_trains_raw: "{date} {start} ➔ {end} ({times}) の列車を照会中...",
    log_query_success: "{n} 本の列車情報を取得しました。追跡する列車を選択してください。",
    log_query_fail: "列車照会に失敗しました: {err}",
    card2_title: "2. 追跡対象列車",
    btn_select_all: "すべて選択",
    btn_clear_all: "選択解除",
    empty_state_desc: "左側で条件を設定し、「列車を検索」をクリックしてください。",
    trains_empty_state: "指定の時間帯に列車が見つかりませんでした。時間枠を広げて再検索してください。",
    train_unit: "号",
    selected_all_trains: "0本選択 (時間帯の全列車を監視)",
    selected_locked_tpl: "{n} 本の列車を追跡中: {trains}",
    selected_summary_tpl: "{n} 本の列車を選択中",
    btn_start_polling: "⚡ 自動監視予約を開始",
    btn_stop_polling: "⏹ 監視を停止",
    card3_title: "3. リアルタイム監視ログ",
    round_badge_initial: "巡回回数: 0",
    round_badge_tpl: "巡回回数: {n}",
    save_hint: "📌 予約完了時に successful_tickets.txt へ自動保存",
    sys_ready_log: "[システム] 予約エンジン準備完了。ローカルOCRおよびChrome接続対応。",
    log_monitor_stopped: "自動監視を停止しました。",

    log_sync_running: "バックグラウンドの監視セッションを検出し、状態を同期しました！",
    log_conn_error: "システム接続異常: {err}",
    log_starting_chrome: "バックグラウンド常駐 Chrome ブラウザを起動中...",
    log_chrome_ready: "ブラウザ準備完了、自動監視を開始します！",
    log_target_trains_tpl: "対象列車 計 {count} 本: {trains} (全列車確保で完了)",
    log_target_time_tpl: "対象時間帯: {range} (時間帯予約)",
    log_check_round_tpl: "[{time}] 第 {round} 回空席確認 ({rem}/{total} 本待機: {trains})...",
    log_check_round_time_tpl: "[{time}] 第 {round} 回 時間帯 {range} の空席を確認中...",
    log_no_seats_tpl: "[{time}] {batch}現在空席はありません{ocr}",
    log_captcha_retry_tpl: "[{time}] {batch}認証コード不一致{ocr}、再試行中...",
    log_ticket_success_tpl: "🎉 予約成功！列車 {train} | 予約番号：{code} (進捗: {curr}/{total} 本)",
    log_ticket_success_single_tpl: "🎉 予約成功！予約番号：{code}",
    log_all_completed_tpl: "🎊 素晴らしい！選択された {n} 本の列車がすべて確保されました！完了。",
    log_remaining_trains_tpl: "📌 残りの監視列車：{trains}、監視を継続中...",
    alert_input_pid: "身分証明書番号を入力してください！",
    alert_start_failed: "監視開始に失敗しました: {err}",
    modal_success_title: "おめでとうございます！予約が完了しました！",
    modal_success_btn: "了解（保存済み）",
    modal_ticket_header: "🎫 第 {n} 枚目の切符: {type} {no} 号",
    modal_saved_hint: "📌 データはすべてローカルの successful_tickets.txt / successful_tickets.json に保存されました！",
    modal_history_title: "📜 予約成功履歴",
    filter_by_date_prefix: "📅 乗車日で絞り込み：",
    filter_summary_tpl: "{n} / {total} 件表示中",
    history_empty: "予約履歴はありません",
    history_filter_empty: "指定日 ({date}) の予約記録はありません",
    loading_history: "履歴を読み込み中...",
    history_load_failed: "読み込み失敗: {err}",
    pill_all: "すべて",
    code_label: "予約番号 (引換コード)",
    pid_label: "身分証明書番号",
    train_label: "列車番号",
    seat_label: "号車・座席",
    trip_label: "運行区間",
    deadline_label: "支払・発券期限",
    ride_day_label: "乗車日",
    recorded_at: "記録日時",
    other_date: "その他",
    deadline_policy_default: "公式規定による",
    seat_auto_assigned: "システム自動割当",
    badge_expired: "⚠️ 支払期限切れ (無効)",
    badge_active: "⏱️ 支払期限内 (オンライン取消可能)",
    btn_delete_expired: "🗑️ 履歴を削除 (期限切れ)",
    btn_cancel_online: "❌ 予約取消および削除",
    confirm_delete_expired: "【予約番号 {code}】\n支払期限が切れています。\nローカル履歴から削除しますか？",
    confirm_cancel_online: "【予約番号 {code}】\n⚠️ 支払期限内です！\n取消を行うと公式サイト上で座席が開放され、ローカル記録も削除されます。\n\n本当にオンライン取消を行いますか？",
    op_processing: "⏳ 処理中...",
    op_success: "操作が完了しました！",
    op_failed: "操作に失敗しました: {msg}",
    network_error: "通信またはサーバー異常: {err}",
    station_not_found: "該当する駅がありません",
    alert_cancel_online_success: "公式サイトで予約番号 {code} の取消が完了し、ローカル記録から削除しました。",
    alert_delete_expired_success: "予約番号 {code} は支払期限切れのため、ローカル記録から削除しました。",
    alert_cancel_online_failed: "オンライン取消失敗: {reason}。データ保護のためローカル記録は保持されます。",
    alert_ticket_not_found: "履歴に対象の予約が見つかりませんでした。",
    alert_already_running: "自動監視は既に実行中です。重複して開始しないでください！",
    title_gen_pid: "有効なIDを自動生成",
    title_swap_stations: "出発駅と到着駅を入れ替え",
    title_expand_stations: "すべての駅を展開",
    summary_initial: "計 0 件の記録",
    trip_to: "〜",
    duration_tpl: "{h}時間{m}分",
    seat_tpl: "{car}号車 {seat}番",
    lbl_split_mode: "複数枚の予約方式",
    opt_mode_single_tpl: "1回で{n}枚一括予約 (同一予約コード、連番優先)",
    opt_mode_split_tpl: "1枚ずつ{n}回に分割予約 (空席が出次第1枚ずつ確保、推奨)",
    hint_mode_single: "📌 同時に {n} 席以上の空席が必要です。残り1席のみの場合は確保できません。",
    hint_mode_split: "📌 人気列車の空席拾いに最適！1席でもキャンセルが出れば即座に確保し、計 {n} 枚になるまで継続します。",
    log_target_split_tpl: "対象列車 {count} 本: {trains} (分割モード: 目標 {qty} 枚まで1枚ずつ確保)",
    log_target_time_split_tpl: "対象時間帯: {range} (分割モード: 目標 {qty} 枚まで1枚ずつ確保)",
    log_check_round_split_tpl: "[{time}] 第 {round} 回空席確認 (確保済 {curr}/{total} 枚)...",
    log_check_round_time_split_tpl: "[{time}] 第 {round} 回時間帯 {range} 空席確認 (確保済 {curr}/{total} 枚)...",
    log_ticket_success_split_tpl: "🎉 予約確保！列車 {train} | 予約コード: {code} (進捗: {curr}/{total} 枚)",
    log_all_completed_split_tpl: "🎊 目標達成！全 {n} 枚のチケット確保が完了しました（計 {orders} 件）！",
    log_remaining_split_tpl: "📌 現在 {curr} 枚確保、残り {rem} 枚を継続監視中...",
    status_partial_split_tpl: "{booked}/{total} 枚確保成功！残り {rem} 枚を監視中...",
    log_stop_signal_received: "停止指示を受信しました。バックグラウンド処理を解放中...",
    log_batch_tpl: "バッチ {curr}/{total} ({trains})",
    log_batch_simple_tpl: "バッチ {curr}/{total}",
    log_booking_feedback_tpl: "[{time}] {batch}予約フィードバック: {msg}{ocr}",
    log_query_finished_wait_tpl: "[{time}] {msg}、次回再照会をお待ちください...",
    log_session_error_retry_tpl: "[{time}] {batch}ブラウザ接続が切断されました。自動再起動が完了しました。次回試行します",
    log_session_error_wait_tpl: "[{time}] ブラウザ接続が切断されました。自動再起動が完了しました。次回再照会をお待ちください...",
    log_maint_recycling_tpl: "♻️ [定期メンテナンス] {n} ラウンド連続監視中、メモリ解放のため Chrome リソースを自動回収しています...",
    log_maint_restarted: "♻️ [定期メンテナンス] Chrome リソースの回収が完了し、再起動の準備が整いました。",
    log_maint_error_tpl: "⚠️ [定期メンテナンス] ブラウザ再起動中に軽微なエラーが発生しました: {err}",
    msg_input_error: "入力データに誤りがあります。ID番号または発着駅を確認してください",
    msg_no_seats: "満席のため空席がありません",
    msg_server_retry: "発券サーバー一時異常、自動再試行を準備中",
    msg_captcha_retry: "今回の照会が完了していません。再照会を準備中",
    msg_session_error: "ブラウザ接続が切断されました。自動再起動が完了しました",
    msg_no_seats_short: "空席なし",
    msg_query_done: "照会完了"
  },
  "ko": {
    app_title: "철도 스마트 자동 예매 시스템",
    status_idle: "대기 중",
    status_running: "좌석 자동 모니터링 중...",
    status_waiting_countdown: "다음 조회 대기 중 ({s}초)...",
    status_checking_seats: "좌석 현황 확인 중...",
    status_completed_tpl: "🎉 예매 완료 (총 {n}개 열차 예매 성공)!",
    status_stopped: "모니터링 중지됨",
    status_partial_tpl: "{booked}/{total}개 예매 성공! 잔여 {rem}개 모니터링 중...",
    nav_history: "📜 예매 내역",
    card1_title: "1. 승차 일정 조건",
    lbl_pid: "신분증 번호",
    pid_ph: "예: A153457990",
    pid_valid: "✓ 유효한 ID",
    pid_invalid: "✗ 유효성 검사 오류",
    pid_digits_tpl: "{n}/10 자리",
    btn_gen_pid: "🎲 생성",
    log_pid_generated: "유효한 신분증 번호가 생성되었습니다: {id}",
    lbl_start_station: "출발역",
    start_station_ph: "역명 또는 역코드 (예: 타이베이/1000)",
    lbl_end_station: "도착역",
    end_station_ph: "역명 또는 역코드 (예: 쑹산/0990)",
    log_stations_swapped: "출발/도착역이 전환되었습니다: {start} ➔ {end}",
    lbl_ride_date: "승차 일자",
    hint_booking_window_28d: "📌 지정석 승차권은 탑승일 28일 전 자정(00:00)부터 예매가 시작됩니다(공휴일 별도 공지). 28일 이후 날짜를 선택할 경우 예매 미개방으로 인해 실패할 수 있습니다.",
    lbl_start_time: "시작 시간",
    lbl_end_time: "종료 시간 (최대 8시간)",
    lbl_qty: "예매 매수",
    opt_qty_1: "1 매",
    opt_qty_2: "2 매",
    opt_qty_3: "3 매",
    opt_qty_4: "4 매",
    btn_query_trains: "🔍 해당 시간대 열차 조회",
    btn_querying: "⏳ 공식 시간표 조회 중...",
    log_querying_trains_raw: "{date} {start} ➔ {end} ({times}) 열차 운행 정보를 조회하는 중...",
    log_query_success: "{n}개 열차 정보를 성공적으로 조회했습니다. 모니터링할 열차를 선택하세요.",
    log_query_fail: "열차 조회 실패: {err}",
    card2_title: "2. 모니터링할 열차 번호",
    btn_select_all: "전체 선택",
    btn_clear_all: "선택 해제",
    empty_state_desc: "왼쪽에서 조건을 입력한 후 열차 조회를 클릭하세요.",
    trains_empty_state: "해당 시간대에 운행 열차가 없습니다. 시간 범위를 넓혀 다시 조회해보세요.",
    train_unit: "호",
    selected_all_trains: "0개 선택 (해당 시간대 전 열차 모니터링)",
    selected_locked_tpl: "{n}개 열차 지정됨: {trains}",
    selected_summary_tpl: "{n}개 열차 선택됨",
    btn_start_polling: "⚡ 자동 감시 예매 시작",
    btn_stop_polling: "⏹ 모니터링 중지",
    card3_title: "3. 실시간 모니터링 로그",
    round_badge_initial: "조회 횟수: 0",
    round_badge_tpl: "조회 횟수: {n}",
    save_hint: "📌 예매 성공 시 successful_tickets.txt 에 자동 저장",
    sys_ready_log: "[시스템] 예매 엔진 준비 완료. OCR 자동 인식 지원.",
    log_monitor_stopped: "자동 모니터링이 중지되었습니다.",
    log_sync_running: "백그라운드 모니터링 세션을 감지하여 상태를 동기화했습니다!",
    log_conn_error: "시스템 연결 오류: {err}",
    log_starting_chrome: "백그라운드 상주 Chrome 브라우저 실행 중...",
    log_chrome_ready: "브라우저 준비 완료, 자동 좌석 모니터링을 시작합니다!",
    log_target_trains_tpl: "목표 열차 총 {count}개: {trains} (모두 예매 완료 시 종료)",
    log_target_time_tpl: "목표 시간대: {range} (시간대 지정 예매)",
    log_check_round_tpl: "[{time}] {round}번째 좌석 확인 ({rem}/{total}개 대기: {trains})...",
    log_check_round_time_tpl: "[{time}] {round}번째 시간대 {range} 좌석 확인 중...",
    log_no_seats_tpl: "[{time}] {batch}현재 잔여 좌석 없음{ocr}",
    log_captcha_retry_tpl: "[{time}] {batch}보안문자 불일치{ocr}, 재시도 중...",
    log_ticket_success_tpl: "🎉 예매 성공! 열차 {train} | 예매 코드: {code} (진행: {curr}/{total})",
    log_ticket_success_single_tpl: "🎉 예매 성공! 예매 코드: {code}",
    log_all_completed_tpl: "🎊 완료! 선택한 {n}개 열차가 모두 예매되었습니다!",
    log_remaining_trains_tpl: "📌 잔여 모니터링 열차: {trains}, 계속 감시 중...",
    alert_input_pid: "신분증 번호를 입력하세요!",
    alert_start_failed: "모니터링 시작 실패: {err}",
    modal_success_title: "축하합니다! 열차표 예매에 성공했습니다!",
    modal_success_btn: "확인 (로컬 저장됨)",
    modal_ticket_header: "🎫 {n}번째 승차권: {type} {no} 호",
    modal_saved_hint: "📌 데이터가 로컬 successful_tickets.txt 및 successful_tickets.json에 모두 저장되었습니다!",
    modal_history_title: "📜 예매 성공 내역",
    filter_by_date_prefix: "📅 승차일 기준 필터：",
    filter_summary_tpl: "{n} / {total} 건 표시 중",
    history_empty: "예매 내역이 없습니다",
    history_filter_empty: "해당 일자 ({date})의 예매 내역이 없습니다",
    loading_history: "내역 불러오는 중...",
    history_load_failed: "불러오기 실패: {err}",
    pill_all: "전체",
    code_label: "예매 코드",
    pid_label: "신분증 번호",
    train_label: "열차 번호",
    seat_label: "호차 및 좌석",
    trip_label: "운행 구간",
    deadline_label: "결제 및 발권 기한",
    ride_day_label: "승차일",
    recorded_at: "기록 일시",
    other_date: "기타",
    deadline_policy_default: "공식 규정에 따름",
    seat_auto_assigned: "자동 배정",
    badge_expired: "⚠️ 결제 기한 만료 (효력 상실)",
    badge_active: "⏱️ 결제 기한 내 (온라인 취소 가능)",
    btn_delete_expired: "🗑️ 내역 삭제 (기한 만료)",
    btn_cancel_online: "❌ 예매 취소 및 삭제",
    confirm_delete_expired: "【예매 코드 {code}】\n결제 기한이 만료되었습니다.\n로컬 내역에서 삭제하시겠습니까?",
    confirm_cancel_online: "【예매 코드 {code}】\n⚠️ 결제 기한 내 승차권입니다!\n취소 시 공식 사이트에서 좌석이 즉시 반환되며 로컬 내역도 삭제됩니다.\n\n정말 온라인 예매 취소를 진행하시겠습니까?",
    op_processing: "⏳ 처리 중...",
    op_success: "작업이 완료되었습니다!",
    op_failed: "작업 실패: {msg}",
    network_error: "네트워크 또는 서버 오류: {err}",
    station_not_found: "일치하는 역이 없습니다",
    alert_cancel_online_success: "공식 사이트에서 예매 {code} 취소가 성공적으로 완료되었으며 로컬 기록에서 삭제되었습니다.",
    alert_delete_expired_success: "예매 {code}의 결제 기한이 만료되어 로컬 기록에서 직접 삭제되었습니다.",
    alert_cancel_online_failed: "온라인 취소 실패: {reason}. 데이터 보호를 위해 로컬 기록을 유지합니다.",
    alert_ticket_not_found: "내역에서 해당 승차권을 찾을 수 없습니다.",
    alert_already_running: "자동 예매 모니터링이 이미 실행 중입니다. 중복 실행하지 마세요!",
    title_gen_pid: "유효한 신분증 번호 자동 생성",
    title_swap_stations: "출발역과 도착역 맞바꾸기",
    title_expand_stations: "모든 역 펼치기",
    summary_initial: "총 0건의 기록",
    trip_to: "~",
    duration_tpl: "{h}시간{m}분",
    seat_tpl: "{car}호차 {seat}석",
    lbl_split_mode: "다인 티켓 배정 방식",
    opt_mode_single_tpl: "1회 {n}장 일괄 예매 (동일 예약번호, 연석 우선)",
    opt_mode_split_tpl: "1장씩 {n}회 분할 예매 (1석씩 나오는 대로 확보, 권장)",
    hint_mode_single: "📌 동시에 {n}석 이상 잔여석이 있어야 성공하며, 1석만 남은 경우 전체 실패합니다.",
    hint_mode_split: "📌 매진 임박 열차 필수! 취소표가 1석만 나와도 즉시 예매하며, 총 {n}장이 될 때까지 반복합니다.",
    log_target_split_tpl: "대상 열차 {count} 편: {trains} (분할 모드: 목표 {qty} 장까지 1장씩 예매)",
    log_target_time_split_tpl: "대상 시간대: {range} (분할 모드: 목표 {qty} 장까지 1장씩 예매)",
    log_check_round_split_tpl: "[{time}] 제 {round} 회 좌석 확인 (예매 완료 {curr}/{total} 장)...",
    log_check_round_time_split_tpl: "[{time}] 제 {round} 회 시간대 {range} 좌석 확인 (예매 완료 {curr}/{total} 장)...",
    log_ticket_success_split_tpl: "🎉 예매 성공! 열차 {train} | 예약번호: {code} (진행: {curr}/{total} 장)",
    log_all_completed_split_tpl: "🎊 축하합니다! 총 {n}장의 티켓을 모두 성공적으로 예매했습니다（총 {orders}건）!",
    log_remaining_split_tpl: "📌 현재 {curr}장 확보, 남은 {rem}장 지속 모니터링 중...",
    status_partial_split_tpl: "{booked}/{total} 장 확보 완료! 남은 {rem} 장 모니터링 중...",
    log_stop_signal_received: "중지 명령을 수신했습니다. 백그라운드 프로세스를 해제하는 중...",
    log_batch_tpl: "배치 {curr}/{total} ({trains})",
    log_batch_simple_tpl: "배치 {curr}/{total}",
    log_booking_feedback_tpl: "[{time}] {batch}예매 피드백: {msg}{ocr}",
    log_query_finished_wait_tpl: "[{time}] {msg}, 다음 조회 대기 중...",
    log_session_error_retry_tpl: "[{time}] {batch}브라우저 연결 끊김, 자동 재시작 복구 완료, 다음 라운드에서 재시도합니다",
    log_session_error_wait_tpl: "[{time}] 브라우저 연결 끊김, 자동 재시작 복구 완료, 다음 조회 대기 중...",
    log_maint_recycling_tpl: "♻️ [정기 유지관리] {n} 라운드 연속 모니터링 중, 메모리 확보를 위해 Chrome 리소스를 회수하고 있습니다...",
    log_maint_restarted: "♻️ [정기 유지관리] Chrome 리소스 회수 완료, 브라우저 재시작 준비 완료.",
    log_maint_error_tpl: "⚠️ [정기 유지관리] 브라우저 재시작 중 경미한 오류 발생: {err}",
    msg_input_error: "입력 정보 오류, 신분증 번호 또는 출도착역을 확인하세요",
    msg_no_seats: "현재 만석으로 잔여 좌석이 없습니다",
    msg_server_retry: "발권 서버 일시적 오류, 자동 재시도 준비 중",
    msg_captcha_retry: "이번 조회가 완료되지 않음, 재조회 준비 중",
    msg_session_error: "브라우저 연결 끊김, 자동 재시작 복구 완료",
    msg_no_seats_short: "좌석 없음",
    msg_query_done: "조회 완료"
  }
};

let currentLang = localStorage.getItem("app_lang") || "zh-TW";
let currentRoundCount = 0;
let isCurrentRunning = false;
let hasStopped = false;
let rawLogsList = [];

function t(key, params = {}) {
  const dict = I18N[currentLang] || I18N["zh-TW"];
  let text = dict[key] || (I18N["zh-TW"] && I18N["zh-TW"][key]) || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return text;
}

// 星期對照表
const WEEKDAY_NAMES = {
  1: { "zh-TW": "星期一", en: "Mon", ja: "月", ko: "월" },
  2: { "zh-TW": "星期二", en: "Tue", ja: "火", ko: "화" },
  3: { "zh-TW": "星期三", en: "Wed", ja: "水", ko: "수" },
  4: { "zh-TW": "星期四", en: "Thu", ja: "木", ko: "목" },
  5: { "zh-TW": "星期五", en: "Fri", ja: "金", ko: "금" },
  6: { "zh-TW": "星期六", en: "Sat", ja: "土", ko: "토" },
  0: { "zh-TW": "星期日", en: "Sun", ja: "日", ko: "일" }
};

// 車種名稱對照表 (站名保留，車種隨語系切換)
const TRAIN_TYPES_MAP = {
  "自強(3000)": { "zh-TW": "自強(3000)", en: "Tze-Chiang (3000)", ja: "自強(3000)号", ko: "쯔창(3000)호" },
  "自強（3000）": { "zh-TW": "自強(3000)", en: "Tze-Chiang (3000)", ja: "自強(3000)号", ko: "쯔창(3000)호" },
  "自強": { "zh-TW": "自強", en: "Tze-Chiang", ja: "自強号", ko: "쯔창호" },
  "新自強": { "zh-TW": "新自強", en: "New Tze-Chiang", ja: "新自強号", ko: "신쯔창호" },
  "普悠瑪": { "zh-TW": "普悠瑪", en: "Puyuma", ja: "普悠瑪号", ko: "푸유마호" },
  "太魯閣": { "zh-TW": "太魯閣", en: "Taroko", ja: "タロコ号", ko: "타로코호" },
  "莒光": { "zh-TW": "莒光", en: "Chu-Kwang", ja: "莒光号", ko: "쥐광호" },
  "區間快": { "zh-TW": "區間快", en: "Fast Local", ja: "区間快車", ko: "구간쾌차" },
  "區間": { "zh-TW": "區間", en: "Local", ja: "区間車", ko: "구간차" }
};

function formatTrainType(type) {
  if (!type || typeof type !== "string") return type || "";
  const clean = type.trim();

  // 1. 精準對映
  if (TRAIN_TYPES_MAP[clean]) {
    return TRAIN_TYPES_MAP[clean][currentLang] || TRAIN_TYPES_MAP[clean]["zh-TW"] || clean;
  }

  // 2. 智慧特徵識別 (處理「新自強(3000)」、「區間車」、「自強號」等官方不同介面的命名變體)
  if (clean.includes("3000")) {
    return { "zh-TW": "新自強(3000)", en: "Tze-Chiang (3000)", ja: "自強(3000)号", ko: "쯔창(3000)호" }[currentLang] || "Tze-Chiang (3000)";
  }
  if (clean.includes("普悠瑪")) {
    return { "zh-TW": "普悠瑪", en: "Puyuma", ja: "普悠瑪号", ko: "푸유마호" }[currentLang] || "Puyuma";
  }
  if (clean.includes("太魯閣")) {
    return { "zh-TW": "太魯閣", en: "Taroko", ja: "タロコ号", ko: "타로코호" }[currentLang] || "Taroko";
  }
  if (clean.includes("區間快")) {
    return { "zh-TW": "區間快", en: "Fast Local", ja: "区間快車", ko: "구간쾌차" }[currentLang] || "Fast Local";
  }
  if (clean.includes("區間")) {
    return { "zh-TW": "區間車", en: "Local", ja: "区間車", ko: "구간차" }[currentLang] || "Local";
  }
  if (clean.includes("新自強")) {
    return { "zh-TW": "新自強", en: "New Tze-Chiang", ja: "新自強号", ko: "신쯔창호" }[currentLang] || "New Tze-Chiang";
  }
  if (clean.includes("自強")) {
    return { "zh-TW": "自強", en: "Tze-Chiang", ja: "自強号", ko: "쯔창호" }[currentLang] || "Tze-Chiang";
  }
  if (clean.includes("莒光")) {
    return { "zh-TW": "莒光", en: "Chu-Kwang", ja: "莒光号", ko: "쥐광호" }[currentLang] || "Chu-Kwang";
  }

  return clean;
}

function formatSeat(seat) {
  if (!seat || typeof seat !== "string") return t("seat_auto_assigned");
  const parts = seat.split(/[,，]/);
  const formattedParts = parts.map(part => {
    const s = part.trim();
    const m = s.match(/(\d+)\s*(?:車|號車|호차|Car)\s*(\d+)\s*(?:號|番|석|Seat)/i) ||
      s.match(/(\d+)\s*車\s*(\d+)\s*號/);
    if (m) {
      return t("seat_tpl", { car: m[1], seat: m[2] });
    }
    return s;
  });
  const res = formattedParts.join(", ");
  if (res.includes("配位") || res.includes("自動") || res.includes("assigned")) {
    return t("seat_auto_assigned");
  }
  return res || t("seat_auto_assigned");
}

function formatWeekdayInText(text) {
  if (!text || typeof text !== "string") return text;
  const weekMap = {
    "星期一": 1, "一": 1, "Mon": 1, "Monday": 1, "月": 1, "월": 1,
    "星期二": 2, "二": 2, "Tue": 2, "Tuesday": 2, "火": 2, "화": 2,
    "星期三": 3, "三": 3, "Wed": 3, "Wednesday": 3, "水": 3, "수": 3,
    "星期四": 4, "四": 4, "Thu": 4, "Thursday": 4, "木": 4, "목": 4,
    "星期五": 5, "五": 5, "Fri": 5, "Friday": 5, "金": 5, "금": 5,
    "星期六": 6, "六": 6, "Sat": 6, "Saturday": 6, "土": 6, "토": 6,
    "星期日": 0, "星期天": 0, "日": 0, "Sun": 0, "Sunday": 0, "일": 0
  };

  return text.replace(/\((星期[一二三四五六日天]|[一二三四五六日天]|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?|[月火水木金土日月화수목금토일])\)/gi, (match, w) => {
    const day = weekMap[w];
    if (day !== undefined && WEEKDAY_NAMES[day]) {
      const localized = WEEKDAY_NAMES[day][currentLang] || WEEKDAY_NAMES[day]["zh-TW"];
      return `(${localized})`;
    }
    return match;
  });
}

function formatTripInfo(tripInfo) {
  if (!tripInfo || typeof tripInfo !== "string") return tripInfo || "";
  // 1. 替換星期幾
  let formatted = formatWeekdayInText(tripInfo);
  // 2. 替換「至」/「到」連接詞 (保留起訖中文站名)
  const toText = ` ${t("trip_to")} `;
  formatted = formatted.replace(/\s+(?:至|到|➔|to|~|〜)\s+/g, toText);
  return formatted;
}

function formatPayDeadline(deadline) {
  if (!deadline || typeof deadline !== "string") return t("deadline_policy_default");
  return formatWeekdayInText(deadline);
}

function formatDuration(dur) {
  if (!dur || typeof dur !== "string") return dur || "";

  // 匹配「小時」與「分」，例: "1 小時 20 分"、"0小時06分"
  const mHm = dur.match(/(\d+)\s*(?:小時|時間|시간|h|hr)\s*(\d+)\s*(?:分|분|m|min)/);
  if (mHm) {
    const h = parseInt(mHm[1], 10);
    const m = parseInt(mHm[2], 10);
    if (currentLang === "en") return `${h}h ${m}m`;
    if (currentLang === "ja") return `${h}時間${m}分`;
    if (currentLang === "ko") return `${h}시간${m}분`;
    return `${h}小時${m}分`;
  }

  // 匹配單純「分」，例: "6 分"、"06分"、"6分"
  const mM = dur.match(/(\d+)\s*(?:分|분|m|min)/);
  if (mM) {
    const m = parseInt(mM[1], 10);
    if (currentLang === "en") return `${m}m`;
    if (currentLang === "ja") return `${m}分`;
    if (currentLang === "ko") return `${m}분`;
    return `${m}分`;
  }

  // 匹配單純「小時」，例: "1 小時"
  const mH = dur.match(/(\d+)\s*(?:小時|時間|시간|h|hr)/);
  if (mH) {
    const h = parseInt(mH[1], 10);
    if (currentLang === "en") return `${h}h`;
    if (currentLang === "ja") return `${h}時間`;
    if (currentLang === "ko") return `${h}시간`;
    return `${h}小時`;
  }

  return dur;
}

// 非阻塞式訊息通知 (替代瀏覽器原生 alert 彈窗)
function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠️",
    info: "ℹ️"
  };

  const toast = document.createElement("div");
  toast.className = `toast-message ${type}`;
  toast.innerHTML = `<span style="font-size:16px;">${icons[type] || "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fadeout");
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 280);
  }, duration);
}

// 監控運行中鎖定或解鎖上方所有操作選單
function updateFormControlsLock(isLocked) {
  // 1. 乘車行程條件區 (Card 1)
  const formIds = [
    "pidInput", "genPidBtn", "startStationInput", "startStationToggleBtn",
    "swapStationsBtn", "endStationInput", "endStationToggleBtn",
    "rideDateInput", "startTimeSelect", "endTimeSelect", "qtySelect", "splitModeSelect", "queryTrainsBtn"
  ];
  formIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isLocked;
  });

  // 關閉任何開啟中的車站下拉選單
  if (isLocked) {
    document.querySelectorAll(".combobox-group.open").forEach(g => {
      g.classList.remove("open");
      const d = g.querySelector(".combobox-dropdown");
      if (d) d.style.display = "none";
    });
  }

  // 2. 欲追蹤列車號碼區 (Card 2)
  const actionIds = ["selectAllBtn", "clearAllBtn"];
  actionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = isLocked;
  });

  // 車次卡片內的 checkbox 與可點擊狀態
  document.querySelectorAll(".train-card").forEach(card => {
    card.classList.toggle("disabled", isLocked);
    const chk = card.querySelector(".train-checkbox");
    if (chk) chk.disabled = isLocked;
  });

  // 視覺效果鎖定
  const configCard = document.querySelector(".config-card");
  if (configCard) configCard.classList.toggle("locked-card", isLocked);
  const trainsCard = document.querySelector(".trains-card");
  if (trainsCard) trainsCard.classList.toggle("locked-card", isLocked);
}

function formatBatch(batchStr) {
  if (!batchStr || typeof batchStr !== "string") return batchStr;
  const m = batchStr.match(/批次\s*(\d+)\/(\d+)(?:\s*\((.*?)\))?/) ||
            batchStr.match(/Batch\s*(\d+)\/(\d+)(?:\s*\((.*?)\))?/) ||
            batchStr.match(/バッチ\s*(\d+)\/(\d+)(?:\s*\((.*?)\))?/) ||
            batchStr.match(/배치\s*(\d+)\/(\d+)(?:\s*\((.*?)\))?/);
  if (m) {
    if (m[3]) {
      return t("log_batch_tpl", { curr: m[1], total: m[2], trains: m[3] });
    }
    return t("log_batch_simple_tpl", { curr: m[1], total: m[2] });
  }
  return batchStr;
}

function translateFeedbackMsg(msg) {
  if (!msg || typeof msg !== "string") return msg;
  const trimmed = msg.trim();
  if (trimmed.includes("輸入資料有誤") || trimmed.includes("檢查身分證") || trimmed.includes("檢查PID") || trimmed.includes("Invalid input")) {
    return t("msg_input_error");
  }
  if (trimmed.includes("客滿無剩餘座位") || trimmed.includes("無剩餘座位") || trimmed.includes("sold out") || trimmed.includes("満席") || trimmed.includes("만석")) {
    return t("msg_no_seats");
  }
  if (trimmed.includes("伺服器回應臨時異常") || trimmed.includes("臨時異常") || trimmed.includes("server temporary anomaly") || trimmed.includes("サーバー一時異常") || trimmed.includes("서버 일시적 오류")) {
    return t("msg_server_retry");
  }
  if (trimmed.includes("本輪查詢未完成") || trimmed.includes("重新查詢") || trimmed.includes("round incomplete") || trimmed.includes("再照会を準備中") || trimmed.includes("재조회 준비 중")) {
    return t("msg_captcha_retry");
  }
  if (trimmed.includes("瀏覽器連線中斷") || trimmed.includes("Browser connection lost") || trimmed.includes("ブラウザ接続が切断") || trimmed.includes("브라우저 연결 끊김")) {
    return t("msg_session_error");
  }
  if (trimmed === "無座位" || trimmed === "No seats" || trimmed === "空席なし" || trimmed === "좌석 없음") {
    return t("msg_no_seats_short");
  }
  if (trimmed === "查詢完畢" || trimmed === "Query completed" || trimmed === "照会完了" || trimmed === "조회 완료") {
    return t("msg_query_done");
  }
  return msg;
}

function formatLogMessage(raw) {
  if (!raw || typeof raw !== "string") return raw;

  if (raw.includes("票務撿票引擎就緒") || raw.includes("Booking engine ready") || raw.includes("予約エンジン準備完了") || raw.includes("예매 엔진準備 완료") || raw.includes("撿票引擎就緒") || raw.includes("Engine ready")) {
    return t("sys_ready_log");
  }
  if (raw.includes("正在啟動背景常駐 Chrome") || raw.includes("Starting background persistent Chrome")) {
    return t("log_starting_chrome");
  }
  if (raw.includes("瀏覽器已就緒") || raw.includes("Browser ready") || raw.includes("ブラウザ準備完了") || raw.includes("브라우저 준비 완료")) {
    return t("log_chrome_ready");
  }
  if (raw.includes("偵測到背景撿票監控正在運行中") || raw.includes("Background monitoring session detected")) {
    return t("log_sync_running");
  }
  if (raw.includes("已停止自動撿票監控") || raw.includes("Auto-monitoring stopped")) {
    return t("log_monitor_stopped");
  }

  let m = raw.match(/已隨機生成合規PID號:\s*([A-Z0-9]+)/i) || raw.match(/Random valid ID generated:\s*([A-Z0-9]+)/i);
  if (m) return t("log_pid_generated", { id: m[1] });

  m = raw.match(/起訖站已對調:\s*(.+?)\s*➔\s*(.+)/) || raw.match(/Stations swapped:\s*(.+?)\s*➔\s*(.+)/);
  if (m) return t("log_stations_swapped", { start: m[1], end: m[2] });

  // 4. 目標車次 / 時段 (拆單模式)
  m = raw.match(/目標車次共\s*(\d+)\s*班:\s*(.+?)\s*\(拆單模式:\s*分\s*(\d+)\s*筆請求，需每一班車各訂滿\s*(\d+)\s*張，每筆\s*1\s*張\)/);
  if (m) return t("log_target_trains_split_reqs_tpl", { count: m[1], trains: m[2], reqs: m[3], qty: m[4] });

  m = raw.match(/目標車次共\s*(\d+)\s*班:\s*(.+?)\s*\(拆單模式:\s*每次訂\s*1\s*張，逐張搶票直到滿\s*(\d+)\s*張\)/);
  if (m) return t("log_target_split_tpl", { count: m[1], trains: m[2], qty: m[3] });

  m = raw.match(/目標時段:\s*(.+?)\s*\(拆單模式:\s*每次訂\s*1\s*張，(?:累計搶滿|逐張搶票直到滿)\s*(\d+)\s*張\)/);
  if (m) return t("log_target_time_split_tpl", { range: m[1], qty: m[2] });

  // 5. 目標車次 / 時段 (整筆模式 / 一般模式)
  m = raw.match(/目標車次共\s*(\d+)\s*班:\s*(.+?)\s*\(整筆模式:\s*分\s*(\d+)\s*筆請求，需每一班車各訂到\s*1\s*筆\s*(\d+)\s*張\)/);
  if (m) return t("log_target_trains_batch_tpl", { count: m[1], trains: m[2], reqs: m[3], qty: m[4] });

  m = raw.match(/目標車次共\s*(\d+)\s*班:\s*(.+?)\s*\(需全部訂到才結束(?:，每筆\s*\d+\s*張)?\)/) || raw.match(/Target:\s*(\d+)\s*train\(s\):\s*(.+?)\s*\(Will finish/);
  if (m) return t("log_target_trains_tpl", { count: m[1], trains: m[2] });

  m = raw.match(/目標時段:\s*(.+?)\s*\(依時段單程訂票(?:，每筆\s*(\d+)\s*張)?\)/) || raw.match(/Target time:\s*(.+?)\s*\(Book by/);
  if (m) return t("log_target_time_tpl", { range: m[1], qty: m[2] || "1" });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查座位\s*\(已訂\s*(\d+)\/(\d+)\s*張.*?\)\.\.\./);
  if (m) return t("log_check_round_split_tpl", { time: m[1], round: m[2], curr: m[3], total: m[4] });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查時段\s*(.+?)\s*座位\s*\(已訂\s*(\d+)\/(\d+)\s*張\)\.\.\./);
  if (m) return t("log_check_round_time_split_tpl", { time: m[1], round: m[2], range: m[3], curr: m[4], total: m[5] });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查座位\s*\((\d+)\/(\d+)\s*班待訂:\s*(.*?)\)\.\.\./) ||
    raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*Check #(\d+)\s*\((\d+)\/(\d+)\s*pending:\s*(.*?)\)\.\.\./);
  if (m) return t("log_check_round_tpl", { time: m[1], round: m[2], rem: m[3], total: m[4], trains: m[5] });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查時段\s*(.+?)\s*座位狀態中\.\.\./) ||
    raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*Check #(\d+)\s*for time slot\s*(.+?)\.\.\./);
  if (m) return t("log_check_round_time_tpl", { time: m[1], round: m[2], range: m[3] });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?目前無剩餘座位(?:\s*\(OCR:\s*(.*?)\))?(?:，等待下次.*)?/) ||
    raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?No seats available currently(?:\s*\(OCR:\s*(.*?)\))?/);
  if (m) {
    return t("log_no_seats_tpl", {
      time: m[1],
      batch: m[2] ? `[${formatBatch(m[2])}] ` : "",
      ocr: m[3] ? ` (OCR: ${m[3]})` : ""
    });
  }

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?驗證碼微誤(?:\s*\(OCR:\s*(.*?)\))?，(?:換圖再試|等待後重新整理再試\.\.\.)/) ||
    raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?Captcha mismatch(?:\s*\(OCR:\s*(.*?)\))?/);
  if (m) {
    return t("log_captcha_retry_tpl", {
      time: m[1],
      batch: m[2] ? `[${formatBatch(m[2])}] ` : "",
      ocr: m[3] ? ` (OCR: ${m[3]})` : ""
    });
  }

  m = raw.match(/正在查詢\s*(\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*(.+?)\s*➔\s*(.+?)\s*\((.+?)\)\s*列車班次\.\.\./) ||
    raw.match(/Searching trains for\s*(\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*(.+?)\s*➔\s*(.+?)\s*\((.+?)\)\.\.\./);
  if (m) return t("log_querying_trains_raw", { date: m[1], start: m[2], end: m[3], times: m[4] });

  m = raw.match(/成功查得\s*(\d+)\s*班列車資訊！請勾選欲追蹤的車次。/) ||
    raw.match(/Found\s*(\d+)\s*train\(s\)!/);
  if (m) return t("log_query_success", { n: m[1] });

  m = raw.match(/🎉\s*撿票成功！車次\s*(\w+)\s*\|\s*訂票代碼：(\w+)\s*\(進度:\s*(\d+)\/(\d+)\s*張\)/);
  if (m) return t("log_ticket_success_split_tpl", { train: m[1], code: m[2], curr: m[3], total: m[4] });

  m = raw.match(/🎉\s*撿票成功！車次\s*(\w+)\s*\|\s*訂票代碼：(\w+)\s*\(進度:\s*(\d+)\/(\d+)\s*班\)/) ||
    raw.match(/🎉\s*Booking Success!\s*Train\s*(\w+)\s*\|\s*Code:\s*(\w+)\s*\(Progress:\s*(\d+)\/(\d+)\)/);
  if (m) return t("log_ticket_success_tpl", { train: m[1], code: m[2], curr: m[3], total: m[4] });

  m = raw.match(/🎉\s*撿票成功！訂票電腦代碼：(\w+)/) ||
    raw.match(/🎉\s*Booking Success!\s*Booking Code:\s*(\w+)/);
  if (m) return t("log_ticket_success_single_tpl", { code: m[1] });

  m = raw.match(/🎊\s*(?:太棒了！)?已成功訂妥全部\s*(\d+)\s*張車票(?:（共\s*(\d+)\s*筆訂單）)?！任務完成。/);
  if (m) return t("log_all_completed_split_tpl", { n: m[1], orders: m[2] || m[1] });

  m = raw.match(/🎊\s*(?:太棒了！)?所選之\s*(\d+)\s*班車次(?:均已全數訂滿\s*(\d+)\s*張|已全部訂妥)！任務完成。/) ||
    raw.match(/🎊\s*Awesome!\s*All\s*(\d+)\s*selected/);
  if (m) return t("log_all_completed_tpl", { n: m[1] });

  m = raw.match(/📌\s*目前已取得\s*(\d+)\s*張，尚缺\s*(\d+)\s*張，持續撿票監控中\.\.\./);
  if (m) return t("log_remaining_split_tpl", { curr: m[1], rem: m[2] });

  m = raw.match(/📌\s*(?:剩餘待訂車次|各班待訂進度)：(.*?)，持續撿票監控中\.\.\./) ||
    raw.match(/📌\s*Remaining trains:\s*(.*?), continuing/);
  if (m) return t("log_remaining_trains_tpl", { trains: m[1] });

  // 14. 定期維護
  m = raw.match(/♻️\s*\[(?:定期維護|Maintenance|定期メンテナンス|정기 유지관리)\]\s*(?:已連續監控\s*(\d+)\s*輪，正在主動回收 Chrome 資源以釋放記憶體\.\.\.|Monitored for\s*(\d+)\s*rounds continuously, recycling Chrome resources to free memory\.\.\.)/);
  if (m) {
    return t("log_maint_recycling_tpl", { n: m[1] || m[2] });
  }

  if (
    raw.includes("Chrome 瀏覽器資源回收完成，重啟就緒") ||
    raw.includes("Chrome resource recycling completed, browser restarted and ready") ||
    raw.includes("Chrome リソースの回収が完了し、再起動の準備が整いました") ||
    raw.includes("Chrome 리소스 회수 완료, 브라우저 재시작 준비 완료")
  ) {
    return t("log_maint_restarted");
  }

  m = raw.match(/⚠️\s*\[(?:定期維護|Maintenance|定期メンテナンス|정기 유지관리)\]\s*(?:重啟瀏覽器發生微誤|Minor error while restarting browser):\s*(.+)/);
  if (m) {
    return t("log_maint_error_tpl", { err: m[1] });
  }

  // 15. Session 斷線自動修復
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?(?:瀏覽器連線中斷，已完成自動重啟修復，將於下輪重試|Browser connection lost, auto-restart completed, will retry next round)/);
  if (m) {
    const formattedBatch = m[2] ? `[${formatBatch(m[2])}] ` : "";
    return t("log_session_error_retry_tpl", {
      time: m[1],
      batch: formattedBatch,
    });
  }

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:瀏覽器連線中斷，已完成自動重啟修復，將於下次重新查詢\.\.\.|Browser connection lost, auto-restart completed, waiting for next check\.\.\.)/);
  if (m) {
    return t("log_session_error_wait_tpl", {
      time: m[1],
    });
  }

  // 16. 訂票反饋
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?(?:訂票反饋|Booking feedback|予約フィードバック|예매 피드백):\s*(.+?)(?:\s*\(OCR:\s*(.*?)\))?$/);
  if (m) {
    const formattedBatch = m[2] ? `[${formatBatch(m[2])}] ` : "";
    return t("log_booking_feedback_tpl", {
      time: m[1],
      batch: formattedBatch,
      msg: translateFeedbackMsg(m[3]),
      ocr: m[4] ? ` (OCR: ${m[4]})` : "",
    });
  }

  // 17. 查詢完畢等待下次查詢
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(.+?)，等待下次查詢\.\.\./) ||
      raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(.+?),\s*waiting for next check\.\.\./);
  if (m) {
    return t("log_query_finished_wait_tpl", {
      time: m[1],
      msg: translateFeedbackMsg(m[2]),
    });
  }

  // 18. 發生異常
  m = raw.match(/發生異常:\s*(.+)/);
  if (m) return t("log_error_tpl", { e: m[1] });

  return raw;
}

function updateLanguageUI() {
  document.title = "Railway Auto-Pilot - Smart Ticket Booking System";
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) {
      el.placeholder = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.dataset.i18nTitle;
    if (key) {
      el.title = t(key);
    }
  });

  const pidInput = document.getElementById("pidInput");
  if (pidInput) {
    pidInput.placeholder = t("pid_ph");
    if (pidInput.value) {
      updatePidValidationUI(pidInput.value);
    }
  }
  const startInput = document.getElementById("startStationInput");
  if (startInput) startInput.placeholder = t("start_station_ph");
  const endInput = document.getElementById("endStationInput");
  if (endInput) endInput.placeholder = t("end_station_ph");

  const sel = document.getElementById("langSelect");
  if (sel) sel.value = currentLang;

  // 更新輪詢計數
  const roundBadge = document.getElementById("roundBadge");
  if (roundBadge) {
    roundBadge.textContent = t("round_badge_tpl", { n: currentRoundCount });
  }

  // 更新已選取班次摘要
  updateTrainSelectionSummary();

  // 更新狀態文字
  const statusText = document.getElementById("statusText");
  if (statusText) {
    if (isCurrentRunning) {
      statusText.textContent = t("status_running");
    } else if (hasStopped) {
      statusText.textContent = t("status_stopped");
    } else {
      statusText.textContent = t("status_idle");
    }
  }

  // 若車次清單已渲染，重新更新車次卡片介面
  if (currentTrains && currentTrains.length > 0) {
    renderTrainsList(currentTrains);
  }

  // 重新以新語言渲染小黑框日誌
  renderAllTerminalLogs();

  // 更新多張配票方式選單與提示
  updateSplitModeUI();

  // 若歷史紀錄開著，重新渲染
  if (typeof allHistoryTickets !== "undefined" && allHistoryTickets && allHistoryTickets.length > 0) {
    renderHistoryFilterBar();
    renderFilteredHistoryList();
  }
}

// 動態更新配票模式選單文字與提示
function updateSplitModeUI() {
  const qtyEl = document.getElementById("qtySelect");
  const groupEl = document.getElementById("splitModeGroup");
  const splitSelect = document.getElementById("splitModeSelect");
  const hintEl = document.getElementById("splitModeHint");
  if (!qtyEl || !groupEl || !splitSelect) return;

  const qty = parseInt(qtyEl.value, 10) || 1;
  if (qty <= 1) {
    groupEl.style.display = "none";
    return;
  }

  groupEl.style.display = "block";

  const optSingle = splitSelect.querySelector('option[value="single"]');
  const optSplit = splitSelect.querySelector('option[value="split"]');
  if (optSingle) optSingle.textContent = t("opt_mode_single_tpl", { n: qty });
  if (optSplit) optSplit.textContent = t("opt_mode_split_tpl", { n: qty });

  if (hintEl) {
    hintEl.textContent = splitSelect.value === "split"
      ? t("hint_mode_split", { n: qty })
      : t("hint_mode_single", { n: qty });
  }
}

let currentConfig = null;
let currentTrains = [];
let selectedTrainNumbers = new Set();
let statusPollTimer = null;
let lastRenderedLog = "";

// PID演算法
const ROC_LETTER_MAP = {
  A: [1, 0], B: [1, 1], C: [1, 2], D: [1, 3], E: [1, 4],
  F: [1, 5], G: [1, 6], H: [1, 7], I: [3, 4], J: [1, 8],
  K: [1, 9], L: [2, 0], M: [2, 1], N: [2, 2], O: [3, 5],
  P: [2, 3], Q: [2, 4], R: [2, 5], S: [2, 6], T: [2, 7],
  U: [2, 8], V: [2, 9], W: [3, 2], X: [3, 0], Y: [3, 1],
  Z: [3, 3]
};

function validateROCId(rocId) {
  if (!rocId || rocId.length !== 10) return false;
  rocId = rocId.toUpperCase();
  const first = rocId[0];
  if (!ROC_LETTER_MAP[first]) return false;
  const gender = parseInt(rocId[1]);
  if (gender !== 1 && gender !== 2) return false;
  const digits = rocId.slice(1).split("").map(c => parseInt(c));
  if (digits.some(isNaN)) return false;

  const [d0, d1] = ROC_LETTER_MAP[first];
  let total = (d0 * 1) + (d1 * 9);
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  for (let i = 0; i < 8; i++) {
    total += digits[i] * weights[i];
  }
  const checkDigit = (10 - (total % 10)) % 10;
  return checkDigit === digits[8];
}

function generateROCId(prefLetter = null) {
  const letters = Object.keys(ROC_LETTER_MAP);
  const letter = (prefLetter && ROC_LETTER_MAP[prefLetter.toUpperCase()]) ? prefLetter.toUpperCase() : letters[Math.floor(Math.random() * letters.length)];
  const gender = Math.random() < 0.5 ? 1 : 2;
  const [d0, d1] = ROC_LETTER_MAP[letter];

  const mid = [];
  for (let i = 0; i < 7; i++) {
    mid.push(Math.floor(Math.random() * 10));
  }

  let total = (d0 * 1) + (d1 * 9) + (gender * 8);
  const weights = [7, 6, 5, 4, 3, 2, 1];
  for (let i = 0; i < 7; i++) {
    total += mid[i] * weights[i];
  }
  const checkDigit = (10 - (total % 10)) % 10;
  return `${letter}${gender}${mid.join("")}${checkDigit}`;
}

function updatePidValidationUI(pid) {
  const statusEl = document.getElementById("pidStatus");
  if (!statusEl) return;
  if (!pid) {
    statusEl.textContent = "";
    statusEl.className = "pid-status";
    return;
  }
  const isValid = validateROCId(pid);
  if (isValid) {
    statusEl.textContent = t("pid_valid");
    statusEl.className = "pid-status valid";
  } else if (pid.length === 10) {
    statusEl.textContent = t("pid_invalid");
    statusEl.className = "pid-status invalid";
  } else {
    statusEl.textContent = t("pid_digits_tpl", { n: pid.length });
    statusEl.className = "pid-status";
  }
}

function updateTrainSelectionSummary() {
  const summary = document.getElementById("selectedSummary");
  if (!summary) return;
  if (selectedTrainNumbers.size === 0) {
    summary.textContent = t("selected_all_trains");
  } else {
    summary.textContent = t("selected_locked_tpl", {
      n: selectedTrainNumbers.size,
      trains: Array.from(selectedTrainNumbers).join(", ")
    });
  }
}

// 音效播放 (使用瀏覽器 Web Audio API 合成慶祝提示音)
function playCelebrationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
    });
  } catch (e) {
    console.warn("音效播放受限:", e);
  }
}

// 產生半小時間隔選項
function generateTimeOptions(selectEl, selectedVal = "10:00") {
  selectEl.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    for (let m of ["00", "30"]) {
      const hh = h.toString().padStart(2, "0");
      const val = `${hh}:${m}`;
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      if (val === selectedVal) opt.selected = true;
      selectEl.appendChild(opt);
    }
  }
}

// 全域車站資料快取與 Combobox 實例
let allStationsList = [];
let stationByCode = {};
let stationByName = {};
let startCombobox = null;
let endCombobox = null;

// 關鍵字過濾車站 (支援繁簡台相容、站號與站名雙向模糊匹配)
function filterStations(query) {
  if (!query || !query.trim()) {
    return allStationsList;
  }
  const q = query.trim().toLowerCase();
  // 繁簡台相容替換
  const qVariants = [q];
  if (q.includes("台")) qVariants.push(q.replace(/台/g, "臺"));
  if (q.includes("臺")) qVariants.push(q.replace(/臺/g, "台"));

  return allStationsList.filter(st => {
    const codeLower = (st.code || "").toLowerCase();
    const nameLower = (st.name || "").toLowerCase();
    const labelLower = (st.label || "").toLowerCase();

    return qVariants.some(v =>
      codeLower.includes(v) || nameLower.includes(v) || labelLower.includes(v)
    );
  });
}

// 搜尋文字高亮標記 (在下拉選單中加粗標註匹配關鍵字)
function highlightMatch(text, query) {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.includes("台") ? escaped.replace(/台/g, "[台臺]")
    : escaped.includes("臺") ? escaped.replace(/臺/g, "[台臺]")
      : escaped;
  try {
    const regex = new RegExp(`(${pattern})`, "gi");
    return text.replace(regex, `<span class="highlight">$1</span>`);
  } catch (e) {
    return text;
  }
}

// 建立可輸入搜尋之 Combobox
function setupStationCombobox({
  groupId,
  inputId,
  hiddenId,
  dropdownId,
  toggleBtnId,
  initialCode = "1000"
}) {
  const groupEl = document.getElementById(groupId);
  const inputEl = document.getElementById(inputId);
  const hiddenEl = document.getElementById(hiddenId);
  const dropdownEl = document.getElementById(dropdownId);
  const toggleBtn = document.getElementById(toggleBtnId);

  let currentSelectedCode = initialCode;
  let activeIndex = -1;

  function setStation(code, triggerEvent = true) {
    const st = stationByCode[code] || stationByName[code];
    if (st) {
      currentSelectedCode = st.code;
      hiddenEl.value = st.code;
      inputEl.value = st.label; // 如 1000-臺北
    } else {
      currentSelectedCode = code;
      hiddenEl.value = code;
      inputEl.value = code;
    }
    closeDropdown();
    if (triggerEvent) {
      hiddenEl.dispatchEvent(new Event("change"));
    }
  }

  function openDropdown(filterQuery = "") {
    // 關閉其他可能開啟的 combobox
    document.querySelectorAll(".combobox-group.open").forEach(g => {
      if (g !== groupEl) {
        g.classList.remove("open");
        const d = g.querySelector(".combobox-dropdown");
        if (d) d.style.display = "none";
      }
    });

    const filtered = filterStations(filterQuery);
    renderDropdownItems(filtered, filterQuery);
    dropdownEl.style.display = "block";
    groupEl.classList.add("open");
    activeIndex = -1;
  }

  function closeDropdown() {
    dropdownEl.style.display = "none";
    groupEl.classList.remove("open");
    activeIndex = -1;
  }

  function renderDropdownItems(stations, query) {
    dropdownEl.innerHTML = "";
    if (!stations || stations.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "combobox-empty";
      emptyLi.textContent = t("station_not_found");
      dropdownEl.appendChild(emptyLi);
      return;
    }

    stations.forEach((st, idx) => {
      const li = document.createElement("li");
      li.className = `combobox-item ${st.code === currentSelectedCode ? "selected" : ""}`;
      li.dataset.code = st.code;
      li.dataset.idx = idx;

      // 格式化顯示，並對搜尋字詞高亮
      const highlightedCode = highlightMatch(st.code, query);
      const highlightedName = highlightMatch(st.name, query);

      li.innerHTML = `
        <span class="station-code">${highlightedCode}</span>
        <span class="station-name">${highlightedName}</span>
      `;

      li.addEventListener("mousedown", (e) => {
        e.preventDefault(); // 防止 input 失焦提早關閉
        setStation(st.code);
      });

      dropdownEl.appendChild(li);
    });
  }

  // 點擊 input 或 focus 時展開
  inputEl.addEventListener("focus", () => {
    if (inputEl.disabled) return;
    openDropdown(inputEl.value.includes("-") ? "" : inputEl.value);
  });

  inputEl.addEventListener("click", () => {
    if (inputEl.disabled) return;
    if (!groupEl.classList.contains("open")) {
      openDropdown(inputEl.value.includes("-") ? "" : inputEl.value);
    }
  });

  // 輸入文字時即時過濾
  inputEl.addEventListener("input", (e) => {
    if (inputEl.disabled) return;
    openDropdown(e.target.value);
  });

  // 點擊下拉箭頭按鈕切換展開/收合
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (inputEl.disabled || toggleBtn.disabled) return;
      if (groupEl.classList.contains("open")) {
        closeDropdown();
      } else {
        inputEl.focus();
        openDropdown("");
      }
    });
  }

  // 鍵盤上下鍵與 Enter 鍵導航
  inputEl.addEventListener("keydown", (e) => {
    const items = dropdownEl.querySelectorAll(".combobox-item");
    if (!groupEl.classList.contains("open")) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        openDropdown(inputEl.value.includes("-") ? "" : inputEl.value);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        const code = items[activeIndex].dataset.code;
        setStation(code);
      } else {
        tryMatchCurrentInput();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  function tryMatchCurrentInput() {
    const val = inputEl.value.trim();
    if (!val) {
      setStation(currentSelectedCode);
      return;
    }
    const filtered = filterStations(val);
    if (filtered.length > 0) {
      setStation(filtered[0].code);
    } else {
      setStation(currentSelectedCode);
    }
  }

  // 失焦檢查還原
  inputEl.addEventListener("blur", () => {
    setTimeout(() => {
      tryMatchCurrentInput();
      closeDropdown();
    }, 180);
  });

  return {
    setStation,
    getCode: () => currentSelectedCode,
    getLabel: () => inputEl.value
  };
}

// 初始化表單
async function initApp() {
  try {
    const res = await fetch("/api/config");
    currentConfig = await res.json();

    document.getElementById("pidInput").value = currentConfig.pid || "A153457990";

    // 設定乘車日期 (預設 2026-09-24)
    const rawDate = currentConfig.ride_date || "2026/09/24";
    document.getElementById("rideDateInput").value = rawDate.replace(/\//g, "-");

    // 建立車站快取字典
    allStationsList = (currentConfig.all_stations && currentConfig.all_stations.length > 0)
      ? currentConfig.all_stations
      : (currentConfig.common_stations || []);

    stationByCode = {};
    stationByName = {};
    allStationsList.forEach(st => {
      stationByCode[st.code] = st;
      stationByName[st.name] = st;
      // 繁簡相容對照
      if (st.name.includes("臺")) {
        stationByName[st.name.replace(/臺/g, "台")] = st;
      }
    });

    // 初始化出發站與抵達站 Combobox
    const startInitCode = currentConfig.start_station_code || currentConfig.start_station || "1000";
    const endInitCode = currentConfig.end_station_code || currentConfig.end_station || "1020";

    startCombobox = setupStationCombobox({
      groupId: "startComboboxGroup",
      inputId: "startStationInput",
      hiddenId: "startStationSelect",
      dropdownId: "startStationDropdown",
      toggleBtnId: "startStationToggleBtn",
      initialCode: startInitCode
    });
    startCombobox.setStation(startInitCode, false);

    endCombobox = setupStationCombobox({
      groupId: "endComboboxGroup",
      inputId: "endStationInput",
      hiddenId: "endStationSelect",
      dropdownId: "endStationDropdown",
      toggleBtnId: "endStationToggleBtn",
      initialCode: endInitCode
    });
    endCombobox.setStation(endInitCode, false);

    // 填充時間選單
    generateTimeOptions(document.getElementById("startTimeSelect"), currentConfig.start_time || "10:00");
    generateTimeOptions(document.getElementById("endTimeSelect"), currentConfig.end_time || "18:00");

    document.getElementById("qtySelect").value = currentConfig.ticket_qty || "1";
    if (currentConfig.split_mode) {
      document.getElementById("splitModeSelect").value = currentConfig.split_mode;
    }
    updateSplitModeUI();

    // 綁定事件
    setupEventListeners();

    // 檢查並自動還原正在運行的撿票任務與歷史狀態
    await restoreRunningSession();

  } catch (e) {
    console.error("載入設定失敗:", e);
    appendLog(t("log_conn_error", { err: e }), "error");
  }
}

// 自動偵測並還原背景進行中的任務與狀態
async function restoreRunningSession() {
  try {
    const res = await fetch("/api/status");
    const state = await res.json();
    if (!state) return;

    if (state.is_running) {
      isCurrentRunning = true;
      hasStopped = false;
      currentRoundCount = state.round_count || 0;
      appendLog(t("log_sync_running"), "system");

      // 1. 還原表單各欄位條件
      if (state.pid) {
        document.getElementById("pidInput").value = state.pid;
        updatePidValidationUI(state.pid);
      }
      if (state.ride_date) {
        document.getElementById("rideDateInput").value = state.ride_date.replace(/\//g, "-");
      }
      if (state.start_station && startCombobox) {
        startCombobox.setStation(state.start_station, false);
      }
      if (state.end_station && endCombobox) {
        endCombobox.setStation(state.end_station, false);
      }
      if (state.start_time) {
        document.getElementById("startTimeSelect").value = state.start_time;
      }
      if (state.end_time) {
        document.getElementById("endTimeSelect").value = state.end_time;
      }
      if (state.ticket_qty) {
        document.getElementById("qtySelect").value = state.ticket_qty;
      }
      if (state.split_mode) {
        document.getElementById("splitModeSelect").value = state.split_mode;
      }
      updateSplitModeUI();

      // 2. 還原車次清單與已鎖定勾選之車次卡片
      if (state.cached_trains && state.cached_trains.length > 0) {
        currentTrains = state.cached_trains;
        selectedTrainNumbers = new Set(state.target_trains || []);
        renderTrainsList(currentTrains);
      } else if (state.target_trains && state.target_trains.length > 0) {
        selectedTrainNumbers = new Set(state.target_trains);
        queryTrains();
      }

      // 3. 還原小黑框中的歷史執行日誌
      if (state.logs && state.logs.length > 0) {
        rawLogsList = [];
        state.logs.forEach(logText => {
          appendLog(logText);
        });
      }

      // 4. 切換按鈕為「停止監控」，點亮綠燈 Badge
      document.getElementById("startPollingBtn").style.display = "none";
      document.getElementById("stopPollingBtn").style.display = "inline-flex";
      document.getElementById("statusBadge").classList.add("active");
      document.getElementById("statusText").textContent = t("status_running");
      document.getElementById("roundBadge").textContent = t("round_badge_tpl", { n: currentRoundCount });

      // 5. 鎖定上方操作選單並自動啟動狀態輪詢監聽
      updateFormControlsLock(true);
      startStatusPolling();
    } else {
      updateFormControlsLock(false);
    }
  } catch (err) {
    console.warn("無法還原背景運行狀態:", err);
  }
}

function appendLog(msg, type = "normal") {
  rawLogsList.push({ raw: msg, type: type });
  const box = document.getElementById("terminalBox");
  if (!box) return;
  const div = document.createElement("div");
  div.className = `log-entry ${type}`;
  div.textContent = formatLogMessage(msg);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function renderAllTerminalLogs() {
  const box = document.getElementById("terminalBox");
  if (!box) return;
  box.innerHTML = "";
  if (rawLogsList.length === 0) {
    const div = document.createElement("div");
    div.className = "log-entry system";
    div.textContent = t("sys_ready_log");
    box.appendChild(div);
    return;
  }
  rawLogsList.forEach(item => {
    const div = document.createElement("div");
    div.className = `log-entry ${item.type}`;
    div.textContent = formatLogMessage(item.raw);
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

function setupEventListeners() {
  // 點擊全域關閉 Combobox 下拉面板
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".combobox-group")) {
      document.querySelectorAll(".combobox-group.open").forEach(g => {
        g.classList.remove("open");
        const d = g.querySelector(".combobox-dropdown");
        if (d) d.style.display = "none";
      });
    }
  });

  // 起訖站對調按鈕事件
  const swapBtn = document.getElementById("swapStationsBtn");
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      if (isCurrentRunning || swapBtn.disabled) return;
      if (!startCombobox || !endCombobox) return;
      const startCode = startCombobox.getCode();
      const endCode = endCombobox.getCode();
      startCombobox.setStation(endCode);
      endCombobox.setStation(startCode);
      appendLog(t("log_stations_swapped", {
        start: startCombobox.getLabel(),
        end: endCombobox.getLabel()
      }), "system");
    });
  }

  // 時間與張數選單點選後立即收合關閉 (blur 強制釋放焦點)
  ["startTimeSelect", "endTimeSelect", "qtySelect", "splitModeSelect"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", function () {
        this.blur();
      });
    }
  });

  // 張數與配票模式切換時動態更新選項與提示
  const qtySelEl = document.getElementById("qtySelect");
  if (qtySelEl) {
    qtySelEl.addEventListener("change", updateSplitModeUI);
  }
  const splitSelEl = document.getElementById("splitModeSelect");
  if (splitSelEl) {
    splitSelEl.addEventListener("change", updateSplitModeUI);
  }

  // 乘車日期點選文字任意處即觸發彈出原生日曆面板
  const rideDateInp = document.getElementById("rideDateInput");
  if (rideDateInp) {
    rideDateInp.addEventListener("click", () => {
      if (isCurrentRunning || rideDateInp.disabled) return;
      try {
        if (typeof rideDateInp.showPicker === "function") {
          rideDateInp.showPicker();
        }
      } catch (err) {
        // 部分環境不支援 showPicker 則保持原生行為
      }
    });
  }

  // PID輸入檢核與隨機產生
  const pidInp = document.getElementById("pidInput");
  pidInp.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase();
    updatePidValidationUI(e.target.value);
  });
  updatePidValidationUI(pidInp.value);

  document.getElementById("genPidBtn").addEventListener("click", () => {
    if (isCurrentRunning) return;
    const newId = generateROCId();
    pidInp.value = newId;
    updatePidValidationUI(newId);
    appendLog(t("log_pid_generated", { id: newId }), "system");
  });

  // 查詢車次按鈕
  document.getElementById("queryTrainsBtn").addEventListener("click", queryTrains);

  // 全選 / 取消全選
  document.getElementById("selectAllBtn").addEventListener("click", () => {
    if (isCurrentRunning) return;
    currentTrains.forEach(t => selectedTrainNumbers.add(t.train_no));
    updateTrainCardsUI();
  });

  document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (isCurrentRunning) return;
    selectedTrainNumbers.clear();
    updateTrainCardsUI();
  });

  // 開始監控
  document.getElementById("startPollingBtn").addEventListener("click", startPolling);

  // 停止監控
  document.getElementById("stopPollingBtn").addEventListener("click", stopPolling);

  // 關閉成功彈窗
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("successModal").style.display = "none";
  });

  // 歷史紀錄彈窗
  document.getElementById("viewHistoryBtn").addEventListener("click", showHistoryModal);
  document.getElementById("closeHistoryBtn").addEventListener("click", () => {
    document.getElementById("historyModal").style.display = "none";
  });

  // 點擊暗黑背景 overlay 關閉彈窗
  ["successModal", "historyModal"].forEach(mId => {
    const el = document.getElementById(mId);
    if (el) {
      el.addEventListener("click", (e) => {
        if (e.target === el) {
          el.style.display = "none";
        }
      });
    }
  });

  // 按 ESC 鍵關閉所有彈窗
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.getElementById("successModal").style.display = "none";
      document.getElementById("historyModal").style.display = "none";
    }
  });

  // 語言切換選單
  const langSel = document.getElementById("langSelect");
  if (langSel) {
    langSel.value = currentLang;
    langSel.addEventListener("change", (e) => {
      currentLang = e.target.value;
      localStorage.setItem("app_lang", currentLang);
      updateLanguageUI();
    });
  }
  updateLanguageUI();
}

// 查詢時段內所有車次
async function queryTrains() {
  if (isCurrentRunning) return;
  const btn = document.getElementById("queryTrainsBtn");
  btn.disabled = true;
  btn.textContent = t("btn_querying");

  const rawDate = document.getElementById("rideDateInput").value;
  const rideDate = rawDate.replace(/-/g, "/");
  const startStation = document.getElementById("startStationSelect").value;
  const endStation = document.getElementById("endStationSelect").value;
  const startStationLabel = startCombobox ? startCombobox.getLabel() : startStation;
  const endStationLabel = endCombobox ? endCombobox.getLabel() : endStation;
  const startTime = document.getElementById("startTimeSelect").value;
  const endTime = document.getElementById("endTimeSelect").value;

  appendLog(t("log_querying_trains_raw", {
    date: rideDate,
    start: startStationLabel,
    end: endStationLabel,
    times: `${startTime}~${endTime}`
  }), "system");

  try {
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ride_date: rideDate,
        start_station: startStation,
        end_station: endStation,
        start_time: startTime,
        end_time: endTime
      })
    });
    const data = await res.json();
    const rawList = data.trains || [];
    currentTrains = rawList.filter(tr => {
      const type = tr.train_type || "";
      const name = tr.raw_name || "";
      return !["區間", "復興"].some(ex => type.includes(ex) || name.includes(ex));
    });

    renderTrainsList(currentTrains);
    appendLog(t("log_query_success", { n: currentTrains.length }), "success");

  } catch (e) {
    console.error(e);
    appendLog(t("log_query_fail", { err: e }), "error");
  } finally {
    btn.disabled = isCurrentRunning ? true : false;
    btn.textContent = t("btn_query_trains");
  }
}

// 渲染車次卡片清單
function renderTrainsList(trains) {
  const container = document.getElementById("trainsContainer");
  const actions = document.getElementById("selectActions");
  const footer = document.getElementById("startActionFooter");

  if (!trains || trains.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>${t("trains_empty_state")}</p>
      </div>
    `;
    actions.style.display = "none";
    footer.style.display = "none";
    return;
  }

  container.innerHTML = "";
  actions.style.display = "flex";
  footer.style.display = "flex";

  // 若尚未選取過任何車次，預設選取偏好車次或全選；否則保留目前選取
  if (selectedTrainNumbers.size === 0) {
    const pref = currentConfig?.preferred_trains || ["442"];
    trains.forEach(t => {
      if (pref.includes(t.train_no)) {
        selectedTrainNumbers.add(t.train_no);
      }
    });
    if (selectedTrainNumbers.size === 0 && trains.length > 0) {
      trains.forEach(t => selectedTrainNumbers.add(t.train_no));
    }
  }

  const trainUnit = t("train_unit");
  const unitText = trainUnit ? ` ${trainUnit}` : "";

  const isLocked = isCurrentRunning;
  trains.forEach(t => {
    const card = document.createElement("div");
    card.className = `train-card ${selectedTrainNumbers.has(t.train_no) ? "selected" : ""} ${isLocked ? "disabled" : ""}`;
    card.dataset.trainNo = t.train_no;

    card.innerHTML = `
      <div class="train-left">
        <input type="checkbox" class="train-checkbox" ${selectedTrainNumbers.has(t.train_no) ? "checked" : ""} ${isLocked ? "disabled" : ""}>
        <span class="train-no-badge">${t.train_no}${unitText}</span>
        <span class="train-type-badge">${formatTrainType(t.train_type)}</span>
      </div>
      <div class="train-right">
        <span class="train-time">${t.start_time} ➔ ${t.end_time}</span>
        <span class="train-duration">(${formatDuration(t.duration)})</span>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (isCurrentRunning) return;
      if (e.target.tagName !== "INPUT") {
        const chk = card.querySelector(".train-checkbox");
        if (chk) chk.checked = !chk.checked;
      }
      toggleTrainSelection(t.train_no);
    });

    container.appendChild(card);
  });

  updateTrainCardsUI();
  if (isCurrentRunning) {
    updateFormControlsLock(true);
  }
}

function toggleTrainSelection(trainNo) {
  if (isCurrentRunning) return;
  if (selectedTrainNumbers.has(trainNo)) {
    selectedTrainNumbers.delete(trainNo);
  } else {
    selectedTrainNumbers.add(trainNo);
  }
  updateTrainCardsUI();
}

function updateTrainCardsUI() {
  document.querySelectorAll(".train-card").forEach(card => {
    const tNo = card.dataset.trainNo;
    const isSel = selectedTrainNumbers.has(tNo);
    card.classList.toggle("selected", isSel);
    const chk = card.querySelector(".train-checkbox");
    if (chk) chk.checked = isSel;
  });

  updateTrainSelectionSummary();
}

// 開始自動輪詢撿票
async function startPolling() {
  const pid = document.getElementById("pidInput").value.trim().toUpperCase();
  if (!pid) {
    showToast(t("alert_input_pid"), "warning");
    document.getElementById("pidInput").focus();
    return;
  }

  const rawDate = document.getElementById("rideDateInput").value;
  const rideDate = rawDate.replace(/-/g, "/");
  const startStation = document.getElementById("startStationSelect").value;
  const endStation = document.getElementById("endStationSelect").value;
  const startTime = document.getElementById("startTimeSelect").value;
  const endTime = document.getElementById("endTimeSelect").value;
  const qty = parseInt(document.getElementById("qtySelect").value);
  const splitModeEl = document.getElementById("splitModeSelect");
  const splitMode = (splitModeEl && qty > 1) ? splitModeEl.value : "single";
  const targetTrains = Array.from(selectedTrainNumbers);

  const payload = {
    pid: pid,
    ride_date: rideDate,
    start_station: startStation,
    end_station: endStation,
    start_time: startTime,
    end_time: endTime,
    target_trains: targetTrains,
    cached_trains: currentTrains,
    ticket_qty: qty,
    split_mode: splitMode
  };

  try {
    const res = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("successModal").style.display = "none";
      isCurrentRunning = true;
      hasStopped = false;
      updateFormControlsLock(true);
      document.getElementById("startPollingBtn").style.display = "none";
      document.getElementById("stopPollingBtn").style.display = "inline-flex";
      document.getElementById("statusBadge").classList.add("active");
      document.getElementById("statusText").textContent = t("status_running");

      startStatusPolling();
    } else {
      const errMsg = (data.msg && (data.msg.includes("運行中") || data.msg.includes("running")))
        ? t("alert_already_running")
        : t("op_failed", { msg: data.msg || data.detail || "Start failed" });
      showToast(errMsg, "error");
      appendLog(`[ERROR] ${errMsg}`, "error");
    }
  } catch (e) {
    const errMsg = t("alert_start_failed", { err: e.message || e });
    showToast(errMsg, "error");
    appendLog(`[ERROR] ${errMsg}`, "error");
    console.error("Failed to start polling:", e);
  }
}

// 停止輪詢
async function stopPolling() {
  try {
    await fetch("/api/stop", { method: "POST" });
    isCurrentRunning = false;
    hasStopped = true;
    stopStatusPolling();
    updateFormControlsLock(false);
    document.getElementById("startPollingBtn").style.display = "inline-flex";
    document.getElementById("stopPollingBtn").style.display = "none";
    document.getElementById("statusBadge").classList.remove("active");
    document.getElementById("statusText").textContent = t("status_stopped");
    appendLog(t("log_monitor_stopped"), "system");
  } catch (e) {
    console.error(e);
  }
}

function startStatusPolling() {
  lastRenderedLog = "";
  if (statusPollTimer) clearInterval(statusPollTimer);
  statusPollTimer = setInterval(async () => {
    try {
      const res = await fetch("/api/status");
      const state = await res.json();

      currentRoundCount = state.round_count || 0;
      const roundBadge = document.getElementById("roundBadge");
      if (roundBadge) {
        roundBadge.textContent = t("round_badge_tpl", { n: currentRoundCount });
      }

      const statusText = document.getElementById("statusText");
      if (state.is_running) {
        isCurrentRunning = true;
        hasStopped = false;
        if (state.countdown > 0) {
          statusText.textContent = t("status_waiting_countdown", { s: state.countdown });
        } else {
          statusText.textContent = t("status_checking_seats");
        }
      }

      // 僅在日誌文字有更新時才追加，杜絕重複印出
      if (state.last_log && state.last_log !== lastRenderedLog) {
        lastRenderedLog = state.last_log;
        appendLog(state.last_log);
      }

      // 判斷是否停止
      if (!state.is_running) {
        isCurrentRunning = false;
        updateFormControlsLock(false);
        const bookedList = (state.booked_tickets && state.booked_tickets.length > 0)
          ? state.booked_tickets
          : (state.ticket_result && state.ticket_result.success ? [state.ticket_result] : []);

        if (bookedList.length > 0) {
          stopStatusPolling();
          document.getElementById("startPollingBtn").style.display = "inline-flex";
          document.getElementById("stopPollingBtn").style.display = "none";
          document.getElementById("statusBadge").classList.remove("active");
          document.getElementById("statusText").textContent = t("status_completed_tpl", { n: bookedList.length });

          playCelebrationSound();
          showSuccessModal(bookedList);
        } else {
          // 手動停止或未有成功車票
          hasStopped = true;
          document.getElementById("startPollingBtn").style.display = "inline-flex";
          document.getElementById("stopPollingBtn").style.display = "none";
          document.getElementById("statusBadge").classList.remove("active");
          document.getElementById("statusText").textContent = t("status_stopped");
        }
      } else {
        if (!isCurrentRunning) {
          isCurrentRunning = true;
          updateFormControlsLock(true);
        }
        // 仍處於輪詢運行中：檢查是否有部分已訂到的車次或張數
        const bookedCount = (state.booked_tickets || []).length;
        if (state.split_mode === "split" && state.ticket_qty > 1) {
          if (bookedCount > 0 && bookedCount < state.ticket_qty) {
            statusText.textContent = t("status_partial_split_tpl", {
              booked: bookedCount,
              total: state.ticket_qty,
              rem: state.ticket_qty - bookedCount,
              next: bookedCount + 1
            });
          }
        } else {
          const totalCount = (state.total_target_trains || []).length;
          if (bookedCount > 0 && totalCount > 0) {
            const remCount = (state.target_trains || []).length;
            statusText.textContent = t("status_partial_tpl", {
              booked: bookedCount,
              total: totalCount,
              rem: remCount
            });
          }
        }
      }
    } catch (e) {
      console.warn("Status sync delay:", e);
    }
  }, 1000);
}

function stopStatusPolling() {
  if (statusPollTimer) {
    clearInterval(statusPollTimer);
    statusPollTimer = null;
  }
  lastRenderedLog = "";
}

// 顯示成功彈窗 (支援單張或多張車票列表)
function showSuccessModal(ticketsData) {
  const list = Array.isArray(ticketsData) ? ticketsData : [ticketsData];
  const body = document.getElementById("modalTicketBody");
  if (!list || list.length === 0) return;

  body.innerHTML = `
    <div style="max-height: 420px; overflow-y: auto; padding-right: 4px;">
      ${list.map((ticket, idx) => `
        <div class="ticket-details-box" style="margin-bottom: 12px; border-left: 4px solid #10b981;">
          <div style="font-weight: bold; color: #10b981; margin-bottom: 6px; font-size: 14px;">
            ${t("modal_ticket_header", { n: idx + 1, type: formatTrainType(ticket.train_type), no: ticket.train_no || '' })}
          </div>
          <div class="detail-row">
            <span class="detail-label">${t("code_label")}</span>
            <span class="detail-val code">${ticket.booking_code}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t("pid_label")}</span>
            <span class="detail-val">${ticket.pid}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t("seat_label")}</span>
            <span class="detail-val seat">${formatSeat(ticket.seat)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t("trip_label")}</span>
            <span class="detail-val">${formatTripInfo(ticket.trip_info)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t("deadline_label")}</span>
            <span class="detail-val" style="color:#ef4444">${formatPayDeadline(ticket.pay_deadline)}</span>
          </div>
        </div>
      `).join("")}
    </div>
    <p style="font-size:12px; color:#9ca3af; text-align:center; margin-top: 10px;">
      ${t("modal_saved_hint")}
    </p>
  `;
  document.getElementById("successModal").style.display = "flex";
}

// 輔助函式：從車票資訊中解析出乘車日期 (如 "09/26", "10/15")
function extractTicketDate(tObj) {
  if (!tObj) return t("other_date");
  if (tObj.ride_date) {
    const parts = tObj.ride_date.split(/[-/]/);
    if (parts.length === 3) {
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${m}/${d}`;
    }
    return tObj.ride_date;
  }
  if (tObj.trip_info) {
    const m = tObj.trip_info.match(/(\d{1,2})\/(\d{1,2})/);
    if (m) {
      return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}`;
    }
  }
  if (tObj.created_at) {
    const parts = tObj.created_at.split(" ")[0].split(/[-/]/);
    if (parts.length === 3) {
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${m}/${d}`;
    }
    return parts[0];
  }
  return t("other_date");
}

let allHistoryTickets = [];
let currentHistoryFilterDate = "ALL";

// 歷史紀錄彈窗
async function showHistoryModal() {
  const container = document.getElementById("historyListContainer");
  const filterBar = document.getElementById("historyFilterBar");
  container.innerHTML = `<p style='color:#9ca3af;text-align:center;padding:30px;'>${t("loading_history")}</p>`;
  if (filterBar) filterBar.style.display = "none";
  document.getElementById("historyModal").style.display = "flex";

  try {
    const res = await fetch("/api/tickets");
    allHistoryTickets = await res.json();

    if (!allHistoryTickets || allHistoryTickets.length === 0) {
      container.innerHTML = `<p style='color:#9ca3af;text-align:center;padding:30px;'>${t("history_empty")}</p>`;
      if (filterBar) filterBar.style.display = "none";
      return;
    }

    currentHistoryFilterDate = "ALL";
    renderHistoryFilterBar();
    renderFilteredHistoryList();

  } catch (e) {
    container.innerHTML = `<p style='color:#ef4444;text-align:center;padding:30px;'>${t("history_load_failed", { err: e })}</p>`;
  }
}

// 渲染歷史車票的日期篩選標籤列
function renderHistoryFilterBar() {
  const filterBar = document.getElementById("historyFilterBar");
  const tagsContainer = document.getElementById("historyFilterTags");
  if (!filterBar || !tagsContainer) return;

  filterBar.style.display = "flex";
  tagsContainer.innerHTML = "";

  // 統計所有出現過的日期與各自的票數
  const dateCounts = {};
  allHistoryTickets.forEach(ticket => {
    const d = extractTicketDate(ticket);
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  });

  // 日期由新到舊排序
  const sortedDates = Object.keys(dateCounts).sort().reverse();

  // 1. 全部按鈕
  const allPill = document.createElement("button");
  allPill.className = `history-date-pill ${currentHistoryFilterDate === "ALL" ? "active" : ""}`;
  allPill.innerHTML = `${t("pill_all")} <span class="pill-count">${allHistoryTickets.length}</span>`;
  allPill.addEventListener("click", () => {
    currentHistoryFilterDate = "ALL";
    updateHistoryFilterUI();
    renderFilteredHistoryList();
  });
  tagsContainer.appendChild(allPill);

  // 2. 各日期按鈕
  sortedDates.forEach(d => {
    const pill = document.createElement("button");
    pill.className = `history-date-pill ${currentHistoryFilterDate === d ? "active" : ""}`;
    pill.dataset.date = d;
    pill.innerHTML = `📅 ${d} <span class="pill-count">${dateCounts[d]}</span>`;
    pill.addEventListener("click", () => {
      currentHistoryFilterDate = d;
      updateHistoryFilterUI();
      renderFilteredHistoryList();
    });
    tagsContainer.appendChild(pill);
  });
}

function updateHistoryFilterUI() {
  document.querySelectorAll(".history-date-pill").forEach(p => {
    if (p.dataset.date === currentHistoryFilterDate || (currentHistoryFilterDate === "ALL" && !p.dataset.date)) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });
}

// 輔助函式：判斷歷史車票是否已過繳費期限 (24:00 換算隔日 00:00)
function isTicketDeadlineExpired(deadlineStr, createdAt) {
  if (!deadlineStr) return false;
  try {
    let year = new Date().getFullYear();
    if (createdAt) {
      const ym = createdAt.match(/(\d{4})/);
      if (ym) year = parseInt(ym[1], 10);
    }

    const m = deadlineStr.match(/(\d{1,2})[/-](\d{1,2}).*?(\d{1,2}):(\d{2})/);
    if (m) {
      const month = parseInt(m[1], 10) - 1;
      const day = parseInt(m[2], 10);
      const hour = parseInt(m[3], 10);
      const minute = parseInt(m[4], 10);

      const d = new Date(year, month, day, 0, minute);
      if (hour === 24) {
        d.setDate(d.getDate() + 1);
      } else {
        d.setHours(hour);
      }
      return new Date() > d;
    }
  } catch (e) {
    console.error("Failed to parse deadline expiry:", e);
  }
  return false;
}

// 點擊取消訂票或刪除紀錄處理常式
window.handleCancelTicket = async function (bookingCode, pid, isExpired, btnEl) {
  const confirmMsg = isExpired
    ? t("confirm_delete_expired", { code: bookingCode })
    : t("confirm_cancel_online", { code: bookingCode });

  if (!confirm(confirmMsg)) return;

  const originalHtml = btnEl.innerHTML;
  btnEl.disabled = true;
  btnEl.innerHTML = `<span>${t("op_processing")}</span>`;

  try {
    const res = await fetch("/api/cancel_ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_code: bookingCode, pid: pid })
    });
    const data = await res.json();
    if (data.success) {
      const successMsg = (isExpired || data.is_expired)
        ? t("alert_delete_expired_success", { code: bookingCode })
        : t("alert_cancel_online_success", { code: bookingCode });
      showToast(successMsg, "success");
      appendLog(`[SUCCESS] ${successMsg}`, "success");
      await showHistoryModal();
    } else {
      let rawMsg = data.msg || data.message || data.detail || "";
      let alertMsg;
      if (rawMsg.includes("未找到") || rawMsg.includes("not found")) {
        alertMsg = t("alert_ticket_not_found");
      } else {
        alertMsg = t("alert_cancel_online_failed", { reason: rawMsg || "Error" });
      }
      showToast(alertMsg, "error");
      appendLog(`[ERROR] ${alertMsg}`, "error");
      console.error("Cancel ticket failed:", data);
      btnEl.disabled = false;
      btnEl.innerHTML = originalHtml;
    }
  } catch (e) {
    const netErr = t("network_error", { err: e.message || e });
    showToast(netErr, "error");
    appendLog(`[ERROR] ${netErr}`, "error");
    console.error("Network error cancelling ticket:", e);
    btnEl.disabled = false;
    btnEl.innerHTML = originalHtml;
  }
};

// 渲染篩選後的車票卡片清單
function renderFilteredHistoryList() {
  const container = document.getElementById("historyListContainer");
  const summary = document.getElementById("historyFilteredSummary");

  const filtered = currentHistoryFilterDate === "ALL"
    ? allHistoryTickets
    : allHistoryTickets.filter(ticket => extractTicketDate(ticket) === currentHistoryFilterDate);

  if (summary) {
    summary.textContent = t("filter_summary_tpl", { n: filtered.length, total: allHistoryTickets.length });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:36px; color:#9ca3af;">
        <div style="font-size:32px; margin-bottom:8px;">🔍</div>
        <p>${t("history_filter_empty", { date: currentHistoryFilterDate })}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item, idx) => {
    const ticketDate = extractTicketDate(item);
    const isExpired = isTicketDeadlineExpired(item.pay_deadline, item.created_at);
    return `
      <div class="ticket-details-box" style="margin-bottom:14px; border-left:4px solid ${isExpired ? '#94a3b8' : '#06b6d4'};">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="background:${isExpired ? 'rgba(148,163,184,0.15)' : 'rgba(6,182,212,0.15)'}; color:${isExpired ? '#94a3b8' : '#38bdf8'}; padding:3px 8px; border-radius:6px; font-size:12px; font-weight:bold;">
            📅 ${t("ride_day_label")}: ${ticketDate}
          </span>
          <span style="font-size:12px; color:#9ca3af;">${t("recorded_at")}: ${item.created_at || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t("code_label")}</span>
          <span class="detail-val code">${item.booking_code}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t("pid_label")}</span>
          <span class="detail-val">${item.pid}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t("train_label")}</span>
          <span class="detail-val">${formatTrainType(item.train_type)} ${item.train_no || ''}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t("seat_label")}</span>
          <span class="detail-val seat">${formatSeat(item.seat)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t("trip_label")}</span>
          <span class="detail-val">${formatTripInfo(item.trip_info)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t("deadline_label")}</span>
          <span class="detail-val" style="color:${isExpired ? '#94a3b8' : '#ef4444'}; font-weight:600;">${formatPayDeadline(item.pay_deadline)}</span>
        </div>
        <div class="ticket-card-actions">
          <span class="ticket-status-badge ${isExpired ? 'expired' : 'active'}">
            ${isExpired ? t("badge_expired") : t("badge_active")}
          </span>
          <button 
            class="btn-cancel-ticket ${isExpired ? 'expired' : 'can-cancel'}" 
            onclick="handleCancelTicket('${item.booking_code}', '${item.pid}', ${isExpired}, this)"
          >
            ${isExpired ? t("btn_delete_expired") : t("btn_cancel_online")}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// 頁面就緒
window.addEventListener("DOMContentLoaded", initApp);

