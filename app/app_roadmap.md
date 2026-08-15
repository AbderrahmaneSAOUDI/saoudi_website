# 📱 Step-by-Step Flutter App Development Roadmap (`saoudi_app`)

This roadmap details the exact step-by-step implementation plan for building **`saoudi_app`** (the standalone mobile companion for `saoudi.online`). Each phase is designed to be self-contained, testable, and strictly aligned with the web platform's Material 3 Dark theme, Google color palette, and **Absolute Shadow Ban**.

---

## 🗺️ Roadmap Milestone Overview

```text
Phase 1: Visual Foundation & Theme
  ├── Step 1.1: Color Palette & M3 Theme Tokens
  └── Step 1.2: Ambient Background Motion (Google Points + Star Grid)

Phase 2: Authentication & Security Flow
  ├── Step 2.1: Google Sign-In & Firebase Auth Setup
  ├── Step 2.2: Pixel-Perfect Login Screen (Web Parity)
  ├── Step 2.3: Role-Gating & Access Evaluation Logic
  └── Step 2.4: Persistent Auto-Login & Splash Route Guard

Phase 3: Core Navigation Shell
  ├── Step 3.1: Floating Pill Navigation Dock (AdminNavDock)
  └── Step 3.2: App Shell, Route Transitions & Scaffold

Phase 4: Dashboard & Telemetry Overview
  ├── Step 4.1: Live Aggregate Metric Counts (Bento Grid)
  └── Step 4.2: Quick Action & Status Indicators

Phase 5: Admin Tasks System (admin_todos)
  ├── Step 5.1: Real-Time Stream & Status Filter Tabs (Active/Done/Archive)
  ├── Step 5.2: Task Card UI with Category/Priority Badges
  └── Step 5.3: Task Action Drawer (Create, Toggle, Archive, Delete)

Phase 6: System Audit Logs & Telemetry (system_logs)
  ├── Step 6.1: Live Telemetry Stream & Category Filters
  ├── Step 6.2: Search Bar & Severity Indicator Strips
  ├── Step 6.3: Expandable Log Payload Inspector
  └── Step 6.4: Retention Purge Action (Owner Only)

Phase 7: Admin Emails Access Control (accepted_admin_emails)
  ├── Step 7.1: Real-Time Admin Access List Stream
  ├── Step 7.2: Primary vs Secondary Badge & Status
  └── Step 7.3: Grant & Revoke Access Modal Dialogs

Phase 8: Polish, Optimizations & Release
  ├── Step 8.1: Network Reconnection & Offline UX
  ├── Step 8.2: Haptic Feedback & Smooth Micro-Transitions
  └── Step 8.3: Automated Verification, Static Analysis & Build
```

---

## 🛠️ Detailed Implementation Steps

---

### 🎨 Phase 1: Visual Foundation & Theme

#### Step 1.1: Color Palette & Theme Tokens

- **Files**: `lib/core/theme/colors.dart`, `lib/core/theme/app_theme.dart`
- **Objective**: Establish the non-negotiable Material 3 Dark baseline and Google brand colors.
- **Key Invariants**:
  - `BoxShadow` and `elevation > 0` are **strictly prohibited**.
  - Canvas background: `#121212`.
  - Surface containers: `#1D1B20` (cards), `#211F26` (inputs/sheets).
  - Outlines & borders: `#2B2930`.
  - Accents: Google Blue (`#8AB4F8`), Google Green (`#81C784`), Google Yellow (`#FDD663`), Google Red (`#F28B82`).
  - Font: Google Sans (via `google_fonts`).

#### Step 1.2: Ambient Background Motion Widget

- **File**: `lib/presentation/common/ambient_background.dart`
- **Objective**: Replicate the exact web CSS background animation (`bgPoints` + `bgStars` from `src/styles/background_animation.css`).
- **Implementation**:
  - A `CustomPainter` with two layers:
    1. **Floating Google Color Points**: Drifting subtle radial points in blue, green, yellow, and red with 48s loop period.
    2. **Star/Dot Grid**: Repeating micro-dot constellation grid with subtle translation.
  - Wrap entire app shell with `AmbientBackground(child: child)`.
  - Disable or freeze when `prefers-reduced-motion` is active to preserve GPU and battery.

---

