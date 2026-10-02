INSTALL_DIR := $(HOME)/.local/bin
TARGET_BIN  := Ry_autopilot
PYTHON      := $(shell if [ -f "./venv/bin/python3" ]; then echo "./venv/bin/python3"; elif command -v python3 >/dev/null 2>&1; then echo "python3"; else echo "python"; fi)

.PHONY: all dist run install uninstall clean

all: dist

dist:
	@$(PYTHON) scripts/build_dist.py

run:
	@if [ -f "./$(TARGET_BIN)" ] && [ -x "./$(TARGET_BIN)" ]; then \
		./$(TARGET_BIN) $(ARGS); \
	else \
		bash ./run.sh $(ARGS); \
	fi

install:
	@if [ ! -f $(TARGET_BIN) ] || [ ! -x $(TARGET_BIN) ]; then \
		echo "Binary $(TARGET_BIN) not found. Building with 'make dist'..."; \
		$(MAKE) dist; \
	fi
	@mkdir -p $(INSTALL_DIR)
	@cp -f $(TARGET_BIN) $(INSTALL_DIR)/$(TARGET_BIN)
	@chmod 755 $(INSTALL_DIR)/$(TARGET_BIN)
	@echo "Successfully installed $(TARGET_BIN) to $(INSTALL_DIR)/$(TARGET_BIN)"
	@echo "You can now run '$(TARGET_BIN)' from any directory!"

uninstall:
	@if [ -f $(INSTALL_DIR)/$(TARGET_BIN) ]; then \
		rm -f $(INSTALL_DIR)/$(TARGET_BIN); \
		echo "Removed $(TARGET_BIN) from $(INSTALL_DIR)"; \
	fi

clean: uninstall
	@rm -rf $(TARGET_BIN) build/ dist/ *.spec __pycache__ app/__pycache__ app/web/__pycache__
	@echo "Clean completed (including uninstallation of $(TARGET_BIN))."
