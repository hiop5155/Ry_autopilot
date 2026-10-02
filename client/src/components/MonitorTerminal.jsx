// client/src/components/MonitorTerminal.jsx
import React, { useEffect, useRef, useState } from "react";
import { Terminal, ArrowDown } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { formatLogMessage } from "../i18n/logTranslator";

function MonitorTerminal({ logs = [], roundCount = 0 }) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const prevLogsCountRef = useRef(0);

  // 監聽使用者在終端機內部的滾動行為
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // 如果離底部超過 35px，視為使用者正在向上查看日誌
    const scrolledUp = scrollHeight - scrollTop - clientHeight > 35;
    setIsUserScrolledUp(scrolledUp);
  };

  // 當有新日誌進來時的智慧滾動控制
  useEffect(() => {
    if (!containerRef.current) return;

    // 只有當日誌筆數「真的有增加」而且「使用者未向上滾動查看歷史」時才滾動
    const hasNewLogs = logs.length > prevLogsCountRef.current;
    prevLogsCountRef.current = logs.length;

    if (hasNewLogs && !isUserScrolledUp) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isUserScrolledUp]);

  // 手動點擊「回到底部」
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setIsUserScrolledUp(false);
    }
  };

  const getLogStyle = (log) => {
    if (typeof log !== "string") return "text-slate-400";
    if (log.includes("🎉") || log.includes("🎊") || log.includes("成功") || log.includes("Success") || log.includes("成功") || log.includes("성공")) {
      return "text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded";
    }
    if (log.includes("驗證碼微誤") || log.includes("無剩餘座位") || log.includes("等待") || log.includes("No seats") || log.includes("Captcha mismatch") || log.includes("空席はありません")) {
      return "text-amber-300/90";
    }
    if (log.includes("異常") || log.includes("失敗") || log.includes("ERROR") || log.includes("Exception") || log.includes("Failed")) {
      return "text-red-400 font-semibold";
    }
    if (log.includes("[系統]") || log.includes("[System]") || log.includes("[システム]") || log.includes("[시스템]")) {
      return "text-cyan-400 font-mono";
    }
    return "text-slate-300";
  };

  return (
    <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl shadow-slate-950/40 flex flex-col gap-3 relative">
      {/* 標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm sm:text-base font-bold text-white">
            {t("card3_title")}
          </h2>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            {t("round_badge_tpl", { n: roundCount })}
          </span>
          {isUserScrolledUp && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span>{t("terminal_scroll_paused")}</span>
            </span>
          )}
        </div>
      </div>

      {/* 終端黑底視窗：獨立內部滾動，overscroll-contain 避免連帶滾動全頁 */}
      <div className="relative">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{ overscrollBehavior: "contain" }}
          className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 font-mono text-xs leading-relaxed max-h-48 sm:max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 select-text"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">{t("terminal_ready")}</div>
          ) : (
            logs.map((msg, idx) => {
              const translated = formatLogMessage(msg, t);
              return (
                <div key={idx} className={`py-0.5 ${getLogStyle(translated)} break-words`}>
                  {translated}
                </div>
              );
            })
          )}
        </div>

        {/* 當使用者手動往上滑時顯示浮動回到底部按鈕 */}
        {isUserScrolledUp && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-950/60 text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all border border-cyan-400/40 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>{t("terminal_scroll_to_bottom")}</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default React.memo(MonitorTerminal);
