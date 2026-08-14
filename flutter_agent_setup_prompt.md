# Prompt & Scaffolding Guide: Initialize AI Agent Rules, Skills & Invariants for the Flutter Project

> **How to Use This Prompt**: Copy and paste the prompt below into the AI assistant (Antigravity, Cursor, Claude, Trae, Devin, Copilot, etc.) inside your **new/empty Flutter project repository**. It will automatically scaffold all the **Agent Operational Rules**, **Invariants**, **Skills**, **Design System Constraints**, and **Git Workflows** adapted specifically for Flutter.

---

```markdown
# Agent Initialization Prompt: `saoudi_admin_flutter`

You are an expert Flutter engineer, systems architect, and agentic assistant. You are setting up and developing the **`saoudi_admin_flutter`** project — the standalone mobile companion application for **`saoudi.online`**.

Your task is to initialize the project's agentic framework, rules, design system, skills, and configuration files to ensure the highest standards of code quality, absolute design consistency, and lifecycle automation.

---

## 🎯 Project Overview & Mission

- **App Name**: `saoudi_admin_flutter`
- **Platform**: Flutter (Android & iOS)
- **Target OS & Runtime**: Dart 3.x, Flutter 3.29+, Material 3
- **Primary Mission**: A standalone mobile administration and telemetry dashboard tracking the 3 core overview systems of `saoudi.online`:
  1. **Admin Emails Access Control** (`accepted_admin_emails` Firestore collection)
  2. **System Audit Logs & Telemetry** (`system_logs` Firestore collection)
  3. **Admin Tasks & Todos Hub** (`admin_todos` Firestore collection)
  4. **Overview Dashboard Metrics** (Firestore aggregate counts & `configuration/static_data`)
- **Backend Architecture**: Direct Cloud Firestore and Firebase Auth integration (`cloud_firestore`, `firebase_auth`, `google_sign_in`). No HTTP API proxies.

---

## 📁 Required Directory Map & Structure

Create and adhere strictly to the following directory structure:

```
saoudi_admin_flutter/
├── .agents/
│   ├── rules/
│   │   ├── architecture.md           # Clean architecture, state management & direct Firebase rules
│   │   ├── coding-standards.md       # Dart conventions, immutability, lints & model validation
│   │   ├── design-system.md          # Material 3 Dark theme, Google palette & Absolute Shadow Ban
│   │   ├── firebase-security.md      # Firebase Auth, client role-gating & access control
│   │   ├── git-workflow.md           # Mandatory end-of-prompt verification, commit format & push
│   │   └── version-increment.md      # Automated minor (elapsed days) and patch version bump in pubspec.yaml
│   └── skills/
│       ├── flutter-m3-theming/       # Playbook for zero-shadow M3 Dark theme tokens
│       ├── firestore-streams/        # Real-time Stream and query management playbook
│       └── verification-and-release/ # Verification, static analysis, tests & silent release lifecycle
├── AGENTS.md                         # Primary agent operational guide and directory map
├── GEMINI.md                         # Detailed system invariants and architectural rules
├── analysis_options.yaml             # Strict Dart & Flutter analysis rules
├── pubspec.yaml                      # Project dependencies and version tracking (1.X.Y)
├── lib/
│   ├── core/
│   │   ├── constants/                # App constants, collections names & route paths
│   │   ├── theme/                    # AppTheme, GoogleColors, SurfaceTones & Shadow-ban rules
│   │   └── utils/                    # Date formatting, relative time, error handling
│   ├── data/
│   │   ├── models/                   # AdminTask, SystemLog, AcceptedAdminEmail, DashboardMetrics
│   │   ├── repositories/             # TasksRepository, LogsRepository, EmailsRepository
│   │   └── services/                 # FirebaseAuthService, FirestoreService
│   ├── presentation/
│   │   ├── providers/                # Riverpod state providers (auth, tasks, logs, emails, metrics)
│   │   ├── screens/                  # DashboardScreen, TasksScreen, LogsScreen, EmailsScreen, LoginScreen
│   │   └── widgets/                  # BottomNavDock, BentoMetricCard, TaskItemCard, LogItemCard, Drawers
│   └── main.dart                     # App entry point
└── test/                             # Unit, widget, and integration tests
```

---

## 🚫 Hard Invariants & Rules (Strict Parity with Web CMS)

### 1. Absolute Shadow Ban (Non-Negotiable)
- **Zero `BoxShadow`**: Never use `BoxShadow`, `elevation > 0`, `Material(elevation: ...)`, or drop-shadow filters on any widget, card, bottom sheet, appbar, or dialog.
- **Surface Elevation Expression**: Express all depth, hierarchy, and focus exclusively via:
  1. **Solid Surface Container Tones**: `#121212` canvas vs `#1D1B20` card container vs `#211F26` high container / input background.
  2. **Borders & Outlines**: `Border.all(color: Color(0xFF2B2930), width: 1.0)`.
  3. **Accent Rings & Focus**: Border highlights (e.g. `Color(0xFF8AB4F8)`).
  4. **Smooth Micro-Transforms**: Scale (`0.98` on press) and opacity transitions.

