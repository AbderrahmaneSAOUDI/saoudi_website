# Prompt & Scaffolding Guide: Initialize AI Agent Rules, Skills & Invariants for `saoudi_app`

> **How to Use This Prompt**: Copy and paste the markdown prompt below into your AI assistant (Antigravity, Cursor, Claude, Trae, Devin, Copilot, etc.) inside your **new/empty Flutter project repository (`saoudi_app`)**.
> 
> **Scope**: It instructs the AI assistant to **strictly initialize only the agentic infrastructure** (`.agents/`, `AGENTS.md`, `GEMINI.md`, rules, skills, and root configuration files). It explicitly **prohibits creating `lib/` source code** for now, establishing rock-solid rules and operational discipline first.

---

```markdown
# Agent Initialization Prompt: `saoudi_app`

You are an expert Flutter engineer, systems architect, and agentic assistant. You are setting up the operational environment for the **`saoudi_app`** project — the standalone mobile companion application for **`saoudi.online`**.

---

## 🎯 Primary Objective & Strict Scope Constraint

> **CRITICAL SCOPE CONSTRAINT**: 
> In this initialization phase, you must **ONLY** scaffold and create the **Agentic Infrastructure** (`.agents/`, `.agents/rules/`, `.agents/skills/`, `AGENTS.md`, `GEMINI.md`, `analysis_options.yaml`, and `pubspec.yaml`).
> **DO NOT** create any application code, UI screens, widgets, or files inside `lib/` or `test/` for now. Focus 100% on defining the rules, invariants, design tokens, skills, and automation workflows.

---

## 📱 Project Overview & Mission

- **App Name**: `saoudi_app`
- **Platform**: Flutter (Android & iOS)
- **Target OS & Runtime**: Dart 3.x, Flutter 3.29+, Material 3
- **Primary Mission**: A standalone mobile administration and telemetry dashboard tracking the 3 core overview systems of `saoudi.online`:
  1. **Admin Emails Access Control** (`accepted_admin_emails` Firestore collection)
  2. **System Audit Logs & Telemetry** (`system_logs` Firestore collection)
  3. **Admin Tasks & Todos Hub** (`admin_todos` Firestore collection)
  4. **Overview Dashboard Metrics** (Firestore aggregate counts & `configuration/static_data`)
- **Backend Architecture**: Direct Cloud Firestore and Firebase Auth integration (`cloud_firestore`, `firebase_auth`, `google_sign_in`). No HTTP API proxies.

---

## 📁 Required Directory Map & Structure (Agent Infrastructure Only)

Create and scaffold the following agent files and rule hierarchy:

```
saoudi_app/
├── .agents/
│   ├── rules/
│   │   ├── architecture.md           # Clean architecture, Riverpod state & direct Firebase rules
│   │   ├── coding-standards.md       # Dart formatting, immutability, lints & model validation
│   │   ├── design-system.md          # Material 3 Dark theme, Google palette & Absolute Shadow Ban
│   │   ├── firebase-security.md      # Firebase Auth, client role-gating & access control
│   │   ├── git-workflow.md           # Mandatory end-of-prompt verification, commit format & push
│   │   └── version-increment.md      # Automated minor (elapsed days) and patch version bump in pubspec.yaml
│   └── skills/
│       ├── flutter-m3-theming/       # Playbook for zero-shadow M3 Dark theme tokens
│       │   └── SKILL.md
│       ├── firestore-streams/        # Real-time Stream and query management playbook
│       │   └── SKILL.md
│       ├── mobile-sync-contract/     # Cross-project schema sync & changelog adherence
│       │   └── SKILL.md
│       └── verification-and-release/ # Verification, static analysis, tests & silent release lifecycle
│           └── SKILL.md
├── AGENTS.md                         # Primary agent operational guide and directory map
├── GEMINI.md                         # Detailed system invariants and architectural rules
├── analysis_options.yaml             # Strict Dart & Flutter analysis rules
└── pubspec.yaml                      # Project metadata, dependencies, and version tracking (1.X.Y)
```

*(Note: `lib/` and `test/` will be generated in subsequent development steps after this agent foundation is established).*

---

## 🚫 Hard Invariants & Rules (Strict Parity with Web CMS)

### 1. Absolute Shadow Ban (Non-Negotiable)
- **Zero `BoxShadow`**: Never use `BoxShadow`, `elevation > 0`, `Material(elevation: ...)`, or drop-shadow filters on any widget, card, bottom sheet, appbar, or dialog.
- **Surface Elevation Expression**: Express all depth, hierarchy, and focus exclusively via:
  1. **Solid Surface Container Tones**: `#121212` canvas vs `#1D1B20` card container vs `#211F26` high container / input background.
  2. **Borders & Outlines**: `Border.all(color: Color(0xFF2B2930), width: 1.0)`.
  3. **Accent Rings & Focus**: Border highlights (e.g. `Color(0xFF8AB4F8)` / `Color(0x668AB4F8)`).
  4. **Smooth Micro-Transforms**: Scale (`0.98` on press) and opacity transitions.

