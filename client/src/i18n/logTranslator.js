// client/src/i18n/logTranslator.js
/**
 * 監控終端日誌的多國語言動態轉換器
 * 依據原始後端發出的 Log 格式進行正規化匹配並代入對應語言字典
 */

export function formatBatch(batchStr, t) {
  if (!batchStr || typeof batchStr !== "string") return batchStr;
  const m = batchStr.match(/批次\s*(\d+)\/(\d+)(?:\s*\((.*?)\))?/) ||
            batchStr.match(/Batch\s*(\d+)\/(\d+)(?:\s*\((.*?)\))?/);
  if (m) {
    if (m[3]) {
      return t("log_batch_tpl", { curr: m[1], total: m[2], trains: m[3] });
    }
    return t("log_batch_simple_tpl", { curr: m[1], total: m[2] });
  }
  return batchStr;
}

export function translateFeedbackMsg(msg, t) {
  if (!msg || typeof msg !== "string" || typeof t !== "function") return msg;
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

export function formatLogMessage(raw, t) {
  if (!raw || typeof raw !== "string" || typeof t !== "function") return raw;

  // 1. 系統常規狀態日誌
  if (
    raw.includes("票務撿票引擎就緒") ||
    raw.includes("Booking engine ready") ||
    raw.includes("予約エンジン準備完了") ||
    raw.includes("예매 엔진") ||
    raw.includes("撿票引擎就緒")
  ) {
    return t("sys_ready_log");
  }

  // 準備啟動撿票監控 (含起訖站)
  let m = raw.match(/準備啟動撿票監控\s*\(PID:\s*([A-Z0-9]+),\s*(.+?)\s*➔\s*(.+?)\)\.\.\./) ||
          raw.match(/Preparing to start.*?\s*\(PID:\s*([A-Z0-9]+),\s*(.+?)\s*➔\s*(.+?)\)\.\.\./);
  if (m) {
    return t("log_prepare_start_with_stations_tpl", {
      pid: m[1],
      start: m[2],
      end: m[3],
    });
  }

  if (
    raw.includes("準備啟動撿票監控") ||
    raw.includes("Preparing to start seat monitoring") ||
    raw.includes("空席監視の開始準備中") ||
    raw.includes("예매 모니터링 준비 중")
  ) {
    return t("log_prepare_start");
  }

  if (
    raw.includes("已收到停止指示，正在釋放背景程序") ||
    raw.includes("Stop signal received, releasing background processes") ||
    raw.includes("停止指示を受信しました") ||
    raw.includes("중지 명령을 수신했습니다")
  ) {
    return t("log_stop_signal_received");
  }

  if (
    raw.includes("正在啟動背景常駐 Chrome") ||
    raw.includes("Starting background persistent Chrome") ||
    raw.includes("バックグラウンド常駐 Chrome") ||
    raw.includes("Chrome 브라우저 실행")
  ) {
    return t("log_starting_chrome");
  }

  if (
    raw.includes("瀏覽器已就緒") ||
    raw.includes("Browser ready") ||
    raw.includes("ブラウザ準備完了") ||
    raw.includes("브라우저 준비 완료")
  ) {
    return t("log_chrome_ready");
  }

  if (
    raw.includes("偵測到背景撿票監控正在運行中") ||
    raw.includes("Background monitoring session detected")
  ) {
    return t("log_sync_running");
  }

  if (
    raw.includes("已停止自動撿票監控") ||
    raw.includes("Auto-monitoring stopped") ||
    raw.includes("自動監視を停止しました") ||
    raw.includes("자동 모니터링이 중지되었습니다")
  ) {
    return t("log_monitor_stopped");
  }

  if (
    raw.includes("恭喜！已成功訂得車票！任務結束") ||
    raw.includes("Ticket successfully booked! Task finished")
  ) {
    return t("log_success_generic");
  }

  // 2. 隨機生成 PID
  m = raw.match(/已隨機生成合規PID號:\s*([A-Z0-9]+)/i) ||
      raw.match(/Random valid ID generated:\s*([A-Z0-9]+)/i);
  if (m) return t("log_pid_generated", { id: m[1] });

  // 3. 起訖站對調
  m = raw.match(/起訖站已對調:\s*(.+?)\s*➔\s*(.+)/) ||
      raw.match(/Stations swapped:\s*(.+?)\s*➔\s*(.+)/);
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

  m = raw.match(/目標車次共\s*(\d+)\s*班:\s*(.+?)\s*\(需全部訂到才結束(?:，每筆\s*\d+\s*張)?\)/) ||
      raw.match(/Target:\s*(\d+)\s*train\(s\):\s*(.+?)\s*\(Will finish/);
  if (m) return t("log_target_trains_tpl", { count: m[1], trains: m[2] });

  m = raw.match(/目標時段:\s*(.+?)\s*\(依時段單程訂票(?:，每筆\s*(\d+)\s*張)?\)/) ||
      raw.match(/Target time:\s*(.+?)\s*\(Book by/);
  if (m) return t("log_target_time_tpl", { range: m[1] });

  // 6. 檢查座位 (拆單模式)
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查座位\s*\(已訂\s*(\d+)\/(\d+)\s*張.*?\)\.\.\./);
  if (m) return t("log_check_round_split_tpl", { time: m[1], round: m[2], curr: m[3], total: m[4] });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查時段\s*(.+?)\s*座位\s*\(已訂\s*(\d+)\/(\d+)\s*張\)\.\.\./);
  if (m) return t("log_check_round_time_split_tpl", { time: m[1], round: m[2], range: m[3], curr: m[4], total: m[5] });

  // 7. 檢查座位 (一般模式)
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查座位\s*\((\d+)\/(\d+)\s*班待訂:\s*(.*?)\)\.\.\./) ||
      raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*Check #(\d+)\s*\((\d+)\/(\d+)\s*pending:\s*(.*?)\)\.\.\./);
  if (m) return t("log_check_round_tpl", { time: m[1], round: m[2], rem: m[3], total: m[4], trains: m[5] });

  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*第\s*(\d+)\s*次檢查時段\s*(.+?)\s*座位狀態中\.\.\./) ||
      raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*Check #(\d+)\s*for time slot\s*(.+?)\.\.\./);
  if (m) return t("log_check_round_time_tpl", { time: m[1], round: m[2], range: m[3] });

  // 8. 無剩餘座位
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?目前無剩餘座位(?:\s*\(OCR:\s*(.*?)\))?(?:，等待下次.*)?/) ||
      raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?No seats available currently(?:\s*\(OCR:\s*(.*?)\))?/);
  if (m) {
    const formattedBatch = m[2] ? `[${formatBatch(m[2], t)}] ` : "";
    return t("log_no_seats_tpl", {
      time: m[1],
      batch: formattedBatch,
      ocr: m[3] ? ` (OCR: ${m[3]})` : "",
    });
  }

  // 9. 驗證碼微誤
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?驗證碼微誤(?:\s*\(OCR:\s*(.*?)\))?，(?:換圖再試|等待後重新整理再試\.\.\.)/) ||
      raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(?:\[(.*?)\]\s*)?Captcha mismatch(?:\s*\(OCR:\s*(.*?)\))?/);
  if (m) {
    const formattedBatch = m[2] ? `[${formatBatch(m[2], t)}] ` : "";
    return t("log_captcha_retry_tpl", {
      time: m[1],
      batch: formattedBatch,
      ocr: m[3] ? ` (OCR: ${m[3]})` : "",
    });
  }

  // 10. 查詢車次日誌
  m = raw.match(/正在查詢\s*(\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*(.+?)\s*➔\s*(.+?)\s*\((.+?)\)\s*列車班次\.\.\./) ||
      raw.match(/Searching trains for\s*(\d{4}[/-]\d{1,2}[/-]\d{1,2})\s*(.+?)\s*➔\s*(.+?)\s*\((.+?)\)\.\.\./);
  if (m) return t("log_querying_trains_raw", { date: m[1], start: m[2], end: m[3], times: m[4] });

  m = raw.match(/成功查得\s*(\d+)\s*班列車資訊！請勾選欲追蹤的車次。/) ||
      raw.match(/Found\s*(\d+)\s*train\(s\)!/);
  if (m) return t("log_query_success", { n: m[1] });

  // 11. 訂票成功
  m = raw.match(/🎉\s*撿票成功！車次\s*([^|\n\r]*?)\s*\|\s*訂票代碼：([^\(\n\r]*?)\s*\(進度:\s*(\d+)\/(\d+)\s*張\)/);
  if (m) return t("log_ticket_success_split_tpl", { train: m[1].trim(), code: m[2].trim(), curr: m[3], total: m[4] });

  m = raw.match(/🎉\s*撿票成功！車次\s*([^|\n\r]*?)\s*\|\s*訂票代碼：([^\(\n\r]*?)\s*\(進度:\s*(\d+)\/(\d+)\s*班\)/) ||
      raw.match(/🎉\s*Booking Success!\s*Train\s*([^|\n\r]*?)\s*\|\s*Code:\s*([^\(\n\r]*?)\s*\(Progress:\s*(\d+)\/(\d+)\)/);
  if (m) return t("log_ticket_success_tpl", { train: m[1].trim(), code: m[2].trim(), curr: m[3], total: m[4] });

  m = raw.match(/🎉\s*撿票成功！訂票電腦代碼：([^\(\n\r]*)/) ||
      raw.match(/🎉\s*Booking Success!\s*Booking Code:\s*([^\(\n\r]*)/);
  if (m) return t("log_ticket_success_single_tpl", { code: m[1].trim() });

  // 12. 全部訂票完成
  m = raw.match(/🎊\s*(?:太棒了！)?已成功訂妥全部\s*(\d+)\s*張車票(?:（共\s*(\d+)\s*筆訂單）)?！任務完成。/);
  if (m) return t("log_all_completed_split_tpl", { n: m[1], orders: m[2] || m[1] });

  m = raw.match(/🎊\s*所有選定之\s*(\d+)\s*班目標車次已全數訂妥！/);
  if (m) return t("log_all_targets_completed_tpl", { n: m[1] });

  m = raw.match(/🎊\s*(?:太棒了！)?所選之\s*(\d+)\s*班車次(?:均已全數訂滿\s*(\d+)\s*張|已全部訂妥)！任務完成。/) ||
      raw.match(/🎊\s*Awesome!\s*All\s*(\d+)\s*selected/);
  if (m) return t("log_all_completed_tpl", { n: m[1] });

  // 13. 剩餘車次 / 張數進度
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
    const formattedBatch = m[2] ? `[${formatBatch(m[2], t)}] ` : "";
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
    const formattedBatch = m[2] ? `[${formatBatch(m[2], t)}] ` : "";
    return t("log_booking_feedback_tpl", {
      time: m[1],
      batch: formattedBatch,
      msg: translateFeedbackMsg(m[3], t),
      ocr: m[4] ? ` (OCR: ${m[4]})` : "",
    });
  }

  // 17. 查詢完畢等待下次查詢
  m = raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(.+?)，等待下次查詢\.\.\./) ||
      raw.match(/\[(\d{2}:\d{2}:\d{2})\]\s*(.+?),\s*waiting for next check\.\.\./);
  if (m) {
    return t("log_query_finished_wait_tpl", {
      time: m[1],
      msg: translateFeedbackMsg(m[2], t),
    });
  }

  // 18. 發生異常
  m = raw.match(/發生異常:\s*(.+)/);
  if (m) return t("log_error_tpl", { e: m[1] });

  return raw;
}

/**
 * 退票原因的多國語言轉換器
 * 依據後端回傳的 reason_code 或原始訊息轉換為對應語言
 */
export function translateCancelReason(reasonCode, rawMessage, t) {
  if (typeof t !== "function") return rawMessage || "";

  if (reasonCode === "NOT_FOUND") return t("cancel_reason_not_found");
  if (reasonCode === "ALREADY_CANCELLED") return t("cancel_reason_already_cancelled");
  if (reasonCode === "NO_CANCEL_BTN") return t("cancel_reason_no_btn");
  if (reasonCode === "CONFIRM_BTN_NOT_FOUND") return t("cancel_reason_confirm_fail");
  if (reasonCode === "UNRECOGNIZED_COMPLETE") return t("cancel_reason_unrecognized");
  if (reasonCode === "DELETE_LOCAL_FAILED") return t("cancel_reason_delete_local_fail");
  if (reasonCode === "RECORD_NOT_FOUND") return t("cancel_reason_record_not_found");
  if (reasonCode === "MISSING_CODE") return t("cancel_reason_missing_code");
  if (reasonCode === "CAPTCHA_FAIL") return t("cancel_reason_captcha_fail");
  if (reasonCode === "EXCEPTION") return t("cancel_reason_exception");

  // 若無 code 則根據常見繁體文字匹配
  const raw = String(rawMessage || "");
  if (raw.includes("查無此訂票紀錄") || raw.includes("查無訂票紀錄")) return t("cancel_reason_not_found");
  if (raw.includes("已處於已取消狀態") || raw.includes("訂單已取消") || raw.includes("已取消")) return t("cancel_reason_already_cancelled");
  if (raw.includes("查無取消訂票按鈕")) return t("cancel_reason_no_btn");
  if (raw.includes("未能定位到取消確認視窗")) return t("cancel_reason_confirm_fail");
  if (raw.includes("未識別到取消成功標記")) return t("cancel_reason_unrecognized");
  if (raw.includes("刪除本機紀錄失敗")) return t("cancel_reason_delete_local_fail");
  if (raw.includes("未找到訂票代碼")) return t("cancel_reason_record_not_found");
  if (raw.includes("未指定訂票代碼")) return t("cancel_reason_missing_code");
  if (raw.includes("驗證碼")) return t("cancel_reason_captcha_fail");
  if (raw.includes("異常") || raw.includes("Exception")) return t("cancel_reason_exception");

  return raw || t("cancel_reason_unknown");
}

