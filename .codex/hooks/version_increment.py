#!/usr/bin/env python3
"""Increment package.json once at the end of each Codex root turn."""

from __future__ import annotations

import hashlib
import fcntl
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, date
from pathlib import Path
from zoneinfo import ZoneInfo


PROJECT_START = date(2026, 6, 1)
PROJECT_TIMEZONE = ZoneInfo("Africa/Algiers")
VERSION_PATTERN = re.compile(r'("version"\s*:\s*")1\.\d+\.(\d+)(")')


def turn_marker(root: Path, turn_id: str) -> Path:
    project_key = hashlib.sha256(str(root.resolve()).encode()).hexdigest()[:16]
    turn_key = re.sub(r"[^A-Za-z0-9_.-]", "_", turn_id)
    return Path(tempfile.gettempdir()) / "saoudi-codex-version" / project_key / turn_key


def claim_turn(root: Path, turn_id: str) -> bool:
    marker = turn_marker(root, turn_id)
    marker.parent.mkdir(parents=True, exist_ok=True)
    try:
        descriptor = os.open(marker, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        return False
    os.close(descriptor)
    return True


def increment_version(package_path: Path) -> None:
    project_key = hashlib.sha256(str(package_path.parent.resolve()).encode()).hexdigest()[:16]
    lock_path = Path(tempfile.gettempdir()) / "saoudi-codex-version" / project_key / "version.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("w", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        content = package_path.read_text(encoding="utf-8")
        match = VERSION_PATTERN.search(content)
        if not match:
            raise ValueError("package.json version must use the 1.X.Y format")

        minor = max(0, (datetime.now(PROJECT_TIMEZONE).date() - PROJECT_START).days)
        patch = int(match.group(2)) + 1
        replacement = f'{match.group(1)}1.{minor}.{patch}{match.group(3)}'
        updated = content[: match.start()] + replacement + content[match.end() :]

        temporary = package_path.with_suffix(f".json.codex-version-{os.getpid()}.tmp")
        temporary.write_text(updated, encoding="utf-8")
        temporary.replace(package_path)


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        print(json.dumps({}))
        return 0

    if event.get("stop_hook_active") is True:
        print(json.dumps({}))
        return 0

    cwd = Path(str(event.get("cwd") or Path.cwd()))
    root_result = subprocess.run(
        ["git", "-C", str(cwd), "rev-parse", "--show-toplevel"],
        check=False,
        capture_output=True,
        text=True,
    )
    root = Path(root_result.stdout.strip()) if root_result.returncode == 0 else cwd
    package_path = root / "package.json"
    turn_id = str(event.get("turn_id") or "unknown-turn")

    if package_path.exists() and claim_turn(root, turn_id):
        increment_version(package_path)

    print(json.dumps({}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
