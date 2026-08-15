# Prompt: Build the Standalone Admin Mobile App in Flutter (Direct Firebase Integration)

> **Role & Purpose**: You are an expert Flutter engineer and UI/UX designer. Your mission is to build **`saoudi_app`**, a completely standalone, cross-platform mobile application (Android & iOS) designed to monitor, track, and manage the administrative overview features directly using the **shared Firebase Project** (Cloud Firestore, Firebase Authentication, and Google Sign-In):
> 1. **Admin Emails Access Management** (`accepted_admin_emails` collection)
> 2. **System Audit Logs & Telemetry** (`system_logs` collection)
> 3. **Admin Tasks & Todos Hub** (`admin_todos` collection)
> 4. **Overview Dashboard Metrics** (Live Firestore aggregate queries + `configuration/static_data`)
>
> **Core Architecture Constraint**: The mobile app is **independent from the web server code** and interacts **directly with Cloud Firestore and Firebase Auth**. It does not rely on web HTTP API proxies.
>
> **Design Constraint**: The app must strictly replicate the web application's **Material 3 Dark Mode** design system, Google brand color palette, and non-negotiable **Absolute Shadow Ban** (zero visual shadows, zero elevation).

---

## 🎨 Design System, Styling & Visual Invariants

The Flutter application must visually match the design system of `saoudi.online`.

### 1. The Absolute Shadow Ban (Non-Negotiable)
- **Zero `BoxShadow`:** Never use `BoxShadow`, `elevation > 0`, `Material(elevation: ...)`, or drop-shadow filters on any widget, card, sheet, or dialog.
- **Elevation Expression:** Depth, hierarchy, and surface separation must be expressed strictly via:
  1. **Solid Surface Container Tones:** `#121212` canvas vs `#1D1B20` card container vs `#211F26` high container / input background.
  2. **Subtle Outlines & Borders:** `Border.all(color: Color(0xFF2B2930), width: 1.0)`.
  3. **Focus & Active Rings:** Border color highlights (e.g. `Color(0xFF8AB4F8)` / `Color(0x668AB4F8)`).
  4. **Smooth Micro-Transforms:** Subtle scale (`0.98` on tap) and opacity transitions.

### 2. Color Palette (Google Brand & Material 3 Dark)
| Role / Token | Hex Value | Flutter `Color` | Usage in App |
| :--- | :--- | :--- | :--- |
| **Canvas / Scaffold Background** | `#121212` | `const Color(0xFF121212)` | Main screen background |
| **Surface Container** | `#1D1B20` / `#1E1E1E` | `const Color(0xFF1D1B20)` | Main cards, panels, list items |
| **Surface Container High** | `#211F26` / `#2D2D2D` | `const Color(0xFF211F26)` | Inputs, active drawers, inner cards |
| **Border / Divider** | `#2B2930` | `const Color(0xFF2B2930)` | Card borders, dividers, outlines |
| **Primary (Google Blue)** | `#8AB4F8` / `#4285F4` | `const Color(0xFF8AB4F8)` | Active tabs, primary buttons, Auth logs |
| **Secondary (Google Green)**| `#81C784` / `#0F9D58` | `const Color(0xFF81C784)` | Success, active tasks, grant access |
| **Tertiary (Google Yellow)** | `#FDD663` / `#F9AB00` | `const Color(0xFFFDD663)` | Warnings, Idea/Refactor tags, medium priority |
| **Error / Destructive (Red)** | `#F28B82` / `#EA4335` | `const Color(0xFFF28B82)` | Delete actions, errors, High priority, Bugs |
| **Text Primary** | `#FFFFFF` | `const Color(0xFFFFFFFF)` | Titles, headers, prominent text |
| **Text Secondary (Muted)** | `#E6E1E5` (70%) | `const Color(0xB3E6E1E5)` | Subtitles, timestamps, details |
| **Text Subtle** | `#E6E1E5` (40%) | `const Color(0x66E6E1E5)` | Placeholders, inactive counts |

### 3. Geometry Tokens
- **Main Bento Panels & Cards:** `BorderRadius.circular(24.0)` (M3 `rounded-3xl`)
- **Buttons, Inputs, Dialogs, Drawers:** `BorderRadius.circular(12.0)` (M3 `rounded-xl`)
- **Status Pills, Badges, Nav Floats:** `BorderRadius.circular(999.0)` / `const StadiumBorder()`

