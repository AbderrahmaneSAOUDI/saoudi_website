# 🗺️ `saoudi_app`: Step-by-Step Architecture Roadmap & Learning Plan

> **Purpose of this Roadmap**:
> This document is your complete, step-by-step master plan for building **`saoudi_app`** (the standalone Flutter companion app for `saoudi.online`).
> It focuses on **architecture, logic, widget choices, and progression milestones** rather than raw code, so you can follow each step at your own pace and understand the exact mechanics of building a production-grade Flutter app.

---

## 🧭 Milestone Flowchart

```
Phase 0: Environment, Dependencies & Firebase Setup
   ↓
Phase 1: Visual Design System & Theme Foundation (Zero Shadows)
   ↓
Phase 2: Authentication & Role-Based Access Control (Google Sign-In)
   ↓
Phase 3: Core Navigation Shell & Floating Nav Dock
   ↓
Phase 4: Dashboard & Live Aggregate Telemetry (Bento Grid)
   ↓
Phase 5: Admin Tasks & Todos Hub (admin_todos Stream & Actions)
   ↓
Phase 6: System Audit Logs & Telemetry (system_logs Stream & Filters)
   ↓
Phase 7: Admin Emails Access Control (accepted_admin_emails Management)
   ↓
Phase 8: Offline Persistence, Polish & Release Verification
```

---

## 📦 Phase 0: Environment, Dependencies & Firebase Setup

### Step 0.1: Project Setup & Package Dependencies
- **Goal**: Configure your Flutter environment with the exact packages needed for Firebase, state management, secure storage, and Google fonts.
- **File to modify**: `pubspec.yaml`
- **Key packages to include**:
  - `firebase_core`, `firebase_auth`, `cloud_firestore`, `google_sign_in`
  - `flutter_riverpod` (or chosen state management)
  - `flutter_secure_storage`
  - `google_fonts`, `intl`, `share_plus`, `uuid`
- **What to do**:
  1. Add the dependencies to `pubspec.yaml`.
  2. Declare the `assets/icons/` and `assets/images/` folders under the `flutter:` assets section.
  3. Run `flutter pub get` in your terminal to download and link all packages.

### Step 0.2: Firebase Project Configuration
- **Goal**: Connect your Flutter app directly to the shared Firebase project.
- **What to do**:
  1. For Android: Place `google-services.json` into `android/app/`.
  2. For iOS: Place `GoogleService-Info.plist` into `ios/Runner/`.
  3. Ensure your Google Sign-In SHA-1 / SHA-256 fingerprints are registered in the Firebase Console.

---

## 🎨 Phase 1: Visual Design System & Theme Foundation

### Step 1.1: Material 3 Dark Palette & Theme Tokens
- **Goal**: Define the app's visual identity with zero shadows and strict Google brand colors.
- **Files to create**: `lib/core/theme/colors.dart`, `lib/core/theme/app_theme.dart`
- **Design Invariants to Enforce**:
  - **Absolute Shadow Ban**: Enforce `elevation: 0` across all cards, appbars, dialogs, and sheets. Never use `BoxShadow`.
  - **Color Palette**:
    - Background canvas: `#121212`
    - Card container: `#1D1B20`
    - Input & active sheet container: `#211F26`
    - Border strokes: `#2B2930`
    - Accents: Google Blue (`#8AB4F8`), Google Green (`#81C784`), Google Yellow (`#FDD663`), Google Red (`#F28B82`)
  - **Typography**: Configure `GoogleFonts.interTextTheme()` (or Google Sans) for high-legibility dark mode text.
- **Expected Outcome**: A centralized `AppTheme.darkTheme` that automatically styles all standard Flutter widgets to match `saoudi.online`.

---

### Step 1.2: Ambient Animated Particle Background
- **Goal**: Replicate the website's signature floating Google-color dots and star grid background motion.
- **File to create**: `lib/presentation/common/ambient_background.dart`
- **Flutter Concepts to Learn/Use**:
  - `CustomPainter`: A canvas drawing tool that lets you paint custom shapes, circles, and lines.
  - `AnimationController` with `SingleTickerProviderStateMixin`: Drives a smooth, continuous 60 FPS looping timer.
  - `AnimatedBuilder`: Repaints the canvas smoothly on each frame without rebuilding heavy child widgets.
