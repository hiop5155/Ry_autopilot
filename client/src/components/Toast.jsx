// client/src/components/Toast.jsx
import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  const borderColors = {
    success: "border-emerald-500/50 bg-slate-900/95 text-slate-100",
    error: "border-red-500/50 bg-slate-900/95 text-slate-100",
    warning: "border-amber-500/50 bg-slate-900/95 text-slate-100",
    info: "border-cyan-500/50 bg-slate-900/95 text-slate-100",
  };

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:top-6 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            borderColors[toast.type] || borderColors.info
          }`}
        >
          <div className="flex items-center gap-3">
            {icons[toast.type] || icons.info}
            <span className="text-sm font-medium leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
