// client/src/components/HistoryModal.jsx
import React, { useState, useMemo } from "react";
import { X, Calendar, Ticket, Trash2, Clock, Copy, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { useI18n } from "../context/I18nContext";

// 輔助函式：從車票物件中精準解析乘車日期 (如 "09/26", "09/25")
export function extractTicketDate(tk) {
  if (!tk) return "其他";
  if (tk.ride_date) {
    const parts = tk.ride_date.split("-");
    if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
    return tk.ride_date;
  }
  if (tk.trip_info) {
    const m = tk.trip_info.match(/(\d{1,2}\/\d{1,2})/);
    if (m) return m[1];
  }
  if (tk.created_at) {
    const parts = tk.created_at.split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
    return parts[0];
  }
  return "其他";
}

// 輔助函式：判斷是否已過繳費期限 (支援台鐵 24:00 隔日機制)
export function isTicketDeadlineExpired(deadlineStr, createdAt) {
  if (!deadlineStr || typeof deadlineStr !== "string") return false;
  try {
    let year = new Date().getFullYear();
    if (createdAt) {
      const ym = createdAt.match(/(\d{4})/);
      if (ym) year = parseInt(ym[1], 10);
    }

    // 匹配 "09/23 (Wed) 24:00" 或 "09-23 24:00"
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
      return Date.now() > d.getTime();
    }

    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) return Date.now() > d.getTime();
  } catch (e) {
    console.error("Failed to parse deadline expiry:", e);
  }
  return false;
}

export default function HistoryModal({
  isOpen,
  onClose,
  tickets = [],
  onCancelTicket,
}) {
  const { t } = useI18n();
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [confirmingCode, setConfirmingCode] = useState(null);
  const [cancellingCode, setCancellingCode] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // 整理所有乘車日期膠囊
  const dateGroups = useMemo(() => {
    const counts = {};
    tickets.forEach((tk) => {
      const d = extractTicketDate(tk);
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  // 日期排序：由新到舊
  const sortedDates = useMemo(() => {
    return Object.keys(dateGroups).sort().reverse();
  }, [dateGroups]);

  // 過濾後的車票清單
  const filteredTickets = useMemo(() => {
    if (selectedDateFilter === "all") return tickets;
    return tickets.filter((tk) => extractTicketDate(tk) === selectedDateFilter);
  }, [tickets, selectedDateFilter]);

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleConfirmCancel = async (ticket) => {
    const deadline = ticket.pay_deadline || ticket.payment_deadline;
    const expired = isTicketDeadlineExpired(deadline, ticket.created_at);
    setCancellingCode(ticket.booking_code);
    try {
      await onCancelTicket(ticket.booking_code, ticket.pid, expired);
    } finally {
      setCancellingCode(null);
      setConfirmingCode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal 頂部標題 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Ticket className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-base font-bold text-white tracking-wide truncate">
              {t("modal_history_title")}
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shrink-0">
              {t("records_count_tpl", { n: tickets.length })}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 日期過濾標籤列 (手機端僅允許水平左右滑動，禁止垂直上下滑動) */}
        {sortedDates.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-2 overflow-x-auto overflow-y-hidden touch-pan-x flex-nowrap shrink-0 scrollbar-none overscroll-x-contain overscroll-y-none">
            <button
              type="button"
              onClick={() => setSelectedDateFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                selectedDateFilter === "all"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {t("pill_all")} ({tickets.length})
            </button>
            {sortedDates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDateFilter(date)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  selectedDateFilter === date
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <span>📅 {date}</span>
                <span className="opacity-80">({dateGroups[date]})</span>
              </button>
            ))}
          </div>
        )}

        {/* 車票卡片清單列表 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2">
              <Ticket className="w-10 h-10 text-slate-600 stroke-1" />
              <span>{t("history_empty")}</span>
            </div>
          ) : (
            filteredTickets.map((tk) => {
              const deadline = tk.pay_deadline || tk.payment_deadline || "";
              const expired = isTicketDeadlineExpired(deadline, tk.created_at);
              const isConfirming = confirmingCode === tk.booking_code;
              const isProcessing = cancellingCode === tk.booking_code;
              const rideDate = extractTicketDate(tk);
              const seatText = tk.seat || tk.seat_info || t("seat_auto_assigned");

              // 解析區間資訊
              let tripSection = tk.trip_info;
              if (!tripSection && tk.start_station && tk.end_station) {
                tripSection = `${tk.start_station} ➔ ${tk.end_station}`;
              }

              return (
                <div
                  key={tk.booking_code}
                  className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col gap-3 shadow-lg transition-all ${
                    expired
                      ? "border-slate-800 opacity-80"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* 頂部：取票代碼 + 狀態標籤 */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {t("code_label")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-bold text-amber-400 tracking-wider">
                          {tk.booking_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tk.booking_code, `code_${tk.booking_code}`)}
                          className="text-slate-500 hover:text-amber-400 p-1 rounded transition-colors cursor-pointer"
                          title={t("title_copy_code")}
                        >
                          {copiedKey === `code_${tk.booking_code}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                        expired
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{expired ? t("badge_expired") : t("badge_active")}</span>
                    </span>
                  </div>

                  {/* 核心資訊網格 (4 欄響應式展示) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                    {/* 1. 取票 PID */}
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">{t("pid_label")}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-semibold text-slate-100">
                          {tk.pid || "—"}
                        </span>
                        {tk.pid && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(tk.pid, `pid_${tk.booking_code}`)}
                            className="text-slate-500 hover:text-cyan-400 p-0.5 rounded transition-colors cursor-pointer"
                            title={t("title_copy_pid")}
                          >
                            {copiedKey === `pid_${tk.booking_code}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. 乘車日 */}
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">{t("ride_day_label")}</span>
                      <span className="font-semibold text-cyan-400 font-mono">
                        📅 {rideDate}
                      </span>
                    </div>

                    {/* 3. 車次與車種 */}
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">{t("train_label")}</span>
                      <span className="font-semibold text-slate-200">
                        {tk.train_type ? `${tk.train_type} ` : ""}{tk.train_no} {t("train_unit")}
                      </span>
                    </div>

                    {/* 4. 座位 */}
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">{t("seat_label")}</span>
                      <span className={`font-semibold ${seatText.includes("車") ? "text-emerald-400 font-mono" : "text-slate-300"}`}>
                        💺 {seatText}
                      </span>
                    </div>
                  </div>

                  {/* 行程資訊列 */}
                  {tripSection && (
                    <div className="text-xs text-slate-300 bg-slate-900/30 px-3 py-2 rounded-lg border border-slate-800/40 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">{t("trip_label")}:</span>
                      <span className="font-medium text-slate-200 text-right">{tripSection}</span>
                    </div>
                  )}

                  {/* 繳費期限與記錄時間 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 px-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{t("deadline_label")}:</span>
                      <span className={`font-mono font-semibold ${expired ? "text-slate-400" : "text-amber-400"}`}>
                        {deadline || t("deadline_policy_default")}
                      </span>
                    </div>
                    {tk.created_at && (
                      <div className="text-slate-500 text-[10px] font-mono">
                        {t("recorded_at")}: {tk.created_at}
                      </div>
                    )}
                  </div>

                  {/* 底部按鈕操作區 */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                    {isConfirming ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{expired ? t("confirm_delete_record") : t("confirm_cancel_online_short")}</span>
                        </span>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleConfirmCancel(tk)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? t("op_processing") : t("btn_confirm")}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setConfirmingCode(null)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          {t("btn_cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingCode(tk.booking_code)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          expired
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{expired ? t("btn_delete_expired") : t("btn_cancel_online")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
