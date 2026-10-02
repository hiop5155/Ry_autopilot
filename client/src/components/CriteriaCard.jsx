// client/src/components/CriteriaCard.jsx
import React, { useRef, useMemo } from "react";
import { ArrowUpDown, Dices, Calendar, Clock, Ticket, Search, CheckCircle2, AlertCircle, ChevronDown, Info, Lock } from "lucide-react";
import StationCombobox from "./StationCombobox";
import { useI18n } from "../context/I18nContext";
import { validateROCId, generateROCId } from "../utils/idHelper";

export default function CriteriaCard({
  formState,
  onChange,
  onQueryTrains,
  isQuerying,
  stations = [],
  isLocked = false,
  onNotify,
}) {
  const { t } = useI18n();
  const dateInputRef = useRef(null);

  const isPidValid = useMemo(() => {
    return validateROCId(formState.pid);
  }, [formState.pid]);

  // 判斷選取的乘車日期是否大於當前 28 天 (預設開放預訂區間)
  const isOver28Days = useMemo(() => {
    if (!formState.ride_date) return false;
    try {
      const target = new Date(formState.ride_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays > 28;
    } catch {
      return false;
    }
  }, [formState.ride_date]);

  const handleGeneratePid = () => {
    if (isLocked) return;
    const newId = generateROCId();
    onChange("pid", newId);
    onNotify?.("success", t("log_pid_generated", { id: newId }));
  };

  const handleSwapStations = () => {
    if (isLocked) return;
    const oldStart = formState.start_station;
    const oldEnd = formState.end_station;
    onChange("start_station", oldEnd);
    onChange("end_station", oldStart);
    onNotify?.("info", t("log_stations_swapped", { start: oldEnd, end: oldStart }));
  };

  // 生成時間選項 (00:00 ~ 23:30 每半小時一檔)
  const timeOptions = useMemo(() => {
    const opts = [];
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, "0");
      opts.push(`${hh}:00`);
      opts.push(`${hh}:30`);
    }
    return opts;
  }, []);

  // 開啟原生日曆選擇器
  const openDatePicker = () => {
    if (isLocked) return;
    try {
      if (dateInputRef.current && typeof dateInputRef.current.showPicker === "function") {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current?.focus();
      }
    } catch {
      dateInputRef.current?.focus();
    }
  };

  return (
    <section className={`backdrop-blur-xl border rounded-2xl p-4 sm:p-5 shadow-xl transition-all flex flex-col gap-4 ${
      isLocked
        ? "bg-slate-900/60 border-amber-500/30 shadow-none ring-1 ring-amber-500/20"
        : "bg-slate-900/80 border-slate-800/80 shadow-slate-950/40"
    }`}>
      {/* 標題列 */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Ticket className={`w-5 h-5 ${isLocked ? "text-amber-400" : "text-cyan-400"}`} />
          <h2 className="text-base font-bold text-white tracking-wide">
            {t("card1_title")}
          </h2>
        </div>

        {/* 鎖定狀態指示 */}
        {isLocked && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 animate-pulse">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("polling_active_badge")}</span>
          </span>
        )}
      </div>

      {/* 鎖定全幅醒目提示橫幅 */}
      {isLocked && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium leading-relaxed">
            {t("criteria_locked_banner")}
          </span>
        </div>
      )}

      {/* 1. PID */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>{t("lbl_pid")}</span>
          <span className="text-[11px] font-mono text-slate-500">
            {formState.pid.length}/10 碼
          </span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              disabled={isLocked}
              maxLength={10}
              placeholder={t("pid_ph")}
              value={formState.pid}
              onChange={(e) => onChange("pid", e.target.value.toUpperCase())}
              className={`w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase ${
                isLocked ? "opacity-60 cursor-not-allowed bg-slate-950/60 select-none" : ""
              }`}
            />
            {formState.pid.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {isPidValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={isLocked}
            onClick={handleGeneratePid}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 hover:text-cyan-300 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>{t("btn_generate_pid")}</span>
          </button>
        </div>
      </div>

      {/* 2. 起訖站點 (兩欄或自適應) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        <StationCombobox
          label={t("lbl_start_station")}
          value={formState.start_station}
          onChange={(val) => onChange("start_station", val)}
          stations={stations}
          placeholder={t("start_station_ph")}
          disabled={isLocked}
        />

        {/* 站點互換按鈕 (桌面在中間浮動，手機在右側) */}
        <button
          type="button"
          disabled={isLocked}
          onClick={handleSwapStations}
          title={t("btn_swap_stations")}
          className="hidden sm:flex absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-slate-800 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-400 rounded-full items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-90 disabled:opacity-50 cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>

        <StationCombobox
          label={t("lbl_end_station")}
          value={formState.end_station}
          onChange={(val) => onChange("end_station", val)}
          stations={stations}
          placeholder={t("end_station_ph")}
          disabled={isLocked}
        />
      </div>

      {/* 3. 乘車日期 */}
      <div>
        <label
          htmlFor="rideDateInput"
          className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 cursor-pointer select-none"
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t("lbl_ride_date")}</span>
        </label>
        <div className="relative">
          <input
            id="rideDateInput"
            ref={dateInputRef}
            type="date"
            disabled={isLocked}
            value={formState.ride_date || ""}
            onChange={(e) => onChange("ride_date", e.target.value)}
            onClick={(e) => {
              if (isLocked) return;
              try {
                if (typeof e.target.showPicker === "function") {
                  e.target.showPicker();
                }
              } catch {}
            }}
            style={{ colorScheme: "dark" }}
            className={`w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[44px] ${
              isLocked ? "opacity-60 cursor-not-allowed bg-slate-950/60 select-none" : "cursor-pointer"
            }`}
          />
        </div>
        {/* 開放訂票時間說明 Note (不阻擋選取，友善提示) */}
        <div className="mt-1.5 text-[11px] rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 bg-slate-900/40 border border-slate-800/60 text-slate-400">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400/80" />
          <span className="leading-relaxed">{t("hint_booking_window_28d")}</span>
        </div>
      </div>

      {/* 4. 時段起點與迄點 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t("lbl_start_time")}</span>
          </label>
          <div className="relative">
            <select
              disabled={isLocked}
              value={formState.start_time}
              onChange={(e) => onChange("start_time", e.target.value)}
              className={`w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none ${
                isLocked ? "opacity-60 cursor-not-allowed bg-slate-950/60 select-none" : "cursor-pointer"
              }`}
            >
              {timeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-white">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">{t("lbl_end_time")}</span>
          </label>
          <div className="relative">
            <select
              disabled={isLocked}
              value={formState.end_time}
              onChange={(e) => onChange("end_time", e.target.value)}
              className={`w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none ${
                isLocked ? "opacity-60 cursor-not-allowed bg-slate-950/60 select-none" : "cursor-pointer"
              }`}
            >
              {timeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-white">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 5. 預定張數 */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t("lbl_qty")}</span>
        </label>
        <div className="relative">
          <select
            disabled={isLocked}
            value={formState.ticket_qty}
            onChange={(e) => onChange("ticket_qty", Number(e.target.value))}
            className={`w-full pl-3.5 pr-9 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none ${
              isLocked ? "opacity-60 cursor-not-allowed bg-slate-950/60 select-none" : "cursor-pointer"
            }`}
          >
            <option value={1} className="bg-slate-900 text-white">{t("opt_qty_1")}</option>
            <option value={2} className="bg-slate-900 text-white">{t("opt_qty_2")}</option>
            <option value={3} className="bg-slate-900 text-white">{t("opt_qty_3")}</option>
            <option value={4} className="bg-slate-900 text-white">{t("opt_qty_4")}</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* 6. 多張配票拆單模式 (當張數 > 1 時展示) */}
      {formState.ticket_qty > 1 && (
        <div className={`p-3 border rounded-xl flex flex-col gap-2 transition-all ${
          isLocked ? "bg-slate-950/40 border-slate-800/80 opacity-70" : "bg-slate-950/60 border-slate-800"
        }`}>
          <label className="text-xs font-semibold text-cyan-400">{t("lbl_split_mode")}</label>
          <div className="relative">
            <select
              disabled={isLocked}
              value={formState.split_mode}
              onChange={(e) => onChange("split_mode", e.target.value)}
              className={`w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-cyan-500 appearance-none ${
                isLocked ? "opacity-60 cursor-not-allowed bg-slate-950/60 select-none" : "cursor-pointer"
              }`}
            >
              <option value="single" className="bg-slate-900 text-white">
                {t("opt_mode_single_tpl", { n: formState.ticket_qty })}
              </option>
              <option value="split" className="bg-slate-900 text-white">
                {t("opt_mode_split_tpl", { n: formState.ticket_qty })}
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-400">
            {formState.split_mode === "split"
              ? t("hint_mode_split", { n: formState.ticket_qty })
              : t("hint_mode_single", { n: formState.ticket_qty })}
          </p>
        </div>
      )}

      {/* 7. 查詢車次按鈕 */}
      <button
        type="button"
        disabled={isLocked || isQuerying}
        onClick={onQueryTrains}
        className={`mt-1 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
          isLocked
            ? "bg-slate-800/80 text-slate-400 border border-slate-700/60 shadow-none cursor-not-allowed select-none"
            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-white shadow-lg shadow-cyan-950/50 disabled:opacity-60 cursor-pointer"
        }`}
      >
        {isLocked ? (
          <>
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{t("btn_query_trains_locked")}</span>
          </>
        ) : isQuerying ? (
          <>
            <Search className="w-4 h-4 animate-spin" />
            <span>{t("btn_querying")}</span>
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            <span>{t("btn_query_trains")}</span>
          </>
        )}
      </button>
    </section>
  );
}
