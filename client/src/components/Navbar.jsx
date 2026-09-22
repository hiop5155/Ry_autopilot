// client/src/components/Navbar.jsx
import React from "react";
import { Globe, History, Activity } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export default function Navbar({ onOpenHistory, statusInfo }) {
  const { lang, setLang, t } = useI18n();

  const isRunning = statusInfo?.is_running;
  const countdown = statusInfo?.countdown || 0;

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl shadow-slate-950/50">
      {/* 左側品牌 */}
      <div className="flex items-center gap-3">
        <span className="text-2xl sm:text-3xl filter drop-shadow">🚄</span>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            {t("app_title")}
          </h1>
          <span className="text-[11px] font-medium text-cyan-400/90 tracking-wide">
            Railway Auto-Pilot v2.0
          </span>
        </div>
      </div>

      {/* 右側工具操作列 */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
        {/* 狀態指示條 */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isRunning
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/20"
              : "bg-slate-800/60 border-slate-700/60 text-slate-400"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isRunning ? "bg-emerald-500" : "bg-slate-500"
              }`}
            ></span>
          </span>
          <span>
            {isRunning
              ? countdown > 0
                ? t("status_waiting_countdown", { s: countdown })
                : t("status_checking_seats")
              : t("status_idle")}
          </span>
        </div>

        {/* 語言切換選單 */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-850 border border-slate-700/60 hover:border-cyan-500/50 px-2.5 py-1.5 rounded-xl text-xs transition-colors">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium text-xs"
          >
            <option value="zh-TW" className="bg-slate-900 text-white">繁體中文</option>
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="ja" className="bg-slate-900 text-white">日本語</option>
            <option value="ko" className="bg-slate-900 text-white">한국어</option>
          </select>
        </div>

        {/* 歷史取票紀錄按鈕 */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 active:scale-95 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs sm:text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>{t("nav_history")}</span>
        </button>
      </div>
    </header>
  );
}
