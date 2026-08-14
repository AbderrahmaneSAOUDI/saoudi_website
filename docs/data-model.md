# Multi-Collection Firestore Data Model & Schemas

The database structure uses a multi-collection schema in Cloud Firestore. All types, interfaces, and Zod schemas are canonically defined in `src/types.ts`.

---

## 📚 Firestore Collections Summary

```
Firestore Database
├── configuration/
│   └── static_data          → Singleton global site settings (StaticData)
├── projects/                → Project entries (Project)
├── experience/              → Career history entries (Experience)
├── designs/                 → Graphic design showcase items (Design)
├── certificates/            → Certifications and accreditations (Certificate)
├── volunteering/            → Community leadership & volunteer work (Volunteering)
├── services/                → Technical & design offerings (Service)
├── accepted_admin_emails/   → Authorized secondary admin accounts (AcceptedAdminEmail)
├── admin_todos/             → Internal admin task tracking (AdminTask)
└── system_logs/             → Audit logging & security telemetry (SystemLog)
```

---

## 📋 Schema Specifications

### 1. `configuration/static_data` (Singleton)
- **Document ID:** `static_data`
- **Fields:**
  - `name`: `string`
  - `title`: `string`
  - `bio`: `string`
  - `skills`: `{ languages: string[], frameworks: string[], tools: string[] }`
  - `resumeUrl`: `string`
  - `contact`: `{ email: string, telegram?: string, whatsapp?: string }`
  - `imageSettings`: `{ quality: number, maxWidth: number }`

### 2. `projects`
- **Document ID:** Auto-generated Firestore ID
- **Fields:**
  - `id`: `string`
  - `order`: `number` (integer)
  - `title`: `string`
  - `field?`: `string` (e.g., 'Web Development', 'Mobile App')
  - `tagline?`: `string`
  - `description?`: `string`
  - `imageUrl`: `string`
  - `projectUrl?`: `string`
  - `githubUrl?`: `string`
  - `date`: `string` (ISO 8601 YYYY-MM or YYYY-MM-DD)
  - `technologies`: `string[]`
  - `blocks?`: `Array<{ type: 'single_image' | 'carousel', ... }>`
  - `featured`: `boolean`

### 3. `experience`
- **Document ID:** Auto-generated Firestore ID
- **Fields:**
  - `id`: `string`
  - `order`: `number`
  - `role`: `string`
  - `company`: `string`
  - `logoUrl`: `string | null`
  - `employmentType`: `'Full-time' | 'Part-time' | 'Contract / Freelance' | 'Volunteering / Community' | 'Academic / Teaching'`
  - `startDate`: `string` (YYYY-MM or YYYY-MM-DD)
  - `endDate`: `string | null` (`null` = Present)
  - `responsibilities`: `string` (Markdown formatted)

### 4. `designs`
- **Fields:** `id`, `title?`, `description?`, `imageUrl`, `date?`, `company`, `tags?`

### 5. `certificates`
- **Fields:** `id`, `title`, `issuer`, `date`, `type` (`'Online' | 'In-Person' | 'Hybrid'`), `credentialUrl?`, `imageUrl?`

### 6. `volunteering`
- **Fields:** `id`, `order`, `role`, `organization`, `date`, `period`, `description`, `impactMetric?`

### 7. `services`
- **Fields:** `id`, `order`, `title`, `description`, `logoUrl?`, `features?`, `createdAt?`, `updatedAt?`

### 8. `accepted_admin_emails`
- **Fields:** `id`, `email`, `addedAt`, `addedBy`, `isPrimary?`, `notes?`

### 9. `admin_todos` (Admin Tasks)
- **Fields:** `id`, `title`, `description?`, `category` (`'Feature' | 'Bug' | 'Refactor' | 'Idea' | 'Content' | 'General'`), `priority?` (`'High' | 'Medium' | 'Low' | ''`), `status` (`'active' | 'completed' | 'archived'`), `createdAt`, `completedAt?`, `archivedAt?`, `createdBy?`

### 10. `system_logs` (Telemetry & Audit)
- **Fields:** `id`, `type` (`'auth' | 'content' | 'admin' | 'system' | 'security' | 'visitor' | 'task' | 'storage'`), `severity` (`'info' | 'warn' | 'error' | 'critical'`), `action` (`LogAction`), `title`, `details?`, `userEmail`, `isPrimaryEmail?`, `timestamp`, `ip?`, `userAgent?`, `requestPath?`, `sessionId?`, `targetCollection?`, `targetDocId?`, `changeType?`, `changedFields?`, `metadata?`