- **Step-by-Step Breakdown**:
  1. Create a `StatefulWidget` named `AmbientBackground` that accepts a `Widget child`.
  2. In `initState()`, create an `AnimationController` with a continuous 30-second loop.
  3. Create a `CustomPainter` that draws:
     - 4 soft radial circles using Google Blue, Green, Yellow, and Red drifting gently based on sine/cosine math.
     - A subtle repeating dot grid (stars) across the screen width and height.
  4. Stack the canvas behind the `child` content using a `Stack` widget.
- **Expected Outcome**: A reusable wrapper widget that gives any screen a lively ambient backdrop.

---

## 🔐 Phase 2: Authentication & Role-Based Access Control

### Step 2.1: Google Sign-In & Firebase Auth Service
- **Goal**: Provide a clean authentication service that handles signing in with Google and obtaining Firebase User credentials.
- **File to create**: `lib/data/services/auth_service.dart`
- **Step-by-Step Breakdown**:
  1. Initialize `FirebaseAuth` and `GoogleSignIn` instances.
  2. Implement `signInWithGoogle()`: Trigger Google prompt, get authentication tokens, and pass them to Firebase `signInWithCredential()`.
  3. Expose a stream `authStateChanges` so the app can react whenever the user logs in or logs out.

---

### Step 2.2: Access Control & Role Gating Logic
- **Goal**: Protect the app by verifying whether the authenticated user is an authorized administrator.
- **Logic to Implement**:
  1. Define an enum `AdminRole`: `owner`, `secondary`, `unauthorized`.
  2. **Primary Check**: Compare `user.email` with the hardcoded primary owner email (`PRIMARY_ADMIN_EMAIL`). If it matches → Assign `AdminRole.owner`.
  3. **Secondary Check**: If not owner, query Cloud Firestore collection `accepted_admin_emails/{user.email}`. If document exists → Assign `AdminRole.secondary`.
  4. **Rejection**: If neither condition is met → Immediately sign the user out and assign `AdminRole.unauthorized`.
- **Audit Logging**: If unauthorized, record an audit event into `system_logs` for security tracking.

---

### Step 2.3: Pixel-Perfect Login Screen Design
- **Goal**: Create a login screen matching the visual aesthetics of the web admin login page.
- **File to create**: `lib/presentation/auth/login_screen.dart`
- **UI Elements to Build**:
  - Wrap screen in `AmbientBackground`.
  - Centered card with `#1D1B20` surface background, `#2B2930` border, and `24px` rounded corners.
  - App shield/logo icon with Google Blue accent.
  - Bold title "saoudi.online" with subtitle "Admin Telemetry & Management".
  - Full-width pill-shaped Google Sign-In button (`StadiumBorder()`).
  - Error banner widget that displays error feedback if an unauthorized user attempts to sign in.

---

### Step 2.4: Persistent Auto-Login & Splash Route Guard
- **Goal**: Avoid forcing the admin to log in every time they open the app.
- **File to create**: `lib/presentation/auth/splash_screen.dart`
- **Step-by-Step Breakdown**:
  1. Show a brief, smooth loading splash state.
  2. Inspect `FirebaseAuth.instance.currentUser` and evaluate their role.
  3. If already authorized (Owner or Secondary) → Navigate directly to `AppShell` (Dashboard).
  4. If not logged in or invalid → Navigate to `LoginScreen`.

---

## ⚓ Phase 3: Core Navigation Shell & Floating Nav Dock

### Step 3.1: Floating Pill Navigation Dock (`NavDock`)
- **Goal**: Build the floating bottom navigation bar that matches `AdminNavDock.astro`.
- **File to create**: `lib/presentation/navigation/nav_dock.dart`
- **Specifications & Layout**:
  - A floating stadium-pill container (`BorderRadius.circular(32)` or `999`).
  - Color: `#1D1B20` container with a `#2B2930` border outline.
  - Items:
    1. **Overview / Dashboard** (`Icons.dashboard_rounded`)
    2. **Tasks** (`Icons.task_alt_rounded` with active task count badge)
    3. **Logs** (`Icons.receipt_long_rounded` with red indicator for unhandled errors)
    4. **Admin Emails** (`Icons.admin_panel_settings_rounded`)
  - Active item indicator: Highlight active tab with Google Blue container tint and smooth width expansion.

