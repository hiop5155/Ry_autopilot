# 🚄 Railway Auto-Pilot (Smart Train Ticket Monitoring & Booking System)

An enterprise-grade, full-stack automated seat-hunting, multi-task schedule monitoring, and rapid booking platform designed for railway passenger transport.

---

## 🌟 Key Features (v2.0 Full-Stack Architecture)

1. **🚀 Single-Window Multi-Task Manager**:

2. **📱 Mobile-First Bento Grid UI**:
   - **Vite 6 + React 19 + Tailwind CSS v4**: Completely overhauled with modern glassmorphism, fluid dark theme, responsive grid layouts, and zero visual stutter.

3. **📜 Smart History & Online Cancellation**:

4. **🖥️ Smart Log Terminal with Scroll Protection**:

5. **🌐 Real-Time Multilingual Support (i18n)**:
   - Fully localized across **Traditional Chinese (zh-TW)**, **English (en)**, **Japanese (ja)**, and **Korean (ko)**.

6. **🧠 Deep Learning OCR Captcha Solver**:

---

## 📁 System Architecture

The project is architected as a decoupled full-stack monorepo:

```text
tn_test/
├── client/                     # Modern Frontend SPA (React 19 + Vite 6 + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/         # Modular UI Components (Navbar, TaskTabs, Criteria, Terminal...)
│   │   ├── context/            # Global State & i18n Context Providers
│   │   ├── services/           # RESTful API client services
│   │   ├── utils/              # ID validation, ROC ID generator & date helpers
│   │   ├── App.jsx             # Main Application Container & Polling Loop
│   │   └── main.jsx            # React Root Mount
│   ├── vite.config.js          # Vite configuration with reverse proxy for /api
│   └── package.json            # Frontend dependencies & scripts
│
├── app/                        # Core Backend & Automation Engine (Python 3)
│   ├── db.py                   # Unified SQLite database engine (Port -> Tasks -> Tickets)
│   ├── config.py               # Config loader and time window validation
│   ├── stations.py             # Station catalog and 4-digit code mapping
│   ├── ocr.py                  # Deep-learning OCR captcha recognition engine
│   ├── timetable.py            # Real-time timetable query module
│   ├── booking_engine.py       # Automated booking engine
│   ├── cancel_ticket.py        # Online ticket cancellation & deadline handler
│   ├── storage.py              # Persistent ticket storage gateway (SQLite & TXT log)
│   ├── id_helper.py            # Passenger identification checksum validator & generator
│   ├── cli.py                  # Terminal CLI fallback mode
│   └── web/                    # Embedded Web Server Subsystem
│       ├── server.py           # HTTP server bootstrap & port management
│       ├── state.py            # SQLite-backed multi-task state manager
│       ├── worker.py           # Background multi-task parallel polling threads
│       ├── handlers.py         # RESTful API router (serves /api & client/dist SPA)
│       └── static/             # Legacy native HTML fallback
│
├── ~/.Ry_autopilot/           # Centralized persistence home (~/.Ry_autopilot/autopilot.db)
│
├── package.json                # Root full-stack orchestration scripts
├── main.py                     # Application entry point (Web / CLI router)
├── run.sh                      # Production / Standalone launch script (Linux/macOS)
├── run.bat                     # Production / Standalone launch script (Windows)
├── scripts/build_dist.py       # Cross-platform standalone executable packaging script
└── requirements.txt            # Python dependencies
```

---

## 🚀 Quick Start

### 1. One-Click Launch (Recommended)
After cloning or pulling the repository, the simplest and fastest way to launch:

```bash
make run
```
- **Automatic Environment Initialization**: Automatically detects and creates the Python virtual environment (`./venv`) and installs dependencies from `requirements.txt`.
- **Automatic Frontend Build**: Builds the React SPA (`npm install && npm run build`) on first run if `client/dist` is not present.
- **Automatic Dashboard Launch**: Starts the backend web server and opens the modern dashboard in your default browser
- **Custom Arguments**: Supports passing runtime options, e.g. `make run ARGS="--port 8082"` or `make run ARGS="--cli"`.