### 🔐 Phase 2: Authentication & Security Flow

#### Step 2.1: Google Sign-In & Firebase Auth Repository

- **Files**: `lib/data/repositories/auth_repository.dart`, `lib/data/services/firebase_auth_service.dart`
- **Objective**: Authenticate users using Google Sign-In and obtain Firebase Auth User credentials.

#### Step 2.2: Pixel-Perfect Login Screen

- **File**: `lib/presentation/auth/login_screen.dart`
- **Objective**: Visual replica of `src/pages/admin/admin_login.astro`.
- **UI Elements**:
  - Centered M3 Card (`#1D1B20` container, `#2B2930` border, `BorderRadius.circular(24)`).
  - App Logo icon (`assets/images/logo.png` / `favicon.svg`) with primary blue glow.
  - "saoudi.online" header with white bold typography.
  - Google Sign-In button styled as an M3 Pill (`BorderRadius.circular(999)`).

#### Step 2.3: Role-Gating & Access Control Logic

- **File**: `lib/presentation/auth/auth_controller.dart`
- **Objective**:
  1. On login, check if `user.email.toLowerCase() == PRIMARY_ADMIN_EMAIL`. If true → Role: **Primary Admin / Owner**.
  2. If not owner, query Firestore collection `accepted_admin_emails/{user.email}`. If exists → Role: **Secondary Admin**.
  3. If not found in either → **Reject access**, sign out immediately, display error toast, and write an unauthorized attempt log to `system_logs`.

#### Step 2.4: Persistent Auto-Login & Splash Guard

- **File**: `lib/presentation/auth/splash_screen.dart`
- **Objective**: Listen to `FirebaseAuth.instance.authStateChanges()`. If user is already authenticated and validated, seamlessly direct them to `DashboardScreen`; otherwise show `LoginScreen`.

---

### 🧭 Phase 3: Core Navigation Shell

#### Step 3.1: Floating Pill Navigation Dock (`NavDock`)

- **File**: `lib/presentation/navigation/nav_dock.dart`
- **Objective**: Floating bottom navigation bar matching `src/components/admin/AdminNavDock.astro`.
- **Specifications**:
  - Container with `BorderRadius.circular(32)`, background `#1D1B20`, border `#2B2930`.
  - Tab items:
    1. **Overview / Dashboard** (`Icons.dashboard_rounded`)
    2. **Tasks** (`Icons.task_alt_rounded` with badge count for active tasks)
    3. **Logs** (`Icons.receipt_long_rounded` with red indicator for unhandled errors)
    4. **Admin Emails** (`Icons.admin_panel_settings_rounded`)
    5. **Settings & Profile** (`Icons.settings_rounded`)

#### Step 3.2: App Shell Scaffold

- **File**: `lib/presentation/navigation/app_shell.dart`
- **Objective**: Manages tab switching with `IndexedStack` or `PageView` to preserve scroll positions and avoid rebuilding streams.

---

### 📊 Phase 4: Dashboard & Telemetry Overview

#### Step 4.1: Live Aggregate Metric Counts (Bento Grid)

- **Files**: `lib/presentation/dashboard/dashboard_screen.dart`, `lib/presentation/dashboard/widgets/bento_stat_card.dart`
- **Objective**: Live 2x2 Bento grid showing counts for:
  - Projects, Experience, Designs, Certifications, Services, Active Tasks, and Resume Downloads.
  - Uses Firestore aggregate queries (`count().get()`).

#### Step 4.2: Quick Telemetry & Health Strips

- **Objective**: Display connection status ("Connected" / "Degraded") and high-priority task count cards.

---

### 📋 Phase 5: Admin Tasks System (`admin_todos`)

#### Step 5.1: Real-Time Stream & Status Filter Tabs

- **Files**: `lib/data/repositories/tasks_repository.dart`, `lib/presentation/tasks/tasks_screen.dart`
- **Objective**:
  - Real-time Firestore stream (`snapshots()`) ordered by `createdAt desc`.
  - Filter segmented tabs: **Active**, **Completed**, **Archived** with count pills.
  - Role-gated filtering: Secondary admins see only their own tasks (`createdBy == userEmail`).

#### Step 5.2: Task Item Card UI

