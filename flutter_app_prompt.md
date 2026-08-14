# Prompt: Build the `saoudi.online` Admin Mobile App in Flutter

> **Role & Purpose**: You are an expert Flutter engineer and UI/UX designer. Your mission is to build **`saoudi_admin_flutter`**, a cross-platform mobile application (Android & iOS) designed to monitor, track, and manage the 3 administrative back-office systems of **`saoudi.online`**:
> 1. **Admin Emails Access Control** (Primary and Secondary admin authorization)
> 2. **System Audit Logs & Telemetry** (Real-time event tracking, severity filtering, and retention purging)
> 3. **Admin Tasks & Todos** (Interactive workflow tracking with categories, priorities, and status lifecycles)
>
> The app must strictly replicate the web application's **Material 3 Dark Mode** design system, Google brand color palette, and non-negotiable **Absolute Shadow Ban** (zero visual shadows, zero elevation).

---

## 🎨 Design System, Styling & Visual Invariants

The Flutter application must visually and functionally match the design system of `saoudi.online`.

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

### 3. Geometry & Corner Radii
- **Main Bento Panels & Cards:** `BorderRadius.circular(24.0)` (M3 `rounded-3xl`)
- **Buttons, Inputs, Dialogs, Drawers:** `BorderRadius.circular(12.0)` (M3 `rounded-xl`)
- **Status Pills, Badges, Nav Floats:** `BorderRadius.circular(999.0)` / `const StadiumBorder()`

### 4. Typography & Easing
- **Font Family:** `GoogleSans` (or Google Fonts `Inter` / `Roboto`).
- **Animation Curves:** `Curves.easeInOutCubic` or `const Cubic(0.2, 0.0, 0.2, 1.0)`.
- **Durations:** `200ms` for micro-interactions, `300ms` for panel transitions.

---

## 🔐 Authentication, Permissions & Session Flow

The app connects to the `saoudi.online` backend API endpoints protected by session cookies.

### 1. Auth Flow
1. **Google Sign-In:** The user signs in via Google (`google_sign_in` package) to obtain a Google ID Token (`idToken`).
2. **Server Verification:** The app sends `POST /admin/admin_login` with JSON payload `{ "credential": "<idToken>" }`.
3. **Session Cookie Management:**
   - On success (HTTP 200), the server sends back a `Set-Cookie` header with the HMAC-SHA256 signed `admin_session` cookie (7-day validity).
   - Store the session cookie securely using `flutter_secure_storage`.
   - Attach `Cookie: admin_session=<token>` on all subsequent HTTP requests.
4. **Logout:** `POST /admin/admin_logout` removes server session, and the app clears local storage.

### 2. Role-Based Permissions (Primary Admin vs Secondary Admin)
- **Primary Admin (`ADMIN_EMAIL` owner):**
  - Full CRUD on tasks, logs, and accepted emails.
  - Can purge expired logs (`purge_expired`) and delete individual logs.
  - Can add/delete authorized secondary admin emails.
  - Can delete any task.
- **Secondary Admin:**
  - Tasks: Can only create, view, toggle, and archive their own tasks (`createdBy == callerEmail`).
  - Logs: Visibility restricted to `content`, `visitor`, `storage`, and their own `auth`/`task` events. `admin`, `security`, and `system` logs are hidden.
  - Emails: Read-only view of their own email record.

---

## 📡 API Endpoints Specification

Base URL: `https://saoudi.online` (or `http://10.0.2.2:4321` for local Android emulator testing).

All protected endpoints require `Cookie: admin_session=<token>`.

---

### A. Admin Tasks API (`/admin/admin_tasks_api`)

#### 1. Fetch Tasks List
- **Method:** `GET /admin/admin_tasks_api`
- **Response (200 OK):**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task_1723648123_abc123",
      "title": "Implement WebPush notifications for error logs",
      "description": "Add background service worker alert for critical logs",
      "category": "Feature",
      "priority": "High",
      "status": "active",
      "createdAt": "2026-08-14T10:30:00.000Z",
      "completedAt": null,
      "archivedAt": null,
      "createdBy": "admin@saoudi.online"
    }
  ]
}
```

#### 2. Create Task
- **Method:** `POST /admin/admin_tasks_api`
- **Content-Type:** `multipart/form-data` or `application/x-www-form-urlencoded`
- **Body Fields:**
  - `action`: `"create"`
  - `title`: `string` (required)
  - `description`: `string` (optional)
  - `category`: `"Feature" | "Bug" | "Refactor" | "Idea" | "Content" | "General"`
  - `priority`: `"High" | "Medium" | "Low" | ""`

#### 3. Toggle Complete / Active
- **Method:** `POST /admin/admin_tasks_api`
- **Body Fields:**
  - `action`: `"toggle_complete"`
  - `id`: `"task_id_here"`

#### 4. Archive Task
- **Method:** `POST /admin/admin_tasks_api`
- **Body Fields:**
  - `action`: `"archive"`
  - `id`: `"task_id_here"`

#### 5. Restore Task
- **Method:** `POST /admin/admin_tasks_api`
- **Body Fields:**
  - `action`: `"restore"`
  - `id`: `"task_id_here"`

#### 6. Delete Task (Permanent - Owner Only)
- **Method:** `POST /admin/admin_tasks_api`
- **Body Fields:**
  - `action`: `"delete"`
  - `id`: `"task_id_here"`

---

### B. System Logs API (`/admin/admin_logs_api`)

#### 1. Fetch Logs
- **Method:** `GET /admin/admin_logs_api?type={type}&search={query}`
- **Query Params:**
  - `type`: `"all" | "auth" | "content" | "admin" | "security" | "visitor" | "task" | "storage" | "system" | "my_activity"`
  - `search`: `string` (optional search filter)
- **Response (200 OK):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_xyz789",
      "type": "auth",
      "severity": "info",
      "action": "AUTH_LOGIN_PRIMARY",
      "title": "Owner logged into Admin Dashboard",
      "details": "Authenticated via Google GSI for admin@saoudi.online",
      "userEmail": "admin@saoudi.online",
      "isPrimaryEmail": true,
      "timestamp": "2026-08-14T14:20:10.500Z",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0 ...",
      "requestPath": "/admin/admin_login",
      "expiresAt": "2026-11-12T14:20:10.500Z"
    }
  ]
}
```

