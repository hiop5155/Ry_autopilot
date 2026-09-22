// client/src/services/api.js
// 後端 RESTful API 封裝服務，全面支援多任務 task_id 傳遞

const API_BASE = "";

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/api/tasks`);
  return res.json();
}

export async function createTask(name = "") {
  const res = await fetch(`${API_BASE}/api/tasks/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteTask(taskId) {
  const res = await fetch(`${API_BASE}/api/tasks/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId }),
  });
  return res.json();
}

export async function renameTask(taskId, newName) {
  const res = await fetch(`${API_BASE}/api/tasks/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, name: newName }),
  });
  return res.json();
}

export async function fetchConfig(taskId = "default") {
  const res = await fetch(`${API_BASE}/api/config?task_id=${encodeURIComponent(taskId)}`);
  return res.json();
}

export async function fetchStatus(taskId = "default") {
  const res = await fetch(`${API_BASE}/api/status?task_id=${encodeURIComponent(taskId)}`);
  return res.json();
}

export async function fetchTickets() {
  const res = await fetch(`${API_BASE}/api/tickets`);
  return res.json();
}

export async function queryTimetable({ rideDate, startStation, endStation, startTime, endTime, taskId = "default" }) {
  const res = await fetch(`${API_BASE}/api/timetable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ride_date: rideDate,
      start_station: startStation,
      end_station: endStation,
      start_time: startTime,
      end_time: endTime,
      task_id: taskId,
    }),
  });
  return res.json();
}

export async function startPolling(payload) {
  const res = await fetch(`${API_BASE}/api/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function stopPolling(taskId = "default") {
  const res = await fetch(`${API_BASE}/api/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId }),
  });
  return res.json();
}

export async function cancelTicket(bookingCode, pid) {
  const res = await fetch(`${API_BASE}/api/cancel_ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_code: bookingCode, pid }),
  });
  return res.json();
}
