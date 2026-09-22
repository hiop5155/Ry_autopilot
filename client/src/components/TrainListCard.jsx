// client/src/components/TrainListCard.jsx
import React from "react";
import { Train, Zap, Square, CheckSquare, Clock } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export default function TrainListCard({
  trains = [],
  selectedTrainNumbers = new Set(),
  onToggleTrain,
  onSelectAll,
  onClearAll,
  isRunning,
  onStartPolling,
  onStopPolling,
  isLocked = false,
}) {
  const { t, formatTrainType } = useI18n();

  const selectedCount = selectedTrainNumbers.size;

  return (
    <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/40 flex flex-col justify-between gap-4">
      <div>
        {/* 卡片標題與全選按鈕 */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            {t("card2_title")}
          </h2>

          {trains.length > 0 && !isLocked && (
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={onSelectAll}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {t("btn_select_all")}
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                {t("btn_clear_all")}
              </button>
            </div>
          )}
        </div>

        {/* 列車清單列表 */}
        <div className="flex flex-col gap-2.5 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {trains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center text-slate-500">
              <Train className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-xs sm:text-sm max-w-xs leading-relaxed">
                {t("empty_state_desc")}
              </p>
            </div>
          ) : (
            trains.map((tItem) => {
              const isSelected = selectedTrainNumbers.has(tItem.train_no);
              return (
                <div
                  key={tItem.train_no}
                  onClick={() => !isLocked && onToggleTrain(tItem.train_no)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl border transition-all select-none cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/10 border-cyan-500/80 shadow-md shadow-cyan-950/30"
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
                  } ${isLocked ? "opacity-60 cursor-not-allowed" : "active:scale-[0.99]"}`}
                >
                  {/* 左側：勾選框 + 車次編號 + 車種標籤 */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-cyan-400 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-cyan-500/20" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <span className="font-mono text-sm sm:text-base font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {tItem.train_no}
                    </span>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {formatTrainType(tItem.train_type)}
                    </span>
                  </div>

                  {/* 右側：行車時間 + 歷時 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm pl-6 sm:pl-0 pt-1 sm:pt-0 border-t border-slate-800/40 sm:border-0">
                    <span className="font-semibold text-slate-200">
                      {tItem.start_time} ➔ {tItem.end_time}
                    </span>
                    {tItem.duration && (
                      <span className="text-slate-500 flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>({tItem.duration})</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 底部監控啟動操作列 */}
      {trains.length > 0 && (
        <div className="border-t border-slate-800/80 pt-3.5 flex flex-col gap-2.5">
          <div className="text-center text-xs text-slate-400 font-medium">
            {selectedCount === 0
              ? t("selected_all_trains")
              : t("selected_summary_tpl", { n: selectedCount })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {!isRunning ? (
              <button
                type="button"
                onClick={onStartPolling}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-950/60 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>{t("btn_start_polling")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopPolling}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-red-950/60 transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{t("btn_stop_polling")}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