### 2. Google Brand Color Palette (M3 Dark Compliant)
```dart
class GoogleColors {
  // Google Brand Accents
  static const Color blue = Color(0xFF8AB4F8);       // Primary (#8AB4F8 / #4285F4)
  static const Color green = Color(0xFF81C784);      // Secondary / Success (#81C784 / #0F9D58)
  static const Color yellow = Color(0xFFFDD663);     // Tertiary / Warning (#FDD663 / #F9AB00)
  static const Color red = Color(0xFFF28B82);        // Error / Destructive (#F28B82 / #EA4335)

  // Material 3 Dark Surface Containers
  static const Color surface = Color(0xFF121212);           // Scaffold background
  static const Color surfaceContainer = Color(0xFF1D1B20);  // Cards & Bento panels
  static const Color surfaceContainerHigh = Color(0xFF211F26); // Inputs, active drawers & modal sheets
  static const Color border = Color(0xFF2B2930);            // Outlines and dividers

  // Typography Tones
  static const Color onSurface = Color(0xFFFFFFFF);         // Primary text
  static const Color onSurfaceVariant = Color(0xB3E6E1E5);  // Secondary text (70% opacity)
  static const Color onSurfaceMuted = Color(0x66E6E1E5);    // Subtle / placeholder (40% opacity)
}
```

### 3. Geometry Tokens
- **Bento Panels & Cards**: `BorderRadius.circular(24.0)` (M3 `rounded-3xl`)
- **Buttons, Inputs, Dialogs, Filter Chips**: `BorderRadius.circular(12.0)` (M3 `rounded-xl`)
- **Pills, Badges, Status Counters, Nav Dock**: `BorderRadius.circular(999.0)` / `const StadiumBorder()`

### 4. No Light Mode or Theme Toggles
- Dark Mode only (`#121212` background). Do not implement light theme toggles.

### 5. Mobile Sync Contract Adherence
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
name: saoudi_admin_flutter
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

## 🚀 Execution Steps: Scaffold the Agentic Environment

Now, generate the following configuration and rule files inside this project:

1. **`AGENTS.md`**: Primary agent operational guide with directory map, key commands, and constraints.
2. **`GEMINI.md`**: Complete system architecture, M3 theme specifications, and invariants.
3. **`.agents/rules/design-system.md`**: Detailed tokens, Google brand colors, and the Absolute Shadow Ban rules.
4. **`.agents/rules/architecture.md`**: Clean architecture patterns, Riverpod providers, and direct Firestore streams.
5. **`.agents/rules/coding-standards.md`**: Dart formatting, immutability, typed models, and linter rules.
6. **`.agents/rules/firebase-security.md`**: Firebase Auth, role gating, and security rules.
7. **`.agents/rules/git-workflow.md`**: Commit format (`<version> - <description>`) and automated verification.
8. **`.agents/rules/version-increment.md`**: Automated minor (elapsed days) and patch version bump logic for `pubspec.yaml`.
9. **`analysis_options.yaml`**: Strict linting rules.
10. **`lib/` core files**: `main.dart`, `core/theme/app_theme.dart`, `core/constants/colors.dart`, models, and Riverpod repositories for Tasks, Logs, Emails, and Dashboard Metrics.
```
