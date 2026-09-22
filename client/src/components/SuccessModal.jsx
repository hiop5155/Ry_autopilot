// client/src/components/SuccessModal.jsx
import React from "react";
import { CheckCircle2, Ticket, Award, X, Clock, User } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export default function SuccessModal({ isOpen, onClose, ticketData }) {
  const { t } = useI18n();

  if (!isOpen || !ticketData) return null;

  const seatText = ticketData.seat || ticketData.seat_info || t("seat_auto_assigned");
  const tripText = ticketData.trip_info || (ticketData.start_station && ticketData.end_station ? `${ticketData.start_station} ➔ ${ticketData.end_station}` : t("trip_confirmed"));
  let rideDate = ticketData.ride_date;
  if (!rideDate && ticketData.trip_info) {
    const m = ticketData.trip_info.match(/(\d{1,2}\/\d{1,2})/);
    if (m) rideDate = m[1];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-950/50">
          <span className="text-3xl">🎉</span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            {t("modal_success_title")}
          </h3>
          <p className="text-xs text-slate-400">{t("modal_saved_hint")}</p>
        </div>

        {/* 車票資訊盒 */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs text-slate-500 font-semibold">{t("code_label")}</span>
            <span className="font-mono text-xl font-bold text-amber-400">
              {ticketData.booking_code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {ticketData.pid && (
              <div>
                <span className="text-slate-500 block">{t("pid_label")}</span>
                <span className="font-mono font-semibold text-slate-200">{ticketData.pid}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">{t("ride_day_label")}</span>
              <span className="font-semibold text-cyan-400 font-mono">{rideDate || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{t("train_label")}</span>
              <span className="font-semibold text-slate-200">
                {ticketData.train_type ? `${ticketData.train_type} ` : ""}{ticketData.train_no} 次
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{t("seat_label")}</span>
              <span className="font-semibold text-emerald-400">{seatText}</span>
            </div>
          </div>

          {tripText && (
            <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-slate-300">
              <span className="text-slate-500 block text-[11px] mb-0.5">{t("trip_label")}</span>
              <span className="font-medium text-slate-200">{tripText}</span>
            </div>
          )}

          {ticketData.pay_deadline && (
            <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{t("deadline_label")}: {ticketData.pay_deadline}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
        >
          {t("modal_success_btn")}
        </button>
      </div>
    </div>
  );
}
