// client/src/components/SessionBookingsModal.jsx
import React, { useState } from "react";
import { X, Ticket, Clock, Copy, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { extractTicketDate, isTicketDeadlineExpired, getTicketQuantity } from "./HistoryModal";

export default function SessionBookingsModal({
  isOpen,
  onClose,
  tickets = [],
  onCancelTicket,
  cancellingCode: externalCancellingCode = null,
}) {
  const { t, formatTrainType } = useI18n();
  const [confirmingCode, setConfirmingCode] = useState(null);
  const [localCancellingCode, setLocalCancellingCode] = useState(null);
  const cancellingCode = externalCancellingCode || localCancellingCode;
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCancelClick = async (tk, expired) => {
    if (confirmingCode !== tk.booking_code) {
      setConfirmingCode(tk.booking_code);
      return;
    }

    setConfirmingCode(null);
    setLocalCancellingCode(tk.booking_code);
    try {
      if (onCancelTicket) {
        await onCancelTicket(tk.booking_code, tk.pid, expired);
      }
    } finally {
      setLocalCancellingCode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl shadow-emerald-950/40 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 全局退票操作鎖定動畫阻擋層 */}
        {cancellingCode && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 select-none cursor-wait">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 animate-ping absolute" />
              <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin" />
              <div className="absolute flex items-center justify-center text-emerald-400">
                <Ticket className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <h4 className="text-base font-bold text-white mb-1.5 tracking-wide">
              {t("cancelling_overlay_title")}
            </h4>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/40 text-amber-400 font-mono text-sm font-bold shadow-md shadow-amber-950/30 mb-2">
              <span>{t("cancelling_code_badge")}</span>
              <span className="tracking-wider">{cancellingCode}</span>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t("cancelling_overlay_desc")}
            </p>

            <div className="w-48 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
            </div>
          </div>
        )}

        {/* 頂部標頭 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {t("session_modal_title")}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {tickets.length} {t("train_unit")}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t("session_modal_desc")}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={Boolean(cancellingCode)}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 車票列表展示區 */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3.5 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2">
              <Ticket className="w-10 h-10 text-slate-600 stroke-1" />
              <span>{t("session_bookings_empty")}</span>
            </div>
          ) : (
            tickets.map((tk, idx) => {
              const deadline = tk.pay_deadline || tk.payment_deadline || "";
              const expired = isTicketDeadlineExpired(deadline, tk.created_at);
              const isConfirming = confirmingCode === tk.booking_code;
              const isProcessing = cancellingCode === tk.booking_code;
              const rideDate = extractTicketDate(tk);
              const seatText = tk.seat || tk.seat_info || t("seat_auto_assigned");

              // 整理區間文字
              let tripSection = tk.trip_info;
              if (!tripSection && tk.start_station && tk.end_station) {
                tripSection = `${tk.start_station} ➔ ${tk.end_station}`;
              }

              // 處理車次車種文字避免重複
              let tType = (tk.train_type || "").trim();
              const tNo = String(tk.train_no || "").trim();
              if (tNo && tType.endsWith(tNo)) {
                tType = tType.slice(0, -tNo.length).trim();
              }

              const ticketQty = getTicketQuantity(tk);

              return (
                <div
                  key={tk.booking_code || idx}
                  className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg transition-all"
                >
                  {/* 頂部：序號 + 取票代碼 + 張數徽章 + 狀態 */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-500 w-5">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {t("code_label")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-bold text-amber-400 tracking-wider">
                            {tk.booking_code}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {t("ticket_qty_tag", { n: ticketQty })}
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
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                        expired
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{expired ? t("badge_expired") : t("badge_active")}</span>
                    </span>
                  </div>

                  {/* 核心資訊網格 (5 欄響應式) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                    {/* 1. PID */}
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
                            className="text-slate-500 hover:text-cyan-400 p-0.5 rounded transition-colors"
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
                        {tType ? `${formatTrainType(tType)} ` : ""}{tNo} {t("train_unit")}
                      </span>
                    </div>

                    {/* 4. 訂購張數 */}
                    <div>
                      <span className="text-slate-500 block mb-0.5 font-medium">{t("ticket_qty_label")}</span>
                      <span className="font-bold text-amber-400 font-mono">
                        🎫 {t("ticket_qty_tag", { n: ticketQty })}
                      </span>
                    </div>

                    {/* 5. 座位 */}
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

                  {/* 操作退票 */}
                  {onCancelTicket && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{t("confirm_cancel_online_short")}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCancelClick(tk, expired)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white font-semibold rounded transition-colors"
                          >
                            {isProcessing ? t("processing_cancel") : t("btn_yes")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingCode(null)}
                            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                          >
                            {t("btn_no")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingCode(tk.booking_code)}
                          className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors"
                        >
                          <span>✕ {t("btn_cancel_ticket")}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 底部關閉按鈕 */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            disabled={Boolean(cancellingCode)}
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white font-medium text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {t("modal_close")}
          </button>
        </div>
      </div>
    </div>
  );
}
