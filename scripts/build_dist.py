#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cross-platform Standalone Build Script for Railway Auto-Pilot (Ry_autopilot)
Supports Linux (x86_64, aarch64), macOS (Apple Silicon), and Windows.
"""

import os
import shutil
import subprocess
import sys

# Ensure UTF-8 output on all platforms (especially Windows CP1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def run_command(cmd, cwd=None, env=None):
    # Only use shell if cmd is a raw string; when passing a list, direct execution avoids shell delimiter issues
    use_shell = isinstance(cmd, str)
    print(f"[EXEC] Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(cmd, cwd=cwd, env=env, shell=use_shell)
    if res.returncode != 0:
        print(f"[ERROR] Command failed with exit code {res.returncode}")
        sys.exit(res.returncode)


def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    os.chdir(root_dir)

    is_win = sys.platform == "win32"
    exe_name = "Ry_autopilot.exe" if is_win else "Ry_autopilot"
    sep = ";" if is_win else ":"

    print("=" * 60)
    print(f"  Building Railway Auto-Pilot standalone executable: {exe_name}")
    print(f"  Target Platform: {sys.platform}")
    print("=" * 60)

    # 1. Build React frontend if present
    client_dir = os.path.join(root_dir, "client")
    if os.path.isdir(client_dir) and os.path.isfile(os.path.join(client_dir, "package.json")):
        dist_dir = os.path.join(client_dir, "dist")
        if not os.path.exists(dist_dir) or os.getenv("FORCE_BUILD_FRONTEND", "0") == "1":
            print("[INFO] Building React frontend...")
            npm_cmd = "npm.cmd" if is_win else "npm"
            node_modules = os.path.join(client_dir, "node_modules")
            if not os.path.exists(node_modules):
                print("[INFO] Installing frontend dependencies (npm install)...")
                run_command([npm_cmd, "install"], cwd=client_dir)
            print("[INFO] Compiling React static assets (npm run build)...")
            run_command([npm_cmd, "run", "build"], cwd=client_dir)
        else:
            print("[INFO] React frontend dist already exists. Skipping rebuild.")

    # 2. Prepare PyInstaller arguments with normalized paths
    static_src = os.path.normpath("app/web/static")
    client_src = os.path.normpath("client/dist")

    static_data = f"{static_src}{sep}{static_src}"
    client_data = f"{client_src}{sep}{client_src}"

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--clean",
        "--noconfirm",
        "--onefile",
        "--name",
        "Ry_autopilot",
        "--add-data",
        static_data,
    ]

    if os.path.isdir(os.path.join(root_dir, client_src)):
        cmd.extend(["--add-data", client_data])

    cmd.extend([
        "--collect-all",
        "ddddocr",
        "--collect-all",
        "onnxruntime",
        "--hidden-import",
        "selenium",
        "--hidden-import",
        "PIL",
        "--hidden-import",
        "urllib3",
        "--hidden-import",
        "bs4",
        "main.py",
    ])

    # Clean previous build artifacts
    for p in ["build", "dist", "Ry_autopilot.spec"]:
        if os.path.exists(p):
            if os.path.isdir(p):
                shutil.rmtree(p)
            else:
                os.remove(p)

    # 3. Run PyInstaller
    run_command(cmd, cwd=root_dir)

    # 4. Verify output
    dist_output = os.path.join(root_dir, "dist", exe_name)
    final_output = os.path.join(root_dir, exe_name)

    if os.path.isfile(dist_output):
        shutil.copy2(dist_output, final_output)
        if not is_win:
            os.chmod(final_output, 0o755)
        # Clean build directories
        shutil.rmtree("build", ignore_errors=True)
        shutil.rmtree("dist", ignore_errors=True)
        if os.path.exists("Ry_autopilot.spec"):
            os.remove("Ry_autopilot.spec")

        size_mb = os.path.getsize(final_output) / (1024 * 1024)
        print("\n" + "=" * 60)
        print(f"  [SUCCESS] Build successful! Standalone binary: ./{exe_name}")
        print(f"  File size: {size_mb:.1f} MB")
        print("=" * 60)
    else:
        print(f"[ERROR] Target binary not found at {dist_output}")
        sys.exit(1)


if __name__ == "__main__":
    main()