---

## 🔐 Direct Firebase Authentication & Authorization Flow

The app directly initializes Firebase using `firebase_core` and uses `firebase_auth` with `google_sign_in`.

### 1. Auth Flow
1. **Google Sign-In:** User authenticates via `GoogleSignIn.signIn()` and acquires credentials.
2. **Firebase Auth Sign-In:** `FirebaseAuth.instance.signInWithCredential(credential)`.
3. **Admin Verification & Role Evaluation:**
   - Check if `user.email.toLowerCase() == PRIMARY_ADMIN_EMAIL`. If true → **Primary Admin / Owner**.
   - If not equal to primary email, query Firestore:
     ```dart
     final doc = await FirebaseFirestore.instance
         .collection('accepted_admin_emails')
         .doc(user.email.toLowerCase())
         .get();
     final isSecondaryAdmin = doc.exists;
     ```
   - If both checks fail → reject login, sign out, and record an unauthorized login attempt to `system_logs`.
4. **Audit Log on Login:** Append an `AUTH_LOGIN_PRIMARY` or `AUTH_LOGIN_SECONDARY` event to `system_logs`.

---

## 🗄️ Firestore Data Operations & Business Logic

### A. Admin Tasks (`admin_todos` Collection)

#### 1. Real-Time Stream
```dart
Stream<List<AdminTask>> streamTasks({required String userEmail, required bool isPrimaryAdmin}) {
  final query = FirebaseFirestore.instance
      .collection('admin_todos')
      .orderBy('createdAt', descending: true);

  return query.snapshots().map((snapshot) {
    var tasks = snapshot.docs.map((doc) => AdminTask.fromFirestore(doc)).toList();
    if (!isPrimaryAdmin) {
      tasks = tasks.where((t) => t.createdBy?.toLowerCase() == userEmail.toLowerCase()).toList();
    }
    return tasks;
  });
}
```

#### 2. CRUD Operations
- **Create Task:**
  ```dart
  final newId = 'task_${DateTime.now().millisecondsSinceEpoch}_${Uuid().v4().substring(0, 6)}';
  await FirebaseFirestore.instance.collection('admin_todos').doc(newId).set({
    'id': newId,
    'title': title.trim(),
    'description': description.trim(),
    'category': category, // 'Feature' | 'Bug' | 'Refactor' | 'Idea' | 'Content' | 'General'
    'priority': priority, // 'High' | 'Medium' | 'Low' | ''
    'status': 'active',
    'createdAt': DateTime.now().toUtc().toIso8601String(),
    'completedAt': null,
    'archivedAt': null,
    'createdBy': userEmail.toLowerCase(),
  });
  // Log event to system_logs (if createdBy != primaryAdmin)
  ```
- **Toggle Complete:**
  ```dart
  final isCompleted = task.status == 'completed';
  await docRef.update({
    'status': isCompleted ? 'active' : 'completed',
    'completedAt': isCompleted ? null : DateTime.now().toUtc().toIso8601String(),
  });
  ```
- **Archive / Restore / Delete:**
  - Archive: `update({'status': 'archived', 'archivedAt': DateTime.now().toUtc().toIso8601String()})`
  - Restore: `update({'status': 'active', 'archivedAt': null})`
  - Delete: `delete()` (Owner only).

---

### B. System Audit Logs (`system_logs` Collection)

#### 1. Real-Time Stream & Access Control
```dart
Stream<List<SystemLog>> streamLogs({
  required String userEmail,
  required bool isPrimaryAdmin,
  String filterType = 'all',
  String searchQuery = '',
}) {
  final query = FirebaseFirestore.instance
      .collection('system_logs')
      .orderBy('timestamp', descending: true)
      .limit(100);

  return query.snapshots().map((snapshot) {
    var logs = snapshot.docs.map((doc) => SystemLog.fromFirestore(doc)).toList();

    // Secondary admin filtering
    if (!isPrimaryAdmin) {
      logs = logs.where((l) {
        if (['content', 'visitor', 'storage'].contains(l.type)) return true;
        if (['auth', 'task'].contains(l.type) && l.userEmail.toLowerCase() == userEmail.toLowerCase()) return true;
        return false; // Hidden: admin, security, system
      }).toList();
    }

    // Category filter
    if (filterType != 'all') {
      if (filterType == 'my_activity') {
        logs = logs.where((l) => l.userEmail.toLowerCase() == userEmail.toLowerCase()).toList();
      } else {
        logs = logs.where((l) => l.type == filterType).toList();
      }
    }

    // Search query filter
    if (searchQuery.isNotEmpty) {
      final q = searchQuery.toLowerCase();
      logs = logs.where((l) =>
          l.title.toLowerCase().contains(q) ||
          (l.details?.toLowerCase().contains(q) ?? false) ||
          l.userEmail.toLowerCase().contains(q) ||
          l.action.toLowerCase().contains(q)).toList();
    }

    return logs;
  });
}
```

