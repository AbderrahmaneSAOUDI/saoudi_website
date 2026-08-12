#!/usr/bin/env python3
"""Report public JavaScript emitted by a completed production build."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def repository_root(cwd: str) -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip()) if result.returncode == 0 else Path(cwd)


def public_script_locations(root: Path) -> list[str]:
    findings: list[str] = []
    output_roots = (root / "dist", root / ".vercel/output/static")
    for output_root in output_roots:
        if not output_root.exists():
            continue
        for html_file in output_root.rglob("*.html"):
            relative = html_file.relative_to(output_root)
            if "admin" in relative.parts:
                continue
            for line_number, line in enumerate(html_file.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if "<script" in line and "atob(" not in line:
                    findings.append(f"{output_root.name}/{relative}:{line_number}")
                    if len(findings) == 10:
                        return findings
    return findings


def main() -> int:
    try:
        event: dict[str, Any] = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return 0

    tool_input = event.get("tool_input") or {}
    command = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
    if not isinstance(command, str) or not re.search(r"(^|[;&|]\s*)pnpm\s+(?:run\s+)?build(\s|$)", command):
        return 0

    root = repository_root(str(event.get("cwd") or Path.cwd()))
    findings = public_script_locations(root)
    if findings:
        message = "Zero-JS validation found public <script> output: " + ", ".join(findings)
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PostToolUse",
                        "additionalContext": message,
                    }
                }
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