#### 2. Purge Expired Logs (Owner Only)
- **Method:** `POST /admin/admin_logs_api`
- **Body Fields:**
  - `action`: `"purge_expired"`
- **Response (200 OK):**
```json
{
  "success": true,
  "deletedCount": 14
}
```

#### 3. Delete Single Log (Owner Only)
- **Method:** `DELETE /admin/admin_logs_api?id={logId}` or `POST` with `action=delete_log&logId={logId}`
- **Response (200 OK):**
```json
{
  "success": true,
  "logId": "log_xyz789"
}
```

---

### C. Admin Emails API (`/admin/admin_emails_api`)

#### 1. Fetch Accepted Emails List
- **Method:** `GET /admin/admin_emails_api`
- **Response (200 OK):**
```json
{
  "success": true,
  "emails": [
    {
      "id": "admin@saoudi.online",
      "email": "admin@saoudi.online",
      "addedAt": "1970-01-01T00:00:00.000Z",
      "addedBy": "System Environment",
      "isPrimary": true,
      "notes": "Primary Administrator (env)"
    },
    {
      "id": "collaborator@gmail.com",
      "email": "collaborator@gmail.com",
      "addedAt": "2026-08-10T12:00:00.000Z",
      "addedBy": "admin@saoudi.online",
      "isPrimary": false,
      "notes": "Contractor Content Editor"
    }
  ]
}
```

#### 2. Grant Access / Add Email (Owner Only)
- **Method:** `POST /admin/admin_emails_api`
- **Body Fields:**
  - `action`: `"add"`
  - `email`: `"newadmin@example.com"`
  - `notes`: `"Optional notes"`

#### 3. Revoke Access / Delete Email (Owner Only)
- **Method:** `POST /admin/admin_emails_api`
- **Body Fields:**
  - `action`: `"delete"`
  - `email`: `"secondary@example.com"`

---

### D. System Statistics API (`/admin/admin_stats_api`)
- **Method:** `GET /admin/admin_stats_api`
- **Response (200 OK):**
```json
{
  "success": true,
  "counts": {
    "projects": 12,
    "experience": 6,
    "designs": 24,
    "certificates": 15,
    "resumeDownloads": 142,
    "excludeAdminDownloads": true
  }
}
```

---

## 📱 Screen Architecture & UI Specifications

### 1. App Navigation Structure
- **Floating Bottom Nav Dock:** A floating pill dock (`Container` with `BorderRadius.circular(32)` and background `Color(0xFF1D1B20)`) with:
  1. **Overview / Dashboard** (`Icons.dashboard_rounded`)
  2. **Tasks** (`Icons.task_alt_rounded` with active task count badge)
  3. **Logs** (`Icons.receipt_long_rounded` with error indicator badge if error logs exist)
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
  - **Pull-to-Refresh:** Refreshes tasks list from backend.

---

### 3. Screen 2: System Logs & Telemetry
- **Header Actions:**
  - Search icon that expands an inline animated search TextField.
  - Filter Tabs Horizontal Scroll: `All`, `Auth`, `Content`, `Admin`, `Security`, `Visitors`, `Tasks`, `Storage`, `System` (or `My Activity` for secondary admin).
  - Purge Expired Logs button (Owner only, amber warning outline).
  - Export Logs as JSON button (share via system share sheet).
- **Log Card:**
  - Severity indicator strip or badge:
    - `info` → Google Blue (`0xFF8AB4F8`)
    - `warn` → Google Yellow (`0xFFFDD663`)
    - `error` / `critical` → Google Red (`0xFFF28B82`)
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