### 2. Google Brand Color Palette (M3 Dark Compliant)
- **Primary Accent (Google Blue)**: `#8AB4F8` / `#4285F4`
- **Secondary Accent (Google Green)**: `#81C784` / `#0F9D58`
- **Tertiary Accent (Google Yellow)**: `#FDD663` / `#F9AB00`
- **Error / Alert (Google Red)**: `#F28B82` / `#EA4335`
- **Canvas / Scaffold**: `#121212`
- **Surface Container (Cards)**: `#1D1B20` / `#1E1E1E`
- **Surface Container High (Inputs/Drawers)**: `#211F26` / `#2D2D2D`
- **Borders & Dividers**: `#2B2930`
- **Text Primary**: `#FFFFFF`
- **Text Secondary (Muted)**: `#E6E1E5` (70% opacity)
- **Text Subtle**: `#E6E1E5` (40% opacity)

### 3. Geometry Tokens
- **Bento Panels & Cards**: `BorderRadius.circular(24.0)` (M3 `rounded-3xl`)
- **Buttons, Inputs, Dialogs, Filter Chips**: `BorderRadius.circular(12.0)` (M3 `rounded-xl`)
- **Pills, Badges, Status Counters, Nav Dock**: `BorderRadius.circular(999.0)` / `const StadiumBorder()`

### 4. No Light Mode or Theme Toggles
- Dark Mode only (`#121212` background). Do not implement light theme toggles or light color schemes.

### 5. Cross-Project Synchronization
- The data schemas and business rules must strictly follow `docs/mobile_sync_contract.md` from the web project.
- **Role Isolation**:
  - Primary Admin (`ADMIN_EMAIL`): Full CRUD, can purge expired logs and manage secondary admins.
  - Secondary Admin: Can view and manage only their own tasks (`createdBy == userEmail`) and view limited logs (`content`, `visitor`, `storage`, and their own `auth`/`task` events).

---

## 🛠️ Mandatory Automated Lifecycle & Git Rules

At the end of every prompt turn or task execution, you MUST execute the following sequence:

1. **Static Analysis & Testing**:
   ```bash
   flutter analyze
   flutter test
   ```
2. **Silent Version Increment (`pubspec.yaml`)**:
   - **Minor Version Formula**: `Minor Version = floor((Current Date - 2026-06-01) in days)`.
     - *Example*: If current date is `2026-08-14` (74 days since June 1, 2026), minor version is `74`.
   - **Patch Version**: Increment the patch version by `1` in `pubspec.yaml` (e.g., `1.74.0` → `1.74.1`).
   - **Silent Execution**: Do NOT mention or announce the version bump in chat responses.
3. **Commit & Push**:
   - Read the updated version from `pubspec.yaml` (e.g. `1.74.1`).
   - Format: `"<version> - <type>: <description>"` or `"<version> - <description>"`.
   - Execute:
     ```bash
     git add .
     git commit -m "<version> - <summary>"
     git push
     ```

---

## 📦 Required Dependencies (`pubspec.yaml`)

```yaml
name: saoudi_app
description: "Standalone Material 3 Dark Admin & Telemetry app for saoudi.online"
publish_to: 'none'
version: 1.74.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: ">=3.19.0"

dependencies:
  flutter:
    sdk: flutter

  # Firebase Core & Services
  firebase_core: ^3.12.1
  firebase_auth: ^5.5.1
  cloud_firestore: ^5.6.5
  google_sign_in: ^6.2.2

  # State Management & Architecture
  flutter_riverpod: ^2.6.1

  # Secure Storage
  flutter_secure_storage: ^9.2.4

  # Typography & UI Utilities
  google_fonts: ^6.2.1
  intl: ^0.20.2
  share_plus: ^10.1.4
  uuid: ^4.5.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
```

---

## 🚀 Execution Steps: Scaffold the Agentic Infrastructure Only

Proceed to generate all the agent configuration and rule files inside this project:

1. **`AGENTS.md`**: Primary operational guide containing directory map, key commands, constraints, and link references.
2. **`GEMINI.md`**: Complete system invariants, architectural principles, and M3 dark theme rules.
3. **`.agents/rules/architecture.md`**: Rules on clean architecture, Riverpod state, and direct Firestore streams.
4. **`.agents/rules/design-system.md`**: Full color token map, geometry rules, and the strict Absolute Shadow Ban.
5. **`.agents/rules/coding-standards.md`**: Dart conventions, immutability, typed models, and lint standards.
6. **`.agents/rules/firebase-security.md`**: Client-side role gating, Firebase Auth, and Firestore rules.
7. **`.agents/rules/git-workflow.md`**: Version-prefixed commit messages (`<version> - <summary>`) and automated verification.
8. **`.agents/rules/version-increment.md`**: Automated minor (elapsed days) and patch version incrementing in `pubspec.yaml`.
9. **`.agents/skills/` playbooks**:
   - `flutter-m3-theming/SKILL.md`
   - `firestore-streams/SKILL.md`
   - `mobile-sync-contract/SKILL.md`
   - `verification-and-release/SKILL.md`
10. **`analysis_options.yaml`**: Strict lint rules.
11. **`pubspec.yaml`**: Initial package configuration with the dependencies above.

*(Remember: DO NOT create any `lib/` files or app screens yet!)*
```
