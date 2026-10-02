// client/src/components/LoadingOverlay.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay({
  isVisible,
  text = "處理中...",
  subText = null,
  badge = null,
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[3px] transition-all duration-300 select-none cursor-wait">
      <div className="bg-slate-900 border border-slate-700/80 p-6 sm:p-7 rounded-2xl shadow-2xl shadow-slate-950 flex flex-col items-center gap-3.5 max-w-sm w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* 轉圈圖標，參考 money-tracker 實作 */}
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        </div>

        {/* 主提示文字 */}
        <span className="text-base font-bold text-white tracking-wide">
          {text}
        </span>

        {/* 標籤徽章 (例如訂票代碼) */}
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold shadow-md shadow-amber-950/30">
            {badge}
          </div>
        )}

        {/* 副標說明文字 */}
        {subText && (
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            {subText}
          </p>
        )}

        {/* 流動動態條 */}
        <div className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden relative mt-1">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