#### 2. Purge Expired Logs (Owner Only)
- Query `system_logs` where `expiresAt <= nowIso`, perform batched deletion.

#### 3. Delete Single Log (Owner Only)
- `FirebaseFirestore.instance.collection('system_logs').doc(logId).delete()`.

---

### C. Admin Emails (`accepted_admin_emails` Collection)

#### 1. Stream Authorized Emails
```dart
Stream<List<AcceptedAdminEmail>> streamAcceptedEmails({
  required String userEmail,
  required bool isPrimaryAdmin,
  required String primaryEmail,
}) {
  return FirebaseFirestore.instance
      .collection('accepted_admin_emails')
      .orderBy('addedAt', descending: false)
      .snapshots()
      .map((snapshot) {
    final list = <AcceptedAdminEmail>[
      // Guaranteed primary admin entry
      AcceptedAdminEmail(
        id: primaryEmail,
        email: primaryEmail,
        addedAt: DateTime.fromMillisecondsSinceEpoch(0).toIso8601String(),
        addedBy: 'System Environment',
        isPrimary: true,
        notes: 'Primary System Administrator',
      ),
      ...snapshot.docs
          .where((doc) => doc.id.toLowerCase() != primaryEmail.toLowerCase())
          .map((doc) => AcceptedAdminEmail.fromFirestore(doc)),
    ];

    if (!isPrimaryAdmin) {
      return list.where((item) => item.email.toLowerCase() == userEmail.toLowerCase()).toList();
    }
    return list;
  });
}
```

#### 2. Grant Access / Add Admin (Owner Only)
```dart
final normalizedEmail = newEmail.toLowerCase().trim();
await FirebaseFirestore.instance
    .collection('accepted_admin_emails')
    .doc(normalizedEmail)
    .set({
      'id': normalizedEmail,
      'email': normalizedEmail,
      'addedAt': DateTime.now().toUtc().toIso8601String(),
      'addedBy': callerEmail,
      'isPrimary': false,
      'notes': notes.trim().isNotEmpty ? notes.trim() : 'Accepted Admin User',
    });
```

#### 3. Revoke Access / Delete Admin (Owner Only)
- Cannot delete primary admin email.
- `FirebaseFirestore.instance.collection('accepted_admin_emails').doc(targetEmail).delete()`.

---

### D. Overview Dashboard Aggregate Metrics

Fetch live aggregate counts using Firestore count queries and `configuration/static_data`:
```dart
Future<DashboardMetrics> fetchDashboardMetrics() async {
  final db = FirebaseFirestore.instance;
  final results = await Future.wait([
    db.collection('projects').count().get(),
    db.collection('experience').count().get(),
    db.collection('designs').count().get(),
    db.collection('certificates').count().get(),
    db.collection('services').count().get(),
    db.collection('admin_todos').where('status', isEqualTo: 'active').count().get(),
    db.collection('configuration').doc('static_data').get(),
  ]);

  return DashboardMetrics(
    projectsCount: (results[0] as AggregateQuerySnapshot).count ?? 0,
    experienceCount: (results[1] as AggregateQuerySnapshot).count ?? 0,
    designsCount: (results[2] as AggregateQuerySnapshot).count ?? 0,
    certificatesCount: (results[3] as AggregateQuerySnapshot).count ?? 0,
    servicesCount: (results[4] as AggregateQuerySnapshot).count ?? 0,
    activeTasksCount: (results[5] as AggregateQuerySnapshot).count ?? 0,
    resumeDownloads: (results[6] as DocumentSnapshot).data()?['resumeDownloads'] ?? 0,
  );
}
```