- **File**: `lib/presentation/tasks/widgets/task_card.dart`
- **Elements**:
  - Color-coded Category Pill (Feature=Blue, Bug=Red, Refactor=Yellow, Idea=Green, Content=Purple, General=Gray).
  - Priority ring (High=Red, Medium=Yellow, Low=Green).
  - Checkbox toggle with celebratory check transition.
  - Contextual popover actions: Archive, Restore, Delete (Owner only).

#### Step 5.3: Create Task Bottom Sheet

- **File**: `lib/presentation/tasks/widgets/create_task_sheet.dart`
- **Elements**:
  - Title & description inputs with `#211F26` surface background.
  - Category selector chip row.
  - Priority selector segment.
  - "Create Task" button with Google Green accent.

---

### 📜 Phase 6: System Audit Logs & Telemetry (`system_logs`)

#### Step 6.1: Live Telemetry Stream & Category Filters

- **Files**: `lib/data/repositories/logs_repository.dart`, `lib/presentation/logs/logs_screen.dart`
- **Objective**: Real-time stream with horizontal category filter pills (`All`, `Auth`, `Content`, `Admin`, `Security`, `Visitor`, `Task`, `Storage`, `System` / `My Activity`).

#### Step 6.2: Search Bar & Severity Strips

- **Elements**:
  - Animated expanding search bar filtering by title, details, action code, or email.
  - Severity indicator strip: `info` (Blue), `warn` (Yellow), `error` / `critical` (Red).

#### Step 6.3: Expandable Log Detail Sheet

- **File**: `lib/presentation/logs/widgets/log_detail_sheet.dart`
- **Objective**: Tap a log card to view complete metadata: IP address, user-agent, target collection/document ID, and change diff payload.

#### Step 6.4: Retention Purge Action (Owner Only)

- **Objective**: Purge logs older than retention cutoff with batched deletion.

---

### 📧 Phase 7: Admin Emails Access Control (`accepted_admin_emails`)

#### Step 7.1: Admin Access List Stream

- **Files**: `lib/data/repositories/emails_repository.dart`, `lib/presentation/emails/emails_screen.dart`
- **Objective**: Real-time stream of authorized admin emails.

#### Step 7.2: Primary vs Secondary Badge

- **Elements**:
  - Primary admin shown with Google Blue Shield and "Owner" badge (cannot be deleted).
  - Secondary admins shown with avatar, added date, and added-by admin notes.

#### Step 7.3: Grant & Revoke Access Modal Dialogs

- **File**: `lib/presentation/emails/widgets/grant_access_dialog.dart`
- **Objective**:
  - Owner enters new email and notes → creates Firestore document `/accepted_admin_emails/{email}`.
  - Revoke button with confirmation dialog.

---

### 🚀 Phase 8: Polish, Optimizations & Release

#### Step 8.1: Network Reconnection & Offline UX

- Enable Firestore offline persistence (`persistenceEnabled: true`).
- Graceful reconnection indicators.

#### Step 8.2: Haptic Feedback & Micro-Interactions

- Subtle haptics (`HapticFeedback.lightImpact()`) on task checkbox toggle and tab switching.

#### Step 8.3: Automated Release Verification

- Run `flutter analyze` and `flutter test`.
- Ensure version bump and git commit formatting.

---

## 🎯 Summary Checklist

| Step | Component | Status Target |
| :--- | :--- | :--- |
| **1.1** | M3 Theme & Zero-Shadow Tokens | `lib/core/theme/` |
| **1.2** | Ambient Background Animation | `lib/presentation/common/ambient_background.dart` |
| **2.1 - 2.4** | Login Screen, Auto-Login & Role Gating | `lib/presentation/auth/` |
| **3.1 - 3.2** | Floating Dock & App Navigation Shell | `lib/presentation/navigation/` |
| **4.1 - 4.2** | Dashboard Bento Metrics | `lib/presentation/dashboard/` |
| **5.1 - 5.3** | Tasks Stream & Action Drawer | `lib/presentation/tasks/` |
| **6.1 - 6.4** | System Logs Telemetry & Retention Purge | `lib/presentation/logs/` |
| **7.1 - 7.3** | Admin Emails Authorization Manager | `lib/presentation/emails/` |
| **8.1 - 8.3** | Static Analysis, Testing & Polish | Full App Verification |