---

### 2. Standalone Binary Installation (Global Command)
To install the system as a global command accessible from any directory:

```bash
make install
```
- Automatically bundles the entire full-stack application into a single standalone binary and installs it to `~/.local/bin/Ry_autopilot`.
- Once installed, execute directly from any terminal window:
  ```bash
  Ry_autopilot                  # Launch Web Dashboard
  Ry_autopilot --port 8082      # Specify port
  Ry_autopilot --cli            # Launch Interactive CLI mode
  ```
- To uninstall, simply run `make uninstall`.

---

### 3. Full-Stack Development Mode (Frontend HMR + Backend API)
If you want to modify frontend code with Vite Fast Refresh (HMR) while connected to the Python backend:

```bash
npm run dev
```
- **Backend API**: `http://127.0.0.1:8082`
- **Frontend Vite Dev Server**: `http://127.0.0.1:5173` (with automatic `/api` proxying to backend)

---

### 4. Interactive CLI Mode
Ideal for headless remote SSH servers or text-only environments without a GUI:

```bash
./run.sh --cli
# OR
make run ARGS="--cli"
```

---

### 5. Standalone Executable Packaging (PyInstaller Build)
Manually compile an all-in-one standalone binary executable (bundled with frontend dist and ONNX deep-learning OCR model):

```bash
make dist
# Outputs standalone binary to ./Ry_autopilot
```

---

### 6. Automated Unit Testing & QA Suite
The repository includes a decoupled, sub-second unit test suite that executes completely offline without network latency or Chrome browser overhead:

```bash
# Run the entire test suite (26 tests in < 1 second)
./run_tests.sh

# Run specific testing modules:
./run_tests.sh 1    # Pure logic & date parsing (tests/test_1_pure_logic.py)
./run_tests.sh 2    # HTML fixtures & offline parsing (tests/test_2_html_parsing.py)
./run_tests.sh 3    # SQLite isolation & task state (tests/test_3_db_and_state.py)
```
For detailed maintenance guidelines and website redesign fixture SOPs, refer to [`TESTING.md`](TESTING.md).

---

## 🛠️ RESTful API Specification

The full API schema is formally defined according to the **OpenAPI 3.0.3** standard in [`openapi.yaml`](openapi.yaml). You can import it into Swagger Editor, Postman, or Redoc for interactive documentation and testing.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/tasks` | GET | Retrieve summary of all active task tabs (IDs, names, running status) |
| `/api/tasks/create` | POST | Create a new isolated itinerary task tab |
| `/api/tasks/rename` | POST | Rename an existing task tab |
| `/api/tasks/delete` | POST | Terminate and delete a task tab |
| `/api/config?task_id={id}` | GET | Retrieve station catalog and task-specific configuration |
| `/api/status?task_id={id}` | GET | Retrieve real-time polling state, countdown, logs, and booking results |
| `/api/timetable` | POST | Query official railway schedules for specified date & stations |
| `/api/start` | POST | Launch background seat-hunting worker for a specific task |
| `/api/stop` | POST | Halt background monitoring for a specific task |
| `/api/tickets` | GET | List all booked tickets stored in the SQLite database (`autopilot.db`) |
| `/api/cancel_ticket` | POST | Execute official online ticket cancellation and remove local record |

---

## ⚖️ License & Disclaimer

### License
This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).
- **Personal & Noncommercial Use Only**: Permitted for individual study, academic research, and non-profit demonstrations.
- **Commercial Use Prohibited**: Strictly forbids resale, paid ticket procurement services (SaaS), or commercial deployment.

### Disclaimer
This software is provided for educational and algorithmic study only. Users must strictly adhere to local passenger transport laws and official terms of service. The developers accept no liability for any usage or outcomes resulting from this tool.
