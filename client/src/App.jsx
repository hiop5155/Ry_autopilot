// client/src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./components/Navbar";
import TaskTabs from "./components/TaskTabs";
import CriteriaCard from "./components/CriteriaCard";
import TrainListCard from "./components/TrainListCard";
import MonitorTerminal from "./components/MonitorTerminal";
import HistoryModal from "./components/HistoryModal";
import SuccessModal from "./components/SuccessModal";
import ToastContainer from "./components/Toast";
import { useI18n } from "./context/I18nContext";
import { formatTaskName } from "./i18n/locales";
import * as api from "./services/api";

export default function App() {
  const { t } = useI18n();

  // 1. 多任務列表與當前選中任務
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState("default");

  // 2. 當前任務狀態數據
  const [taskState, setTaskState] = useState({
    pid: "",
    ride_date: new Date().toISOString().split("T")[0],
    start_station: "1000",
    end_station: "1020",
    start_time: "08:00",
    end_time: "12:00",
    ticket_qty: 1,
    split_mode: "single",
    is_running: false,
    round_count: 0,
    countdown: 0,
    logs: [],
    cached_trains: [],
    ticket_result: null,
  });

  // 車站字典列表
  const [stations, setStations] = useState([]);

  // 當前任務選中的車次編號 Set
  const [selectedTrainNumbers, setSelectedTrainNumbers] = useState(new Set());

  // 查詢與加載狀態
  const [isQuerying, setIsQuerying] = useState(false);

  // 歷史紀錄彈窗與數據
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTickets, setHistoryTickets] = useState([]);

  // 訂票成功彈窗
  const [successTicket, setSuccessTicket] = useState(null);
  const lastSuccessCodeRef = useRef(null);

  // 用於在輪詢定時器內部隨時讀取最新 taskState，避免 stale closure
  const taskStateRef = useRef(taskState);
  useEffect(() => {
    taskStateRef.current = taskState;
  }, [taskState]);

  // Toast 訊息堆疊
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // 1. 初始化載入車站與全域配置
  useEffect(() => {
    async function init() {
      try {
        const cfg = await api.fetchConfig("default");
        if (cfg.all_stations) {
          setStations(cfg.all_stations);
        }

        const taskRes = await api.fetchTasks();
        if (taskRes.success && taskRes.tasks && taskRes.tasks.length > 0) {
          setTasks(taskRes.tasks);
          setActiveTaskId(taskRes.tasks[0].id);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // 2. 切換 activeTaskId 時同步該任務的設定與狀態
  useEffect(() => {
    if (!activeTaskId) return;
    async function loadTaskData() {
      try {
        const [cfg, status] = await Promise.all([
          api.fetchConfig(activeTaskId),
          api.fetchStatus(activeTaskId),
        ]);

        const merged = { ...cfg, ...status };
        const rawDate = merged.ride_date || "";
        const normalizedDate = rawDate
          ? rawDate.replace(/\//g, "-")
          : (() => {
              const d = new Date(Date.now() + 86400000);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            })();

        setTaskState((prev) => ({
          ...prev,
          ...merged,
          ride_date: normalizedDate,
          start_station: merged.start_station || "1000",
          end_station: merged.end_station || "1020",
          start_time: merged.start_time || "08:00",
          end_time: merged.end_time || "12:00",
          ticket_qty: merged.ticket_qty || 1,
          split_mode: merged.split_mode || "single",
          cached_trains: merged.cached_trains || [],
          logs: merged.logs || [],
        }));

        // 同步已選擇的車次
        if (merged.target_trains && Array.isArray(merged.target_trains)) {
          setSelectedTrainNumbers(new Set(merged.target_trains));
        } else {
          setSelectedTrainNumbers(new Set());
        }
      } catch (err) {
        console.error("Failed to load task data:", err);
      }
    }
    loadTaskData();
  }, [activeTaskId]);

  // 3a. 當前任務狀態輪詢（動態頻率 + 淺比對 Bailout 防止無謂重繪）
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const pollStatus = async () => {
      try {
        const status = await api.fetchStatus(activeTaskId);
        if (!isMounted) return;

        if (status) {
          setTaskState((prev) => {
            const nextLogs = status.logs || prev.logs;
            const isRunning = Boolean(status.is_running);
            const roundCount = status.round_count || 0;
            const countdown = status.countdown || 0;
            const bookedCount = status.booked_count || 0;
            const targetCount = status.target_count || 1;
            const ticketResult = status.ticket_result || null;

            // 比對日誌變化（長度及最新一條訊息）
            const isLogsSame =
              prev.logs === nextLogs ||
              (Array.isArray(prev.logs) &&
                Array.isArray(nextLogs) &&
                prev.logs.length === nextLogs.length &&
                prev.logs[prev.logs.length - 1] === nextLogs[nextLogs.length - 1]);

            // 比對所有關鍵欄位，未發生實質異動則回傳 prev 原參照，觸發 React Bailout 不重繪
            if (
              prev.is_running === isRunning &&
              prev.round_count === roundCount &&
              prev.countdown === countdown &&
              prev.booked_count === bookedCount &&
              prev.target_count === targetCount &&
              JSON.stringify(prev.ticket_result) === JSON.stringify(ticketResult) &&
              isLogsSame
            ) {
              return prev; // 無異動，直接放棄重繪！
            }

            return {
              ...prev,
              is_running: isRunning,
              round_count: roundCount,
              countdown: countdown,
              logs: nextLogs,
              ticket_result: ticketResult,
              booked_count: bookedCount,
              target_count: targetCount,
            };
          });

          // 偵測是否搶票成功
          if (status.ticket_result && status.ticket_result.booking_code) {
            const code = status.ticket_result.booking_code;
            if (lastSuccessCodeRef.current !== code) {
              lastSuccessCodeRef.current = code;
              setSuccessTicket(status.ticket_result);
              addToast("success", t("toast_ticket_success", { train: status.ticket_result.train_no, code }));
            }
          }
        }
      } catch (err) {
        // 伺服器短暫未響應時略過
      }

      if (!isMounted) return;

      // 自適應輪詢間隔：
      // 1. 頁面隱藏在背景分頁時：8000ms（大幅節省資源）
      // 2. 任務正在運行（需更新倒數與回合）：1500ms
      // 3. 任務待命狀態（無背景運算）：3500ms
      let nextDelay = 3500;
      if (typeof document !== "undefined" && document.hidden) {
        nextDelay = 8000;
      } else if (taskStateRef.current?.is_running) {
        nextDelay = 1500;
      }

      timeoutId = setTimeout(pollStatus, nextDelay);
    };

    // 延遲 1.5 秒後啟動初次輪詢，避免剛切換分頁時並發阻塞
    timeoutId = setTimeout(pollStatus, 1500);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTaskId, addToast, t]);

  // 3b. 獨立的多任務清單輪詢（每 5 秒 1 次，並於資料無變化時阻擋重繪）
  useEffect(() => {
    let isMounted = true;
    const pollTasks = async () => {
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const tasksRes = await api.fetchTasks();
        if (!isMounted) return;
        if (tasksRes && tasksRes.success && Array.isArray(tasksRes.tasks)) {
          setTasks((prevTasks) => {
            const newTasks = tasksRes.tasks;
            if (prevTasks.length === newTasks.length) {
              const isIdentical = prevTasks.every((item, idx) => {
                const n = newTasks[idx];
                return n && item.id === n.id && item.name === n.name && item.is_running === n.is_running;
              });
              if (isIdentical) return prevTasks; // 無實質變化，不觸發重新渲染
            }
            return newTasks;
          });
        }
      } catch (err) {
        // 靜默
      }
    };

    const intervalId = setInterval(pollTasks, 5000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // 表單欄位異動處理
  const handleFormChange = (key, value) => {
    setTaskState((prev) => ({ ...prev, [key]: value }));
  };

  // 4. 車次時刻表查詢
  const handleQueryTrains = async () => {
    if (!taskState.ride_date) {
      addToast("warning", t("toast_select_date_first"));
      return;
    }
    setIsQuerying(true);
    const dateFormatted = taskState.ride_date.replace(/-/g, "/");
    try {
      const res = await api.queryTimetable({
        rideDate: dateFormatted,
        startStation: taskState.start_station,
        endStation: taskState.end_station,
        startTime: taskState.start_time,
        endTime: taskState.end_time,
        taskId: activeTaskId,
      });

      if (res.success) {
        const rawList = res.trains || [];
        // 排除直接刷卡進站之非對號車種 (區間車、區間快車、復興號)
        const trainList = rawList.filter((tr) => {
          const type = tr.train_type || "";
          const name = tr.raw_name || "";
          return !["區間", "復興"].some((ex) => type.includes(ex) || name.includes(ex));
        });
        setTaskState((prev) => ({ ...prev, cached_trains: trainList }));
        setSelectedTrainNumbers(new Set()); // 查詢後重設選取
        addToast("success", t("log_query_success", { n: trainList.length }));
      } else {
        addToast("error", t("log_query_fail", { err: res.msg || "未知錯誤" }));
      }
    } catch (err) {
      addToast("error", t("network_error", { err: String(err) }));
    } finally {
      setIsQuerying(false);
    }
  };

  // 車次勾選邏輯
  const handleToggleTrain = (trainNo) => {
    setSelectedTrainNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(trainNo)) {
        next.delete(trainNo);
      } else {
        next.add(trainNo);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allNos = (taskState.cached_trains || []).map((t) => t.train_no);
    setSelectedTrainNumbers(new Set(allNos));
  };

  const handleClearAll = () => {
    setSelectedTrainNumbers(new Set());
  };

  // 5. 啟動自動搶票監控
  const handleStartPolling = async () => {
    if (!taskState.pid.trim()) {
      addToast("warning", t("alert_input_pid"));
      return;
    }

    try {
      const payload = {
        task_id: activeTaskId,
        pid: taskState.pid.trim(),
        ride_date: taskState.ride_date.replace(/-/g, "/"),
        start_station: taskState.start_station,
        end_station: taskState.end_station,
        start_time: taskState.start_time,
        end_time: taskState.end_time,
        target_trains: Array.from(selectedTrainNumbers),
        ticket_qty: taskState.ticket_qty,
        split_mode: taskState.split_mode,
        cached_trains: taskState.cached_trains,
      };

      const res = await api.startPolling(payload);
      if (res.success) {
        setTaskState((prev) => ({ ...prev, is_running: true }));
        // 立即更新任務清單狀態，讓分頁燈號即時亮起
        api.fetchTasks().then((tRes) => {
          if (tRes?.success && tRes?.tasks) setTasks(tRes.tasks);
        }).catch(() => {});
        const currentTask = tasks.find((t) => t.id === activeTaskId);
        const taskDisplayName = formatTaskName(currentTask?.name || taskState.name || "任務 1", t);
        addToast("success", t("toast_task_started", { name: taskDisplayName }));
      } else {
        addToast("error", res.msg || t("alert_start_failed", { err: "" }));
      }
    } catch (err) {
      addToast("error", t("network_error", { err: String(err) }));
    }
  };

  // 停止監控
  const handleStopPolling = async () => {
    try {
      const res = await api.stopPolling(activeTaskId);
      if (res.success) {
        setTaskState((prev) => ({ ...prev, is_running: false }));
        // 立即更新任務清單狀態，讓分頁燈號即時熄滅
        api.fetchTasks().then((tRes) => {
          if (tRes?.success && tRes?.tasks) setTasks(tRes.tasks);
        }).catch(() => {});
        const currentTask = tasks.find((t) => t.id === activeTaskId);
        const taskDisplayName = formatTaskName(currentTask?.name || taskState.name || "任務 1", t);
        addToast("info", t("toast_task_stopped", { name: taskDisplayName }));
      }
    } catch (err) {
      addToast("error", t("network_error", { err: String(err) }));
    }
  };

  // 6. 多任務管理 (新增、刪除、重新命名)
  const handleAddTask = async () => {
    try {
      const nextNum = tasks.length + 1;
      const res = await api.createTask(`任務 ${nextNum}`);
      if (res.success && res.task) {
        setTasks(res.tasks);
        setActiveTaskId(res.task.id);
        const displayName = formatTaskName(res.task.name, t);
        addToast("success", t("toast_task_created", { name: displayName }));
      }
    } catch (err) {
      addToast("error", t("toast_task_create_failed", { err: String(err) }));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const targetTask = tasks.find((t) => t.id === taskId);
      const targetName = formatTaskName(targetTask?.name || taskId, t);
      const res = await api.deleteTask(taskId);
      if (res.success) {
        setTasks(res.tasks);
        if (activeTaskId === taskId && res.tasks.length > 0) {
          setActiveTaskId(res.tasks[0].id);
        }
        addToast("info", t("toast_task_deleted", { name: targetName }));
      } else {
        addToast("warning", res.msg);
      }
    } catch (err) {
      addToast("error", t("toast_task_delete_failed", { err: String(err) }));
    }
  };

  const handleRenameTask = async (taskId, newName) => {
    try {
      const res = await api.renameTask(taskId, newName);
      if (res.success) {
        setTasks(res.tasks);
        addToast("info", t("toast_task_renamed", { name: newName }));
      }
    } catch (err) {
      addToast("error", t("toast_task_rename_failed", { err: String(err) }));
    }
  };

  // 7. 歷史車票開啟與取消退票
  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    try {
      const tickets = await api.fetchTickets();
      setHistoryTickets(tickets || []);
    } catch (err) {
      addToast("error", t("toast_history_load_failed", { err: String(err) }));
    }
  };

  const handleCancelTicketAction = async (bookingCode, pid, isExpired) => {
    try {
      const res = await api.cancelTicket(bookingCode, pid);
      if (res.success) {
        addToast("success", res.msg || (isExpired ? t("alert_delete_expired_success", { code: bookingCode }) : t("alert_cancel_online_success", { code: bookingCode })));
        // 重新整理歷史紀錄
        const updated = await api.fetchTickets();
        setHistoryTickets(updated || []);
      } else {
        addToast("error", res.msg || t("alert_cancel_online_failed", { reason: "" }));
      }
    } catch (err) {
      addToast("error", t("network_error", { err: String(err) }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between">
      {/* 浮動 Toast 提示 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 主版面外容器 */}
      <div className="max-w-6xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col gap-3.5 sm:gap-4">
        {/* 1. 頂部導航列 */}
        <Navbar
          onOpenHistory={handleOpenHistory}
          statusInfo={{
            is_running: taskState.is_running,
            countdown: taskState.countdown,
          }}
        />

        {/* 2. 多任務分頁標籤列 (方案 C 核心) */}
        <TaskTabs
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelectTask={setActiveTaskId}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onRenameTask={handleRenameTask}
        />

        {/* 3. 雙欄主要工作區 (手機自適應堆疊、平板/電腦左右並排) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
          {/* 左欄：乘車行程條件表單 (寬度 5/12) */}
          <div className="lg:col-span-5 w-full">
            <CriteriaCard
              formState={taskState}
              onChange={handleFormChange}
              onQueryTrains={handleQueryTrains}
              isQuerying={isQuerying}
              stations={stations}
              isLocked={taskState.is_running}
              onNotify={addToast}
            />
          </div>

          {/* 右欄：欲追蹤之列車清單 (寬度 7/12) */}
          <div className="lg:col-span-7 w-full">
            <TrainListCard
              trains={taskState.cached_trains || []}
              selectedTrainNumbers={selectedTrainNumbers}
              onToggleTrain={handleToggleTrain}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
              isRunning={taskState.is_running}
              onStartPolling={handleStartPolling}
              onStopPolling={handleStopPolling}
              isLocked={taskState.is_running}
            />
          </div>
        </div>

        {/* 4. 底端即時日誌終端視窗 */}
        <MonitorTerminal
          logs={taskState.logs || []}
          roundCount={taskState.round_count || 0}
        />
      </div>

      {/* 5. 歷史訂票紀錄彈窗 */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tickets={historyTickets}
        onCancelTicket={handleCancelTicketAction}
      />

      {/* 6. 搶票成功慶祝彈窗 */}
      <SuccessModal
        isOpen={Boolean(successTicket)}
        onClose={() => setSuccessTicket(null)}
        ticketData={successTicket}
      />
    </div>
  );
}
