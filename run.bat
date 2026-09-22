@echo off
chcp 65001 >nul
title Railway Auto-Pilot

cd /d "%~dp0"

echo ============================================================
echo   Railway Auto-Pilot
echo   Initializing runtime environment...
echo ============================================================

REM Check Python virtual environment
if not exist "venv\Scripts\python.exe" (
    echo [!] Virtual environment not found. Creating venv...
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        py -3 -m venv venv
    ) else (
        where python >nul 2>nul
        if %errorlevel% equ 0 (
            python -m venv venv
        ) else (
            echo [X] Error: Python is not installed or not in PATH!
            echo Please install Python 3.10+ from https://www.python.org and check "Add Python to PATH".
            pause
            exit /b 1
        )
    )
    echo [*] Installing dependencies (requirements.txt)...
    venv\Scripts\pip install -r requirements.txt
)

REM Build React frontend SPA if client/dist is not present and npm is available
if not exist "client\dist\index.html" if exist "client" (
    where npm >nul 2>nul
    if %errorlevel% equ 0 (
        echo [!] client\dist not found. Automatically building React frontend...
        pushd client
        call npm install
        call npm run build
        popd
    )
)

set PYTHONPATH=.
echo [*] Starting Web dashboard server and opening browser...
venv\Scripts\python.exe main.py %*

if %errorlevel% neq 0 (
    echo.
    echo [!] Program terminated or encountered an error (Exit code: %errorlevel%)
    pause
)