---

## 📱 Screen Architecture & UI Specifications

### 1. App Navigation Structure
- **Floating Bottom Nav Dock:** A floating pill dock (`Container` with `BorderRadius.circular(32)` and background `Color(0xFF1D1B20)`) with:
  1. **Overview / Dashboard** (`Icons.dashboard_rounded`)
  2. **Tasks** (`Icons.task_alt_rounded` with live active task counter)
  3. **Logs** (`Icons.receipt_long_rounded` with error alert indicator)
  4. **Admin Emails** (`Icons.admin_panel_settings_rounded`)
  5. **Settings / Account** (`Icons.account_circle_rounded`)

---

### 2. Screen 1: Admin Tasks Hub
- **Header:**
  - Title: "Tasks" with yellow accent icon (`Color(0xFFFDD663)`).
  - Status Segmented Tabs: **Active**, **Completed**, **Archived** with count pill indicators.
  - Floating Add Button `[+]` opening a smooth modal bottom sheet.
- **Task List:**
  - Card layout: `Color(0xFF1D1B20)` background, `Color(0xFF2B2930)` border, `BorderRadius.circular(20)`.
  - **Category Pill:** Color-coded (Feature=Blue, Bug=Red, Refactor=Yellow, Idea=Green, Content=Purple, General=Gray).
  - **Priority Badge:** High (Red ring & dot), Medium (Yellow), Low (Green).
  - **Checkbox:** Circular toggle for completion status with celebratory check animation.
  - **Contextual Actions:** Archive, Restore, Delete (Owner only).

---

### 3. Screen 2: System Logs & Telemetry
- **Header Actions:**
  - Search icon that expands an inline animated search TextField.
  - Filter Tabs Horizontal Scroll: `All`, `Auth`, `Content`, `Admin`, `Security`, `Visitors`, `Tasks`, `Storage`, `System` (or `My Activity` for secondary admin).
  - Purge Expired Logs button (Owner only, amber warning outline).
  - Export Logs as JSON button (share via system share sheet).
- **Log Card:**
  - Severity indicator strip: Info=Blue, Warn=Yellow, Error/Critical=Red.
  - Title + Action code badge (e.g. `AUTH_LOGIN_PRIMARY`, `TASK_CREATED`).
  - User Email + Timestamp (relative formatting: "2m ago", "3h ago").
  - Expandable Tile: Tapping reveals request IP, User-Agent, target collection, changes diff, and raw metadata.

---

### 4. Screen 3: Admin Emails Access Management
- **Header:**
  - Shield icon with blue accent (`Color(0xFF8AB4F8)`).
  - "Grant Access" (+) action button (for Owner admin).
- **Email Items:**
  - Avatar placeholder with initial letter.
  - Email address and "Primary Admin" / "Secondary Admin" badge.
  - Added by & Date added.
  - Delete / Revoke access button with confirmation modal dialog (Primary admin email is protected from deletion).

---

### 5. Screen 4: Overview Dashboard
- **Top Bar:** Profile avatar, current logged-in email, active connection status badge ("Connected" in Green).
- **Metric Bento Cards:** 2x2 grid displaying counts for Projects, Experience, Designs, Certifications, and Resume Downloads.
- **Quick Action Cards:** High Priority Tasks counter, Recent Security / Auth alerts counter.

---

## 🛠 Recommended Flutter Tech Stack & Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Direct Firebase SDKs
  firebase_core: ^3.12.1
  firebase_auth: ^5.5.1
  cloud_firestore: ^5.6.5
  google_sign_in: ^6.2.2

  # State Management
  flutter_riverpod: ^2.6.1

  # Secure Local Storage
  flutter_secure_storage: ^9.2.4

  # Typography & Styling
  google_fonts: ^6.2.1

  # Utilities
  intl: ^0.20.2
  share_plus: ^10.1.4
  uuid: ^4.5.1
```

---

## 🔄 Cross-Project Sync & Contract Tracking

Whenever the Web Admin Overview panel is updated in `saoudi_website`, refer to **`docs/mobile_sync_contract.md`** in this repository. It contains the shared schema specifications and the **Versioned Changelog** with exact migration steps for this Flutter app.
