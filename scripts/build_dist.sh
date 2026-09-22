#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR" || exit 1

OUTPUT_EXE="Ry_autopilot"

echo "============================================================"
echo "  Building Railway Auto-Pilot standalone executable: $OUTPUT_EXE"
echo "============================================================"

PYINSTALLER_CMD=""

# 1. Check project virtual environment ./venv
if [ -f "$ROOT_DIR/venv/bin/pyinstaller" ]; then
    PYINSTALLER_CMD="$ROOT_DIR/venv/bin/pyinstaller"
# 2. Check system-wide pyinstaller
elif command -v pyinstaller &>/dev/null; then
    PYINSTALLER_CMD="pyinstaller"
# 3. Check user directory (~/.local/bin/pyinstaller)
elif [ -f "$HOME/.local/bin/pyinstaller" ]; then
    PYINSTALLER_CMD="$HOME/.local/bin/pyinstaller"
# 4. Check python3 module PyInstaller
elif python3 -m PyInstaller --version &>/dev/null; then
    PYINSTALLER_CMD="python3 -m PyInstaller"
fi

# 5. Fallback: If PyInstaller is not installed, install it in ./venv
if [ -z "$PYINSTALLER_CMD" ]; then
    echo "[INFO] PyInstaller not detected. Installing pyinstaller in virtual environment..."
    if [ -f "$ROOT_DIR/venv/bin/pip" ]; then
        "$ROOT_DIR/venv/bin/pip" install pyinstaller
        PYINSTALLER_CMD="$ROOT_DIR/venv/bin/pyinstaller"
    else
        python3 -m pip install --user pyinstaller
        PYINSTALLER_CMD="pyinstaller"
    fi
fi

if [ -z "$PYINSTALLER_CMD" ]; then
    echo "[ERROR] Unable to locate or automatically install PyInstaller packaging tool!"
    exit 1
fi

# 6. Build React frontend project if present
if [ -d "$ROOT_DIR/client" ] && [ -f "$ROOT_DIR/client/package.json" ]; then
    echo "[INFO] React frontend project detected. Running npm run build..."
    (cd "$ROOT_DIR/client" && npm run build)
fi

echo "[INFO] Using PyInstaller engine: $PYINSTALLER_CMD"

# Clean up previous build artifacts
rm -rf build dist "$OUTPUT_EXE.spec"

echo "[INFO] Analyzing dependencies and compiling into standalone binary (including Web assets and ddddocr models)..."

ADD_DATA_ARGS=(--add-data "app/web/static:app/web/static")
if [ -d "$ROOT_DIR/client/dist" ]; then
    ADD_DATA_ARGS+=(--add-data "client/dist:client/dist")
fi

# Execute PyInstaller build
# --add-data: Bundle frontend static web assets (app/web/static and client/dist)
# --collect-all ddddocr: Collect ONNX model weights and configuration files
$PYINSTALLER_CMD \
    --clean \
    --noconfirm \
    --onefile \
    --name "$OUTPUT_EXE" \
    "${ADD_DATA_ARGS[@]}" \
    --collect-all ddddocr \
    --hidden-import selenium \
    --hidden-import PIL \
    --hidden-import urllib3 \
    --hidden-import bs4 \
    main.py

if [ -f "dist/$OUTPUT_EXE" ]; then
    cp -f "dist/$OUTPUT_EXE" "./$OUTPUT_EXE"
    chmod 755 "./$OUTPUT_EXE"
    rm -rf build dist "$OUTPUT_EXE.spec"
    echo ""
    echo "============================================================"
    echo "  🎉 Build successful! Standalone binary created: ./$OUTPUT_EXE"
    echo "  File size: $(ls -lh "./$OUTPUT_EXE" | awk '{print $5}')"
    echo "  This binary can run completely independent of the source code:"
    echo "    ./$OUTPUT_EXE                  # Launch Web Dashboard"
    echo "    ./$OUTPUT_EXE --cli            # Launch Interactive CLI mode"
    echo "    ./$OUTPUT_EXE --port 8088      # Specify custom port"
    echo "============================================================"
else
    echo "[ERROR] Build failed: Target binary not found in dist/!"
    exit 1
fi
