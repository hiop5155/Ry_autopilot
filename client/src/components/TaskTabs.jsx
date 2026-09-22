// client/src/components/TaskTabs.jsx
import React, { useState } from "react";
import { Plus, X, Edit2, Check } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { formatTaskName } from "../i18n/locales";

export default function TaskTabs({
  tasks = [],
  activeTaskId,
  onSelectTask,
  onAddTask,
  onDeleteTask,
  onRenameTask,
}) {
  const { t: translate } = useI18n();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const startRename = (t, e) => {
    e.stopPropagation();
    setEditingId(t.id);
    setEditName(t.name);
  };

  const saveRename = (t, e) => {
    e.stopPropagation();
    if (editName.trim() && editName.trim() !== t.name) {
      onRenameTask(t.id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {tasks.map((t) => {
        const isActive = t.id === activeTaskId;
        const isEditing = editingId === t.id;

        return (
          <div
            key={t.id}
            onClick={() => onSelectTask(t.id)}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all duration-200 select-none shrink-0 ${
              isActive
                ? "bg-slate-800/90 border-cyan-500/80 text-white shadow-lg shadow-cyan-950/40"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            {/* 狀態呼吸小圓點 */}
            <span className="relative flex h-2 w-2">
              {t.is_running ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : t.has_success ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
              )}
            </span>

            {/* 任務名稱展示或編輯 */}
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(t, e);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-24 px-1.5 py-0.5 bg-slate-950 border border-cyan-500 rounded text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => saveRename(t, e)}
                  className="p-1 hover:text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span
                onDoubleClick={(e) => startRename(t, e)}
                className="font-semibold max-w-[130px] truncate"
                title={translate("title_rename_task")}
              >
                {formatTaskName(t.name, translate)}
              </span>
            )}

            {/* 輪詢次數標籤 */}
            {t.is_running && t.round_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                #{t.round_count}
              </span>
            )}

            {/* 編輯名稱小按鈕 */}
            {!isEditing && (
              <button
                type="button"
                onClick={(e) => startRename(t, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-cyan-400 transition-opacity"
                title={translate("title_rename_task")}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}

            {/* 刪除任務按鈕 (大於1個時顯示) */}
            {tasks.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(t.id);
                }}
                className="p-0.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-slate-700/60 transition-colors ml-0.5"
                title={translate("title_close_task")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* 新增任務按鈕 */}
      <button
        type="button"
        onClick={onAddTask}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-cyan-400 text-xs sm:text-sm font-medium transition-all shrink-0 select-none shadow-sm"
        title={translate("title_add_task")}
      >
        <Plus className="w-4 h-4" />
        <span>{translate("btn_add_task")}</span>
      </button>
    </div>
  );
}
