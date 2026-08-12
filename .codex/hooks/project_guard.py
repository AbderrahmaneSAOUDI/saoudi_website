#!/usr/bin/env python3
"""Codex PreToolUse guard for saoudi.online.

The hook receives one JSON event on stdin. It blocks known destructive commands,
prohibited dependency-manager usage, and clear architecture violations in file
patches. It also performs lightweight repository checks before a production build.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


def advise(message: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "additionalContext": message,
                }
            }
        )
    )


def repository_root(cwd: str) -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        return Path(result.stdout.strip())
    return Path(cwd)


def validate_before_build(root: Path) -> list[str]:
    errors: list[str] = []
    config = root / "astro.config.mjs"
    config_text = config.read_text(encoding="utf-8") if config.exists() else ""

    if not re.search(r"output\s*:\s*['\"]server['\"]", config_text):
        errors.append("astro.config.mjs must keep output: 'server'")
    if not re.search(r"adapter\s*:\s*vercel\s*\(", config_text):
        errors.append("astro.config.mjs must keep the Vercel adapter")
    if not re.search(r"plugins\s*:\s*\[[^\]]*tailwindcss\s*\(", config_text, re.S):
        errors.append("astro.config.mjs must keep tailwindcss() in vite.plugins")

    legacy_admin = root / "src/pages/admin.astro"
    indexed_admin = root / "src/pages/admin/index.astro"
    if legacy_admin.exists() and indexed_admin.exists():
        errors.append("src/pages/admin.astro collides with src/pages/admin/index.astro")

    global_css = root / "src/styles/global.css"
    css_text = global_css.read_text(encoding="utf-8") if global_css.exists() else ""
    for required in ('@import "tailwindcss"', "@theme", "background_animation.css"):
        if required not in css_text:
            errors.append(f"src/styles/global.css must contain {required}")

    return errors


def guard_command(command: str, root: Path) -> str | None:
    normalized = " ".join(command.strip().split())
    blocked: tuple[tuple[str, str], ...] = (
        (r"(^|[;&|]\s*)npm\s+(install|i)(\s|$)", "Use pnpm instead of npm."),
        (r"(^|[;&|]\s*)yarn\s+(add|install)(\s|$)", "Use pnpm instead of Yarn."),
        (r"(^|[;&|]\s*)rm\s+(-[^ ]*r[^ ]*f?|-[^ ]*f[^ ]*r)\s+(\./)?src(/|\s|$)", "Deleting src is prohibited."),
        (r"(^|[;&|]\s*)rm\s+(?:-[^ ]+\s+)?\.env(\s|$)", "Deleting .env is prohibited."),
        (r"astro\s+build[^;&|]*(--output(?:=|\s+)(static|hybrid))", "Astro must remain in SSR server mode."),
        (r"pnpm\s+add[^;&|]*(framer-motion|gsap|animate\.css|lottie|masonry-layout)", "That dependency is prohibited by the project architecture."),
    )
    for pattern, reason in blocked:
        if re.search(pattern, normalized, re.I):
            return reason

    if re.search(r"(^|[;&|]\s*)pnpm\s+(run\s+)?build(\s|$)", normalized):
        errors = validate_before_build(root)
        if errors:
            return "Pre-build validation failed: " + "; ".join(errors)

    if re.search(r"(^|[;&|]\s*)(vercel(?:\s+(?:deploy|--prod))?|pnpm\s+run\s+deploy)(\s|$)", normalized):
        required = (
            "FIREBASE_PROJECT_ID",
            "FIREBASE_CLIENT_EMAIL",
            "FIREBASE_PRIVATE_KEY",
            "FIREBASE_STORAGE_BUCKET",
            "ADMIN_EMAIL",
            "GOOGLE_CLIENT_ID",
        )
        missing = [name for name in required if not os.environ.get(name)]
        if missing:
            return "Deployment environment is missing: " + ", ".join(missing)
    return None


def command_advice(command: str) -> str | None:
    normalized = " ".join(command.strip().split())
    if re.search(r"(^|[;&|]\s*)npx(\s|$)", normalized):
        return "Project policy prefers `pnpm dlx` over `npx`."
    if re.search(r"(^|[;&|]\s*)rm\s+(-[^ ]*r[^ ]*)\s+(\./)?node_modules(/|\s|$)", normalized):
        return "Consider `pnpm install` before deleting node_modules."
    if re.search(r"pnpm\s+add[^;&|]*(firebase|@tanstack/react-query|\bswr\b)", normalized):
        return "Confirm this client dependency is used only in admin code and never on public routes."
    return None


def added_lines(patch: str) -> str:
    return "\n".join(
        line[1:]
        for line in patch.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    )


def patched_files(patch: str) -> list[str]:
    return re.findall(r"^\*\*\* (?:Add|Update|Delete) File: (.+)$", patch, re.M)


def added_files(patch: str) -> list[str]:
    return re.findall(r"^\*\*\* Add File: (.+)$", patch, re.M)


def guard_patch(patch: str) -> str | None:
    files = patched_files(patch)
    additions = added_lines(patch)

    if any(path.endswith("astro.config.mjs") for path in files):
        if re.search(r"output\s*:\s*['\"](?:static|hybrid)['\"]", additions):
            return "Astro must remain in output: 'server' mode."

    public_pages = [
        path
        for path in files
        if re.search(r"(^|/)src/pages/[^/]+\.astro$", path)
    ]
    if public_pages:
        if re.search(r"client:(?:load|visible|idle|only)", additions):
            return "Client directives are prohibited on public Astro routes."
        if re.search(r"from\s+['\"]firebase/(?:app|firestore|auth|storage)['\"]", additions):
            return "The Firebase Client SDK is prohibited on public routes."
        if re.search(r"\b(?:fetch|XMLHttpRequest|onSnapshot)\s*\(", additions):
            return "Browser data fetching and real-time listeners are prohibited on public routes."
        if "<script" in additions and "atob(" not in additions:
            return "Public routes may not add scripts except the minimal inline contact decoder."

    added_admin_pages = [
        path
        for path in files
        if re.search(r"(^|/)src/pages/admin/[^/]+\.(?:astro|ts)$", path)
        and Path(path).name != "index.astro"
    ]
    for path in added_admin_pages:
        if not Path(path).name.startswith("admin_"):
            return "Admin page and endpoint filenames must use the admin_ prefix."

    if any(path.endswith("package.json") for path in files):
        if re.search(r'"(?:framer-motion|gsap|animate\.css|lottie[^\"]*|masonry-layout)"\s*:', additions):
            return "The proposed dependency is prohibited by the project architecture."

    if any(Path(path).name == ".env" for path in files):
        return "Codex must not create, modify, or delete .env. Update .env.example without secrets instead."

    if any(path.endswith(("firestore.rules", "storage.rules")) for path in files):
        if re.search(r"request\.auth\.token\.email|allow\s+write\s*:\s*if\s+(?:true|request\.auth\s*!=\s*null)", additions):
            return "Firebase rules must authorize writes by admin UID and may not use broad or email-based write access."

    client_files = [
        path
        for path in files
        if re.search(r"(^|/)src/(?:components|pages)/(?!admin/).+\.(?:astro|tsx?|jsx?)$", path)
    ]
    if client_files and re.search(r"FIREBASE_(?:PROJECT_ID|CLIENT_EMAIL|PRIVATE_KEY|STORAGE_BUCKET)|ADMIN_EMAIL", additions):
        return "Server-only Firebase and admin environment variables may not be exposed in public code."

    return None


def patch_advice(patch: str) -> str | None:
    files = patched_files(patch)
    new_files = added_files(patch)
    additions = added_lines(patch)
    public_files = [
        path for path in files if re.search(r"(^|/)src/(?:components|pages)/(?!admin/).+\.(?:astro|tsx?)$", path)
    ]
    if public_files and re.search(r"(?:mailto:|tel:|t\.me/|wa\.me/)", additions, re.I):
        return "Public Email, Telegram, and WhatsApp values must be Base64-obfuscated and decoded only on user intent."
    if public_files and "<img" in additions and not re.search(r"aspect-(?:video|square|\[)|aspect-ratio", additions):
        return "Dynamic image wrappers should declare an explicit aspect ratio to prevent layout shift."
    new_admin_pages = [path for path in new_files if re.search(r"(^|/)src/pages/admin/.+\.astro$", path)]
    if new_admin_pages and "BackgroundBaseLayout" not in additions:
        return "New admin pages should use BackgroundBaseLayout and rely on the protected /admin route boundary."
    noncanonical_collections = [
        name
        for name in re.findall(r"\.collection\(\s*['\"]([^'\"]+)['\"]\s*\)", additions)
        if name not in {"configuration", "entries"}
    ]
    if noncanonical_collections:
        names = ", ".join(sorted(set(noncanonical_collections)))
        return f"Devin's flat-schema rule permits only configuration and entries; reconcile new use of: {names}."
    if any(path.endswith("src/types.ts") for path in files):
        invalid_types = [
            name
            for name in re.findall(r"type\s*:\s*['\"]([^'\"]+)['\"]", additions)
            if name not in {"project", "experience", "volunteering", "certificate"}
        ]
        if invalid_types:
            return "Devin's entry-type rule permits project, experience, volunteering, and certificate only."
        return "Keep Zod schemas, TypeScript interfaces, type guards, and the README schema documentation synchronized."
    return None


def main() -> int:
    try:
        event: dict[str, Any] = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return 0

    tool_name = str(event.get("tool_name", ""))
    tool_input = event.get("tool_input") or {}
    command = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
    command = command if isinstance(command, str) else ""
    root = repository_root(str(event.get("cwd") or Path.cwd()))

    reason: str | None = None
    if tool_name == "Bash":
        reason = guard_command(command, root)
    elif tool_name in {"apply_patch", "Edit", "Write"}:
        reason = guard_patch(command)

    if reason:
        deny(reason)
    elif tool_name == "Bash":
        message = command_advice(command)
        if message:
            advise(message)
    elif tool_name in {"apply_patch", "Edit", "Write"}:
        message = patch_advice(command)
        if message:
            advise(message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
