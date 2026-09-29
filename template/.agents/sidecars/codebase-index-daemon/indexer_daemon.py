#!/usr/bin/env python3
"""Universal Continuous Background Codebase Index Daemon.
Maintains a fresh index of files and symbols in .agents/cache/codebase_index.json.
"""

from __future__ import annotations
import datetime
import json
import os
import sys
import time
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parents[2]
CACHE_DIR = PROJECT_ROOT / ".agents" / "cache"
INDEX_FILE = CACHE_DIR / "codebase_index.json"
LOG_FILE = CURRENT_DIR / "indexer_daemon.log"
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "5"))

PRUNE_DIRS = {
    ".git", "node_modules", "dist", "build", ".dart_tool", "venv", ".venv",
    "__pycache__", ".next", ".cache", "coverage", ".turbo", "target"
}

CODE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".dart", ".py", ".rs", ".go", ".java", ".kt", ".swift", ".c", ".cpp", ".h"
}

def log(msg: str) -> None:
    entry = f"[{datetime.datetime.now().isoformat()}] {msg}\n"
    sys.stdout.write(entry)
    sys.stdout.flush()
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
    except Exception:
        pass

def generate_index() -> dict:
    files_list = []
    total_lines = 0

    for root, dirs, files in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if d not in PRUNE_DIRS and not d.startswith(".")]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in CODE_EXTENSIONS:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = len(f.readlines())
                    total_lines += lines
                    files_list.append({"path": rel_path, "lines": lines, "ext": ext})
                except Exception:
                    pass

    return {
        "updatedAt": datetime.datetime.now().isoformat(),
        "totalFiles": len(files_list),
        "totalLines": total_lines,
        "files": sorted(files_list, key=lambda x: x["path"])
    }

def get_latest_mtime() -> float:
    latest = 0.0
    for root, dirs, files in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if d not in PRUNE_DIRS and not d.startswith(".")]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in CODE_EXTENSIONS:
                try:
                    mtime = os.path.getmtime(os.path.join(root, file))
                    if mtime > latest:
                        latest = mtime
                except Exception:
                    pass
    return latest

def main() -> None:
    log("Universal Codebase Index Daemon started.")
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    last_mtime = 0.0

    while True:
        try:
            current_mtime = get_latest_mtime()
            if current_mtime > last_mtime:
                log("Detected file modifications. Regenerating index...")
                data = generate_index()
                with open(INDEX_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                last_mtime = current_mtime
                log(f"Indexed {data['totalFiles']} files ({data['totalLines']} lines).")
        except Exception as e:
            log(f"Error indexing: {e}")

        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
