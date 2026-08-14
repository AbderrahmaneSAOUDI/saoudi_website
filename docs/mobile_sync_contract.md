# Mobile Sync Contract & Shared Firebase Specification

This document serves as the **Single Source of Truth (SSOT)** contract between the **Web Admin Panel** (`saoudi_website`) and the **Mobile Admin App** (`saoudi_app`). Both applications share the same Firebase Project and operate directly against the same Cloud Firestore database.

---

## 🏗️ Architecture & Direct Firebase Integration

The mobile application is **completely standalone** and interacts directly with Firebase services without going through web HTTP proxies:
- **Authentication**: `firebase_auth` with `google_sign_in` (validates against `ADMIN_EMAIL` and `accepted_admin_emails`).
- **Database**: `cloud_firestore` with real-time reactive streams (`snapshots()`) and atomic transactions.
- **Storage**: `firebase_storage` for any asset operations.

---

## 🗄️ Shared Firestore Collections & Schemas

### 1. `accepted_admin_emails` (Admin Access Control)
- **Path**: `/accepted_admin_emails/{email}`
- **Doc ID**: Normalized lowercase email address (e.g. `user@example.com`).
- **Schema**:
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `id` | `string` | Matches lowercase email address |
  | `email` | `string` | Lowercase email address |
  | `addedAt` | `string` (ISO 8601) | Timestamp when email was authorized |
  | `addedBy` | `string` | Email of administrator who granted access |
  | `isPrimary` | `boolean` (optional) | `true` if this is the primary system owner |
  | `notes` | `string` (optional) | Remarks / role description |

### 2. `system_logs` (Audit Telemetry & Security Logs)
- **Path**: `/system_logs/{logId}`
- **Doc ID**: Auto-generated document ID (e.g. `log_abc123`).
- **Schema**:
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `id` | `string` | Document ID |
  | `type` | `string` (enum) | `'auth' \| 'content' \| 'admin' \| 'system' \| 'security' \| 'visitor' \| 'task' \| 'storage'` |
  | `severity` | `string` (enum) | `'info' \| 'warn' \| 'error' \| 'critical'` (Default: `'info'`) |
  | `action` | `string` (enum) | Action key (e.g. `TASK_CREATED`, `AUTH_LOGIN_PRIMARY`, `ADMIN_EMAIL_ADDED`) |
  | `title` | `string` | Short human-readable event summary |
  | `details` | `string` (optional) | Detailed context or audit payload |
  | `userEmail` | `string` | Email of user or `'system'` |
  | `isPrimaryEmail` | `boolean` (optional) | `true` if performed by primary owner |
  | `timestamp` | `string` (ISO 8601) | Event creation timestamp |
  | `expiresAt` | `string` (ISO 8601) | Automatic retention expiration timestamp |
  | `ip` | `string` (optional) | Client IP address |
  | `userAgent` | `string` (optional) | Device / client user agent |
  | `requestPath` | `string` (optional) | Source path / action trigger |
  | `targetCollection`| `string` (optional) | Target collection impacted |
  | `targetDocId` | `string` (optional) | Target document ID |
  | `changeType` | `string` (optional) | `'create' \| 'update' \| 'delete'` |
  | `metadata` | `map` (optional) | Structured context map |

### 3. `admin_todos` (Admin Tasks)
- **Path**: `/admin_todos/{taskId}`
- **Doc ID**: `task_UUID` (or auto-generated Firestore ID).
- **Schema**:
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `id` | `string` | Document ID |
  | `title` | `string` | Task headline |
  | `description` | `string` (optional) | Detailed markdown/notes |
  | `category` | `string` (enum) | `'Feature' \| 'Bug' \| 'Refactor' \| 'Idea' \| 'Content' \| 'General'` |
  | `priority` | `string` (enum) | `'High' \| 'Medium' \| 'Low' \| ''` |
  | `status` | `string` (enum) | `'active' \| 'completed' \| 'archived'` |
  | `createdAt` | `string` (ISO 8601) | Creation timestamp |
  | `completedAt` | `string \| null` (ISO 8601)| Completion timestamp |
  | `archivedAt` | `string \| null` (ISO 8601)| Archive timestamp |
  | `createdBy` | `string` (optional) | Email of author |

### 4. `configuration/static_data` (Global Settings & Counts)
- **Path**: `/configuration/static_data`
- **Doc ID**: `static_data`
- **Fields Relevant to Admin Overview**:
  - `resumeDownloads`: `number`
  - `excludeAdminDownloads`: `boolean`
  - `lastResetAt`: `string` (optional)

---

## ⚖️ Business Logic & Invariants

1. **Role Separation**:
   - **Primary Admin**: Verified against primary `ADMIN_EMAIL`. Has unrestricted read/write access to all collections and records. Can purge expired logs and revoke secondary admin access.
   - **Secondary Admin**: Email must exist in `accepted_admin_emails`. Visibility restricted:
     - **Tasks**: Only see tasks where `createdBy == callerEmail`.
     - **Logs**: Can see `content`, `visitor`, `storage`, and their own `auth`/`task` logs. `admin`, `security`, and `system` logs are hidden.
     - **Emails**: Read-only view of their own email.
2. **Noise Suppression**:
   - Tasks & Content modifications made by the Primary Admin are suppressed from the overview logs feed to prevent self-clutter.
3. **Log Retention Thresholds**:
   - `security`: 180 days | `auth` & `admin`: 90 days | `content`: 45 days | `task` & `storage`: 30 days | `visitor` & `system`: 15 days.
4. **Absolute Shadow Ban**:
   - Zero `BoxShadow`, zero elevation in Flutter. Depth is represented purely via M3 surface tones (`#121212`, `#1D1B20`, `#211F26`) and `#2B2930` borders.

---

## 📝 Synchronization Protocol & Changelog

> **Rule for AI Agents & Developers**: Whenever any modification is made to the Web Admin Overview panel (such as adding fields, altering collections, changing enums, or tweaking business logic), you **MUST** record a new entry in this Changelog section detailing the changes and instructions for the mobile app.

### 📅 Changelog

#### [2026-08-14] — Initial Standalone Synchronization Contract
- **Source**: `saoudi_website` v1.74.355
- **Overview Features In Scope**:
  1. `accepted_admin_emails`: Multi-admin email access management with primary vs secondary status.
  2. `system_logs`: Audit logs with 8 categories, 4 severities, search, and retention purge.
  3. `admin_todos`: Admin tasks with Active/Completed/Archived status, 6 categories, and 3 priority levels.
  4. Aggregate counts via Firestore collection counts & `configuration/static_data`.
- **Mobile App Action Required**: Initial mobile client setup using direct Firebase SDK (`cloud_firestore`, `firebase_auth`).
