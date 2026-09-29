#!/usr/bin/env python3
"""Universal PreToolUse Guardrail.
Intercepts tool calls to prevent catastrophic shell commands and accidental data loss.
"""

from __future__ import annotations
import json
import re
import sys

DANGEROUS_PATTERNS = [
    (re.compile(r'\brm\s+-[rf]{1,2}\s+[/~]'), "Blocked root or home directory deletion"),
    (re.compile(r'\bgit\s+push\s+.*--force\b.*(main|master)'), "Blocked force push to primary branch"),
    (re.compile(r'\bgit\s+reset\s+--hard\b'), "Blocked destructive git reset --hard without user approval"),
    (re.compile(r'\b(mkfs|dd\s+if=)'), "Blocked low-level drive overwrite command"),
    (re.compile(r':\(\)\s*\{\s*:\|:&\s*\};:'), "Blocked fork bomb"),
]

def deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason
        }
    }))
    sys.exit(0)

def main() -> int:
    try:
        event = json.load(sys.stdin)
    except Exception:
        print(json.dumps({}))
        return 0

    tool_call = event.get("tool_call") or {}
    tool_name = tool_call.get("name", "")
    args = tool_call.get("arguments", {})

    if tool_name in ("run_command", "execute_command", "terminal", "bash"):
        cmd = args.get("CommandLine") or args.get("command") or ""
        for pattern, reason in DANGEROUS_PATTERNS:
            if pattern.search(cmd):
                deny(reason)

    print(json.dumps({}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
