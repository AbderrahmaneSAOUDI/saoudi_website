# Turnkey Agentic Project Template

This template contains everything needed to make AI coding agents (Google Antigravity, Cursor, Codex, Claude Code, Windsurf) work **fast**, **smart**, and **safely** with automated versioning, file naming standards, lifecycle hooks, and autonomous background daemons.

---

## How to Use in Any New Project

Simply copy the entire contents of this `template` directory into the root of your new project:

```bash
# From your new project root:
cp -r /home/saoudi26/Documents/GitHub/.aagents/template/. .
```

Or using an rsync command:
```bash
rsync -av /home/saoudi26/Documents/GitHub/.aagents/template/ /path/to/my-new-project/
```

---

## What Is Included in This Template

```text
<project-root>/
├── .agents/
│   ├── rules/                        # Persistent operational guidelines & standards
│   │   ├── speed-and-efficiency.md   # Parallel lookups, no re-reading, zero polling
│   │   ├── file-naming-and-structure.md # Layer prefixes (c_, view_, mod_, srv_, vm_), SRP
│   │   ├── versioning-and-git.md     # Silent patch auto-increment, SemVer triad
│   │   ├── code-quality-and-safety.md # Defensive coding, decoupled UI, preserve docs
│   │   └── git-workflow.md           # Branching conventions & conventional commits
│   │
│   ├── hooks/                        # Deterministic lifecycle hooks
│   │   ├── dangerous_command_guard.py # PreToolUse guard blocking destructive commands
│   │   ├── version_increment.py      # Multi-ecosystem patch auto-bumper (JS, Dart, Python, Rust)
│   │   ├── session_start.py          # Environment reporter on session init
│   │   └── *.sh                      # Executable wrappers for agent environments
│   ├── hooks.json                    # Hook registration file
│   │
│   ├── skills/                       # On-demand agent capability runbooks
│   │   ├── create-rule/              # Scaffold new project rules
│   │   ├── create-skill/             # Scaffold new project skills
│   │   ├── create-hook/              # Scaffold new hooks
│   │   ├── verification-and-release/ # Lint, test, and release verification checklist
│   │   ├── feature-development/      # End-to-end feature scaffolding guide
│   │   ├── debugging/                # Systematic bug reproduction & surgical fix
│   │   ├── caveman-commit/           # High-efficiency conventional commit generator
│   │   └── caveman-review/           # Ultra-compact code review tool
│   │
│   └── sidecars/                     # Autonomous background daemons
│       ├── codebase-index-daemon/    # Background symbol & file indexer
│       └── test-daemon/              # Background test watcher runner
│
├── AGENTS.md                         # Unified operational contract for modern agents
├── GEMINI.md                         # Contract mirror for Antigravity & Gemini agents
└── README.md                         # This documentation guide
```

---

## Key Features

### 1. High Speed & Token Efficiency
- **Parallel Tool Calling**: The agent is mandated to view files and search symbols concurrently in one turn.
- **Strict No Re-Reading**: Prevents the agent from re-reading files it has already seen, saving 60%+ turn latency.
- **Single-Pass Edits**: Applies all changes in a single turn instead of fragmented multi-turn edits.

### 2. Multi-Ecosystem Version Incrementing
The included [`version_increment.py`](./.agents/hooks/version_increment.py) automatically recognizes:
- `package.json` (JavaScript / TypeScript / Node.js)
- `pubspec.yaml` (Flutter / Dart)
- `pyproject.toml` (Python)
- `Cargo.toml` (Rust)
- `VERSION` (Plain text fallback)

It checks if tracked files were modified in Git and silently increments the patch version (`X.Y.Z` -> `X.Y.Z+1`).

### 3. Safety Guardrails
[`dangerous_command_guard.py`](./.agents/hooks/dangerous_command_guard.py) intercepts shell executions and denies destructive operations such as `rm -rf /`, force-pushing to `main`, or untracked hard resets.

### 4. Background Daemons (Sidecars)
- **`codebase-index-daemon`**: Continuously monitors the repository and updates `.agents/cache/codebase_index.json` so agents know the full project layout instantly.
- **`test-daemon`**: Automatically runs targeted tests when code files change.
