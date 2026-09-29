#!/usr/bin/env python3
import json
import subprocess
import sys

def get_git_info():
    try:
        branch = subprocess.check_output(["git", "branch", "--show-current"], stderr=subprocess.DEVNULL, text=True).strip()
        commit = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], stderr=subprocess.DEVNULL, text=True).strip()
        return f"Branch: {branch} ({commit})"
    except Exception:
        return "Not in git repo"

if __name__ == "__main__":
    info = get_git_info()
    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": f"[Repository Environment] {info}"
        }
    }
    print(json.dumps(output))