Add these dependencies to `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Networking & HTTP
  dio: ^5.8.0+1
  cookie_jar: ^4.0.8
  dio_cookie_manager: ^4.0.0

  # State Management
  flutter_riverpod: ^2.6.1

  # Secure Storage
  flutter_secure_storage: ^9.2.4

  # Google Auth
  google_sign_in: ^6.2.2

  # Typography & Styling
  google_fonts: ^6.2.1

  # Utilities
  intl: ^0.20.2
  share_plus: ^10.1.4
  uuid: ^4.5.1
```

---

## 📋 Dart Models Reference Implementation

```dart
// lib/models/admin_task.dart
class AdminTask {
  final String id;
  final String title;
  final String? description;
  final String category; // 'Feature' | 'Bug' | 'Refactor' | 'Idea' | 'Content' | 'General'
  final String? priority; // 'High' | 'Medium' | 'Low' | ''
  final String status; // 'active' | 'completed' | 'archived'
  final String createdAt;
  final String? completedAt;
  final String? archivedAt;
  final String? createdBy;

  AdminTask({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    this.priority,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.archivedAt,
    this.createdBy,
  });

  factory AdminTask.fromJson(Map<String, dynamic> json) => AdminTask(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        description: json['description'] as String?,
        category: json['category'] as String? ?? 'General',
        priority: json['priority'] as String?,
        status: json['status'] as String? ?? 'active',
        createdAt: json['createdAt'] as String? ?? '',
        completedAt: json['completedAt'] as String?,
        archivedAt: json['archivedAt'] as String?,
        createdBy: json['createdBy'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'category': category,
        'priority': priority,
        'status': status,
        'createdAt': createdAt,
        'completedAt': completedAt,
        'archivedAt': archivedAt,
        'createdBy': createdBy,
      };
}

// lib/models/system_log.dart
class SystemLog {
  final String id;
  final String type; // 'auth' | 'content' | 'admin' | 'system' | 'security' | 'visitor' | 'task' | 'storage'
  final String severity; // 'info' | 'warn' | 'error' | 'critical'
  final String action;
  final String title;
  final String? details;
  final String userEmail;
  final bool isPrimaryEmail;
  final String timestamp;
  final String? ip;
  final String? userAgent;
  final String? requestPath;
  final String? expiresAt;
  final Map<String, dynamic>? metadata;

  SystemLog({
    required this.id,
    required this.type,
    this.severity = 'info',
    required this.action,
    required this.title,
    this.details,
    required this.userEmail,
    this.isPrimaryEmail = false,
    required this.timestamp,
    this.ip,
    this.userAgent,
    this.requestPath,
    this.expiresAt,
    this.metadata,
  });

  factory SystemLog.fromJson(Map<String, dynamic> json) => SystemLog(
        id: json['id'] as String,
        type: json['type'] as String? ?? 'system',
        severity: json['severity'] as String? ?? 'info',
        action: json['action'] as String? ?? '',
        title: json['title'] as String? ?? '',
        details: json['details'] as String?,
        userEmail: json['userEmail'] as String? ?? 'system',
        isPrimaryEmail: json['isPrimaryEmail'] as bool? ?? false,
        timestamp: json['timestamp'] as String? ?? '',
        ip: json['ip'] as String?,
        userAgent: json['userAgent'] as String?,
        requestPath: json['requestPath'] as String?,
        expiresAt: json['expiresAt'] as String?,
        metadata: json['metadata'] as Map<String, dynamic>?,
      );
}

// lib/models/accepted_admin_email.dart
class AcceptedAdminEmail {
  final String id;
  final String email;
  final String addedAt;
  final String addedBy;
  final bool isPrimary;
  final String? notes;

  AcceptedAdminEmail({
    required this.id,
    required this.email,
    required this.addedAt,
    required this.addedBy,
    this.isPrimary = false,
    this.notes,
  });

  factory AcceptedAdminEmail.fromJson(Map<String, dynamic> json) => AcceptedAdminEmail(
        id: json['id'] as String,
        email: json['email'] as String? ?? '',
        addedAt: json['addedAt'] as String? ?? '',
        addedBy: json['addedBy'] as String? ?? 'Admin',
        isPrimary: json['isPrimary'] as bool? ?? false,
        notes: json['notes'] as String?,
      );
}
```

---

## 🚀 Execution Instructions for the AI / Developer

1. Create a new Flutter project named `saoudi_admin_flutter`.
2. Configure dark theme with strict `ThemeData` tokens (`scaffoldBackgroundColor: Color(0xFF121212)`, zero shadow elevation on cards/appbars).
3. Implement `ApiClient` using `Dio` with persistent cookie jar and session interceptor.
4. Build the Google Sign-In authentication screen.
5. Build the 3 core tabs:
   - **Tasks Tab:** Filtered list (Active / Completed / Archived), quick checkbox toggle, create task bottom sheet.
   - **Logs Tab:** Filter tabs, expandable detail cards, search filter, purge expired button.
   - **Admin Emails Tab:** Primary & Secondary badge list, Add admin dialog, Revoke action.
6. Verify all API requests match the form-data / URL parameters specified above and ensure smooth M3 dark mode aesthetics.
