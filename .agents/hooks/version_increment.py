#!/usr/bin/env python3
"""Project-Aware Version Incrementer.
Detects package.json (with saoudi.online elapsed days minor version calculation),
as well as fallback multi-ecosystem files (pubspec.yaml, pyproject.toml, Cargo.toml, VERSION).
Increments the patch version upon substantive code edits.
"""

from __future__ import annotations
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

BASE_DATE = datetime.date(2026, 6, 1)

def get_expected_minor() -> int:
    today = datetime.date.today()
    return max(0, (today - BASE_DATE).days)

def git_has_substantive_changes(root: Path) -> bool:
    try:
        res = subprocess.run(
            ["git", "-C", str(root), "status", "--porcelain"],
            capture_output=True,
            text=True,
            check=False
        )
        lines = [line.strip() for line in res.stdout.strip().splitlines() if line.strip()]
        # Ignore if only version or lock files changed
        meaningful = [
            l for l in lines 
            if not any(v in l for v in ("package.json", "pubspec.yaml", "pyproject.toml", "Cargo.toml", "VERSION", "package-lock.json", "pubspec.lock", "pnpm-lock.yaml"))
        ]
        return len(meaningful) > 0
    except Exception:
        return False

def bump_package_json(path: Path) -> bool:
    try:
        content = path.read_text(encoding="utf-8")
        match = re.search(r'("version"\s*:\s*")(\d+)\.(\d+)\.(\d+)(")', content)
        if match:
            major = match.group(2)
            expected_minor = get_expected_minor()
            patch = int(match.group(4)) + 1
            new_val = f'{match.group(1)}{major}.{expected_minor}.{patch}{match.group(5)}'
            path.write_text(content[:match.start()] + new_val + content[match.end():], encoding="utf-8")
            return True
    except Exception:
        pass
    return False

def bump_pubspec_yaml(path: Path) -> bool:
    try:
        content = path.read_text(encoding="utf-8")
        match = re.search(r'(version:\s*)(\d+)\.(\d+)\.(\d+)(\+\d+)?', content)
        if match:
            major, minor, patch = match.group(2), match.group(3), int(match.group(4)) + 1
            build = match.group(5) or "+1"
            new_val = f'{match.group(1)}{major}.{minor}.{patch}{build}'
            path.write_text(content[:match.start()] + new_val + content[match.end():], encoding="utf-8")
            return True
    except Exception:
        pass
    return False

def bump_pyproject_toml(path: Path) -> bool:
    try:
        content = path.read_text(encoding="utf-8")
        match = re.search(r'(version\s*=\s*")(\d+)\.(\d+)\.(\d+)(")', content)
        if match:
            major, minor, patch = match.group(2), match.group(3), int(match.group(4)) + 1
            new_val = f'{match.group(1)}{major}.{minor}.{patch}{match.group(5)}'
            path.write_text(content[:match.start()] + new_val + content[match.end():], encoding="utf-8")
            return True
    except Exception:
        pass
    return False

def bump_cargo_toml(path: Path) -> bool:
    try:
        content = path.read_text(encoding="utf-8")
        match = re.search(r'(\[package\][^\[]*version\s*=\s*")(\d+)\.(\d+)\.(\d+)(")', content)
        if match:
            prefix, major, minor, patch, suffix = match.group(1), match.group(2), match.group(3), int(match.group(4)) + 1, match.group(5)
            new_val = f'{prefix}{major}.{minor}.{patch}{suffix}'
            path.write_text(content[:match.start()] + new_val + content[match.end():], encoding="utf-8")
            return True
    except Exception:
        pass
    return False

def bump_version_txt(path: Path) -> bool:
    try:
        content = path.read_text(encoding="utf-8").strip()
        match = re.match(r'^(\d+)\.(\d+)\.(\d+)$', content)
        if match:
            major, minor, patch = match.group(1), match.group(2), int(match.group(3)) + 1
            path.write_text(f"{major}.{minor}.{patch}\n", encoding="utf-8")
            return True
    except Exception:
        pass
    return False

def main() -> int:
    try:
        event = json.load(sys.stdin)
    except Exception:
        event = {}

    root = Path.cwd()
    if not git_has_substantive_changes(root):
        print(json.dumps({}))
        return 0

    if (root / "package.json").exists():
        bump_package_json(root / "package.json")
    elif (root / "pubspec.yaml").exists():
        bump_pubspec_yaml(root / "pubspec.yaml")
    elif (root / "pyproject.toml").exists():
        bump_pyproject_toml(root / "pyproject.toml")
    elif (root / "Cargo.toml").exists():
        bump_cargo_toml(root / "Cargo.toml")
    elif (root / "VERSION").exists():
        bump_version_txt(root / "VERSION")

    print(json.dumps({}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
