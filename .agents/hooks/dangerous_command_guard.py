#!/usr/bin/env python3
"""Project & Universal PreToolUse Guardrail.
Intercepts tool calls to prevent catastrophic shell commands, accidental data loss,
and violations of saoudi.online architecture rules (e.g. package manager invariants).
"""

from __future__ import annotations
import json
import re
import sys

DANGEROUS_PATTERNS = [
    # Catastrophic system commands
    (re.compile(r'\brm\s+-[rf]{1,2}\s+[/~]'), "Blocked root or home directory deletion"),
    (re.compile(r'\bgit\s+push\s+.*--force\b.*(main|master)'), "Blocked force push to primary branch"),
    (re.compile(r'\bgit\s+reset\s+--hard\b'), "Blocked destructive git reset --hard without user approval"),
    (re.compile(r'\b(mkfs|dd\s+if=)'), "Blocked low-level drive overwrite command"),
    (re.compile(r':\(\)\s*\{\s*:\|:&\s*\};:'), "Blocked fork bomb"),

    # saoudi.online project invariants
    (re.compile(r'\bnpm\s+(install|i)\b'), "Blocked npm install: saoudi.online requires pnpm exclusively (pnpm add / pnpm install)"),
    (re.compile(r'\byarn\s+(add|install)\b'), "Blocked yarn: saoudi.online requires pnpm exclusively (pnpm add / pnpm install)"),
    (re.compile(r'\brm\s+-[rf]{1,2}\s+(src|docs)\b'), "Blocked deletion of project source code or documentation"),
    (re.compile(r'\brm\s+(\.env|\.env\.local)\b'), "Blocked deletion of environment configuration files"),
    (re.compile(r'\b(pnpm|npm|yarn)\s+(add|install)\s+.*(framer-motion|gsap|animate\.css|lottie)'), "Blocked banned animation library: saoudi.online strictly enforces zero-JS CSS animations"),
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