---

### Step 3.2: App Shell Scaffold
- **Goal**: Coordinate top-level navigation between tabs without losing screen state or scroll position.
- **File to create**: `lib/presentation/navigation/app_shell.dart`
- **Flutter Concept to Learn/Use**:
  - `IndexedStack`: Keeps all 4 main tab screens alive in memory so switching tabs doesn't trigger unnecessary re-renders or reset scroll offsets.
- **Step-by-Step Breakdown**:
  1. Create a `StatefulWidget` holding the current tab index `_currentIndex`.
  2. Use `Scaffold` with `extendBody: true` to let screen content flow behind the floating navigation bar.
  3. Place `IndexedStack` in `body` and your custom `NavDock` in `bottomNavigationBar`.

---

## 📊 Phase 4: Dashboard & Live Aggregate Telemetry

### Step 4.1: Live Aggregate Metric Counts (Bento Grid)
- **Goal**: Display real-time overview counts of all portfolio collections in a 2x2 Bento Grid.
- **File to create**: `lib/presentation/dashboard/dashboard_screen.dart`
- **Data to Query**:
  - Execute concurrent Firestore count queries (`db.collection('...').count().get()`):
    - `projects`, `experience`, `designs`, `certificates`, and active `admin_todos`.
- **UI Structure**:
  - 2-column `GridView` with aspect ratio `1.3`.
  - Stat cards styled with rounded `20px` corners, solid surface `#1D1B20`, and specific Google accent colors per card (e.g., Tasks=Yellow, Projects=Blue, Experience=Green, Designs=Red).

---

### Step 4.2: Quick Telemetry & Status Indicators
- **Goal**: Provide high-level system telemetry at a glance.
- **Elements to Include**:
  - Active connection status pill ("Connected" in Google Green).
  - High-priority task alert badge.
  - Pull-to-refresh (`RefreshIndicator`) to instantly re-fetch counts.

---

## 📋 Phase 5: Admin Tasks & Todos Hub (`admin_todos`)

### Step 5.1: Real-Time Stream & Status Segmented Tabs
- **Goal**: Listen to real-time task changes in Firestore and filter them by lifecycle status.
- **File to create**: `lib/presentation/tasks/tasks_screen.dart`
- **Firestore Stream Logic**:
  - Listen to `collection('admin_todos')` ordered by `createdAt desc`.
  - Filter stream data based on the active tab:
    - **Active**: `status == 'active'`
    - **Completed**: `status == 'completed'`
    - **Archived**: `status == 'archived'`
  - **Secondary Admin Filter**: If user is a secondary admin, only show tasks where `createdBy == user.email`.

---

### Step 5.2: Task Item Card UI & Badges
- **File to create**: `lib/presentation/tasks/widgets/task_card.dart`
- **Visual Specifications**:
  - Card container `#1D1B20` with `#2B2930` border.
  - Interactive Checkbox: Tapping toggles task status between `active` and `completed` directly in Firestore.
  - Strike-through text animation when task is marked complete.
  - Category Badge Pill: Color-coded (Feature=Blue, Bug=Red, Refactor=Yellow, Idea=Green, Content=Purple, General=Gray).
  - Priority Dot: High (Red), Medium (Yellow), Low (Green).
  - Action buttons: Archive, Restore, Delete (Delete restricted to Owner only).

---

### Step 5.3: Create Task Modal Bottom Sheet
- **File to create**: `lib/presentation/tasks/widgets/create_task_sheet.dart`
- **User Flow**:
  1. Admin taps the floating `+` button in the AppBar.
  2. Smooth modal bottom sheet opens (`showModalBottomSheet` with `#211F26` surface).
  3. Form inputs: Task Title, optional Description, Category selector chips, and Priority segmented control.
  4. On submit: Generate a unique ID (`task_UUID`), write to Firestore `/admin_todos/{id}`, and dismiss sheet.

---

## 📜 Phase 6: System Audit Logs & Telemetry (`system_logs`)

### Step 6.1: Live Telemetry Stream & Category Filters
- **Goal**: Provide real-time streaming of website security events, authentication logs, and content modifications.
- **File to create**: `lib/presentation/logs/logs_screen.dart`
- **Filter Tabs**:
  - Horizontal scrolling filter chips: `All`, `Auth`, `Content`, `Admin`, `Security`, `Visitor`, `Task`, `Storage`, `System` (or `My Activity` for secondary admins).
  - Role check: Secondary admins only see `content`, `visitor`, `storage`, and their own `auth`/`task` events.

---

### Step 6.2: Search Bar & Severity Visual Indicators
- **UI Elements**:
  - Expanding animated search input filtering logs by title, action, user email, or IP address.
  - Severity indicator dot / strip:
    - `info` → Google Blue
    - `warn` → Google Yellow
    - `error` / `critical` → Google Red
  - Relative timestamp formatting (e.g., "Just now", "5m ago", "2h ago") using `intl` package.

---

### Step 6.3: Expandable Log Detail Modal
- **File to create**: `lib/presentation/logs/widgets/log_detail_sheet.dart`
- **User Flow**:
  - Tapping any log item opens an inspector sheet displaying:
    - Event Action Code (e.g. `AUTH_LOGIN_PRIMARY`, `TASK_CREATED`)
    - Client IP address & User-Agent
    - Target collection and document ID
    - Structured JSON change diff / metadata

---

### Step 6.4: Retention Purge Action (Owner Only)
- **Goal**: Allow the primary admin to purge expired logs according to the system retention policy.
- **Action**: Query logs where `expiresAt <= now` and execute a Firestore batched delete.

---

## 📧 Phase 7: Admin Emails Access Control (`accepted_admin_emails`)

### Step 7.1: Live Authorized Admin List Stream
- **Goal**: View all administrator accounts with access to the system.
- **File to create**: `lib/presentation/emails/emails_screen.dart`
- **Stream Logic**:
  - Stream `/accepted_admin_emails` collection.
  - Guarantee the primary owner email is displayed at the top with an "Owner" badge.

---

### Step 7.2: Grant Access & Revoke Access Modal Dialogs
- **File to create**: `lib/presentation/emails/widgets/grant_email_dialog.dart`
- **User Flow**:
  1. **Grant Access**: Owner taps `+` → Dialog prompts for email & optional notes → Writes document to `/accepted_admin_emails/{email}`.
  2. **Revoke Access**: Owner taps delete icon next to a secondary admin → Confirmation dialog appears → On confirm, deletes Firestore document.
  3. **Safety Protection**: The primary owner email cannot be deleted or revoked.

---

## 🚀 Phase 8: Offline Persistence, Polish & Release Verification

### Step 8.1: Firestore Offline Persistence
- Enable offline disk caching in Firestore initialization so the app continues to display data when internet connectivity drops.

### Step 8.2: Haptic Feedback & Transitions
- Add subtle tactile feedback (`HapticFeedback.lightImpact()`) when completing tasks, tapping navigation tabs, or triggering modal actions.

### Step 8.3: Verification & Quality Assurance
- Run static analysis in your terminal:
  ```bash
  flutter analyze
  ```
- Run automated unit and widget tests:
  ```bash
  flutter test
  ```
- Build production APK:
  ```bash
  flutter build apk --release
  ```

---

## ✅ Progress Checklist

Track your progress step-by-step as you build:

- [ ] **Phase 0**: Dependencies installed & Firebase connected.
- [ ] **Phase 1.1**: Colors, tokens & zero-shadow `AppTheme` configured.
- [ ] **Phase 1.2**: Ambient animated particle background running smoothly.
- [ ] **Phase 2.1 - 2.4**: Google Sign-In, role gating & auto-login functional.
- [ ] **Phase 3.1 - 3.2**: Floating navigation dock & app shell completed.
- [ ] **Phase 4.1 - 4.2**: Dashboard Bento metrics live from Firestore.
- [ ] **Phase 5.1 - 5.3**: Admin tasks streaming, toggling & creation sheet working.
- [ ] **Phase 6.1 - 6.4**: System logs streaming, filters & detail sheet active.
- [ ] **Phase 7.1 - 7.2**: Admin emails list, grant access & revoke functional.
- [ ] **Phase 8.1 - 8.3**: Offline caching, haptics & static analysis clean.
