# System Prompt & Specification: saoudi.online Flutter Admin Dashboard

This document is a comprehensive, production-ready prompt designed for an AI coding assistant (or software engineer) to generate a high-fidelity **Flutter Mobile Admin Dashboard** app for **saoudi.online**. 

The Flutter app will serve as the content management interface for Abderrahmane SAOUDI's personal portfolio website, connecting directly to the portfolio's Firebase project (Firestore & Authentication) and matching the exact database schemas, visual system, and processing constraints.

---

## 📱 Project & Architecture Overview

The Flutter companion app must perform full CRUD operations on the Firestore database powering `saoudi.online`. It is targeted at a single administrator (the portfolio owner) and must prioritize **strict security**, **M3 visual cohesion**, and **robust client-side image compression**.

### Core Tech Stack Requirements
*   **Framework:** Flutter (target Android and iOS).
*   **State Management:** `flutter_riverpod` (preferred) or `provider`.
*   **Firebase Packages:** 
    *   `firebase_core` (Core initialization)
    *   `cloud_firestore` (Direct database updates)
    *   `firebase_auth` (Admin authentication)
    *   `google_sign_in` (Google Sign-In integration)
*   **File/Image Handling:**
    *   `image_picker` (Picking images for projects, designs, certificates, and resume preview)
    *   `file_picker` (Picking the resume PDF)
    *   `flutter_image_compress` (Client-side WebP image resizing & compression)

---

## 🎨 Design System & Visual Rules (Material 3 Dark Mode)

The mobile interface must replicate the premium **Material 3 Dark Theme** constraints of the web portal.

### Color Palette (Strict Hex Tokens)

| Role | Color Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | Google Blue | `#4285F4` | Active tabs, primary buttons, accent highlights |
| **Secondary** | Google Green | `#0F9D58` | Success states, checked toggles, subtle badges |
| **Tertiary** | Google Yellow | `#F4B400` | Stagger indicators, warnings, highlights |
| **Error** | Google Red | `#DB4437` | Delete confirmations, validation errors |
| **Background** | Deep Charcoal | `#141218` | Main app scaffold background |
| **Surface** | Tonal Container 1 | `#1D1B20` | Cards, panels, navigation docks |
| **Surface High**| Tonal Container 2 | `#211F26` | Dialogs, bottom sheets, active inputs |
| **Text Primary** | Pure White | `#FFFFFF` | Headings, primary labels |
| **Text Muted** | Desaturated Gray| `#E6E1E5` | Body text, captions |

### Typography & Curvature Geometry
*   **Fonts:** Use Google Sans for all UI text.
*   **Geometry:** Strict M3 curvatures:
    *   Main cards, panel modules, dialog wrappers: `BorderRadius.circular(24.0)` (representing `rounded-3xl`).
    *   Buttons, input text fields, filter chips: `BorderRadius.circular(12.0)` (representing `rounded-xl`).
    *   Floating Action Buttons (FABs) & Floating Docks: `BorderRadius.circular(999.0)` (representing `rounded-full`).

---

## 🔐 Authentication & Security Workflow

Access to the app must be gated by a secure login screen:

1.  **Google Sign-In:** Implement authentication using the Google Identity system (`google_sign_in` paired with Firebase Auth).
2.  **Email Domain Restriction:** Immediately upon successful authentication, check the user's email address against the portfolio's admin email.
    *   *Prompt Configuration:* The app must read the allowed email from an environment variable/secure storage or verify against a strict match:
    ```dart
    const String adminEmail = "YOUR_ADMIN_EMAIL@gmail.com"; // configure securely
    if (user.email != adminEmail) {
      await FirebaseAuth.instance.signOut();
      // Show error dialog: "Unauthorized access: Email does not match administrator records."
    }
    ```
3.  **Persistence:** Maintain a secure session state. Auto-redirect the admin to the Dashboard if already signed in on app launch.

---

## 🗄️ Database Schemas (Dart Models)

The Flutter app must strictly adhere to the following Firestore models. Define these Dart classes with `toJson()` and `fromJson()` support:

### 1. StaticData (`configuration/static_data` singleton document)
```dart
class StaticData {
  final String name;
  final String title;
  final String bio;
  final Skills skills;
  final String resumeUrl; // Base64 PDF Data URL
  final String? previewUrl; // Base64 WebP Data URL
  final Contact contact;
  final ImageSettings imageSettings;

  StaticData({
    required this.name,
    required this.title,
    required this.bio,
    required this.skills,
    required this.resumeUrl,
    this.previewUrl,
    required this.contact,
    required this.imageSettings,
  });
}

class Skills {
  final List<String> languages;
  final List<String> frameworks;
  final List<String> tools;

  Skills({required this.languages, required this.frameworks, required this.tools});
}

class Contact {
  final String email;
  final String? telegram;
  final String? whatsapp;

  Contact({required this.email, this.telegram, this.whatsapp});
}

class ImageSettings {
  final int quality;
  final int maxWidth;

  ImageSettings({required this.quality, required this.maxWidth});
}
```

### 2. Experience (`experience` collection)
```dart
class Experience {
  final String id;
  final int order;
  final String role;
  final String company;
  final String location;
  final String date; // ISO 8601 string for chronological sorting
  final String period; // Human-readable (e.g. "Jan 2024 - Present")
  final List<String> descriptionPoints;
  final List<String> technologies;

  Experience({
    required this.id,
    required this.order,
    required this.role,
    required this.company,
    required this.location,
    required this.date,
    required this.period,
    required this.descriptionPoints,
    required this.technologies,
  });
}
```

### 3. Project (`projects` collection)
```dart
class Project {
  final String id;
  final int order;
  final String title;
  final String tagline;
  final String description;
  final String imageUrl; // Base64 WebP image data URL
  final String projectUrl;
  final String githubUrl;
  final String date; // ISO 8601
  final List<String> technologies;
  final bool featured;

  Project({
    required this.id,
    required this.order,
    required this.title,
    required this.tagline,
    required this.description,
    required this.imageUrl,
    required this.projectUrl,
    required this.githubUrl,
    required this.date,
    required this.technologies,
    required this.featured,
  });
}
```

### 4. Design (`designs` collection)
```dart
class Design {
  final String id;
  final String title;
  final String? description;
  final String imageUrl; // Base64 WebP image data URL
  final String date; // ISO 8601
  final String company;
  final List<String> tags;

  Design({
    required this.id,
    required this.title,
    this.description,
    required this.imageUrl,
    required this.date,
    required this.company,
    required this.tags,
  });
}
```

### 5. Certificate (`certificates` collection)
```dart
class Certificate {
  final String id;
  final String title;
  final String issuer;
  final String date; // ISO 8601
  final String type; // 'Online' | 'In-Person' | 'Hybrid'
  final String? credentialUrl;
  final String? imageUrl; // Base64 WebP image data URL or null

  Certificate({
    required this.id,
    required this.title,
    required this.issuer,
    required this.date,
    required this.type,
    this.credentialUrl,
    this.imageUrl,
  });
}
```

### 6. Volunteering (`volunteering` collection)
```dart
class Volunteering {
  final String id;
  final int order;
  final String role;
  final String organization;
  final String date; // ISO 8601
  final String period;
  final String description;
  final String? impactMetric;

  Volunteering({
    required this.id,
    required this.order,
    required this.role,
    required this.organization,
    required this.date,
    required this.period,
    required this.description,
    this.impactMetric,
  });
}
```

---

## ⚡ Image & PDF Processing Pipeline (Critical Constraint)

To keep database transactions atomic and avoid Firebase Storage file linking issues, **all images and PDFs are stored directly in Firestore as Base64-encoded Data URLs**.

### 1. Image Resizing & WebP Compression (Designs, Projects, Certificates, Resume Preview)
When picking an image file:
*   **Format:** Compress the image and convert it to **WebP** (`image/webp`).
*   **Dimensions:** Scale down the image so the maximum dimension (width or height) matches the `maxWidth` specified in `imageSettings` (fallback to `1024` if database is unread).
*   **Quality:** Compress using the quality slider from `imageSettings` (fallback to `75`).
*   **Size Limit:** Verify the final file size **is strictly under 800 KB**. Reject files exceeding this limit to stay safe from Firestore's 1MB document limit.
*   **Save Format:** Output as a base64 Data URL string:
    `data:image/webp;base64,UklGRk...`

#### Reference Dart Implementation (Compression Helper):
```dart
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_image_compress/flutter_image_compress.dart';

Future<String?> processAndEncodeImage(String filePath, {int quality = 75, int maxWidth = 1024}) async {
  // Compress image to WebP
  final Uint8List? webpData = await FlutterImageCompress.compressWithFile(
    filePath,
    minWidth: maxWidth,
    minHeight: maxWidth,
    quality: quality,
    format: CompressFormat.webp,
  );

  if (webpData == null) return null;

  // Enforce size check (800KB = 819,200 bytes)
  if (webpData.lengthInBytes > 819200) {
    throw Exception("Compressed image size (${webpData.lengthInBytes} bytes) exceeds 800KB limit.");
  }

  // Convert to Base64 data URL
  final String base64String = base64Encode(webpData);
  return 'data:image/webp;base64,$base64String';
}
```

### 2. Resume PDF Compression (Resume PDF)
*   **Format:** Must be a valid PDF file (`application/pdf`).
*   **Size Limit:** Check the file size prior to upload. Must be strictly under **800 KB**.
*   **Save Format:** Encode to base64 Data URL:
    `data:application/pdf;base64,JVBERi...`

---

## 🖥️ Screen-by-Screen UI Implementation Guide

Design the app with a Bottom Navigation Dock that floats at the bottom of the screen.

### 1. Home Dashboard Screen
*   **Metrics Grid:** Display 5 responsive, rounded M3 cards showing counts of:
    *   Projects
    *   Experience
    *   Designs
    *   Certifications
    *   Volunteering
*   **System Banner:** Display Firebase Status ("Connected"), authenticated user's email, and Last Sync time.
*   **Quick Action Drawer:** Easy access button to quickly add a new item to any collection.

### 2. Projects Manager Screen
*   **Master View:** A scrollable list of all projects ordered by the `order` field. List item shows project image thumbnail, title, tagline, and a "Featured" badge if applicable. Drag-and-drop to reorder items (updating their `order` indexes dynamically).
*   **Detail Panel (Editor Sheet):**
    *   Input Fields: Title, Tagline, Description (large text area), Project URL, GitHub URL, Technologies (comma-separated tags with chip display), Date picker (saves ISO 8601).
    *   Featured Switch: Toggle boolean state.
    *   Image Picker: Upload action triggers compression pipeline and previews the WebP base64 container.
    *   Actions: "Save" (merge/overwrite) and "Delete" (with double-confirmation warning).

### 3. Experience Manager Screen
*   **Master View:** Scrollable list of corporate experience roles with order indexing. Includes drag-and-drop reordering.
*   **Detail Panel:**
    *   Input Fields: Role title, Company Name, Location, Date (ISO), Period (e.g. "Jun 2023 - Present"), Technologies chips.
    *   Description Points: Dynamic list interface where admin can click "Add Point", input text, and delete points individually.
    *   Actions: Save and Delete.

### 4. Designs Manager Screen
*   **Master View:** Display mockups in a grid layout. Top bar includes Search (by title, company, tag) and filter drawers (by Company or Year).
*   **Detail Panel:**
    *   Input Fields: Title, Company Name (dropdown populated from `configuration/designs_companies`), Date picker (ISO), Tags chips.
    *   Required Image: Picker with compression is mandatory.
*   **Manage Companies Drawer:** Sub-sheet to add, delete, or rename companies in the `configuration/designs_companies` array (reordering or batch updating affected designs).

### 5. Certifications Manager Screen
*   **Master View:** Certificate list displaying title, issuer, type badge (Online/In-person/Hybrid), and an image preview icon.
*   **Detail Panel:**
    *   Input Fields: Title, Issuer, Date (ISO), Type (Dropdown: 'Online', 'In-Person', 'Hybrid'), Credential Link (URL).
    *   Optional Image: Upload certificate image as Base64 WebP or leave null.

### 6. Volunteering Manager Screen
*   **Master View:** Chronological list of volunteer roles with drag-and-drop ordering.
*   **Detail Panel:**
    *   Input Fields: Role, Organization, Date (ISO), Period string, Description paragraph, Impact Metric (optional, e.g. "Managed 20+ volunteers").

### 7. Resume & Global Settings Screen
*   **Resume Upload Module:**
    *   A card containing two primary actions:
        1.  **Upload Resume PDF:** Opens file picker, validates PDF format & size (<800KB), uploads to `static_data.resumeUrl`.
        2.  **Upload Preview Image:** Picks image, compresses to WebP, uploads to `static_data.previewUrl`.
*   **Global Portfolio Settings Form:**
    *   Input Fields: Name, Professional Title, Bio description (rich multiline field).
    *   Skills Matrix: Easily add/remove items under Languages, Frameworks, and Tools.
    *   Image Settings: Slide controls to modify Quality (1-100) and Max Width (in px) fields.
    *   Contact Info: Email, Telegram, Whatsapp.

---

## 🛠️ Prompt for Code Generation

*Copy and paste the prompt below into your code generation LLM to construct the Flutter application:*

```text
Create a cross-platform Flutter mobile application using Dart that acts as a secure content manager for a personal portfolio website.

Here is the context and complete specification of what to build:
1. Target Platforms: Android and iOS. Use Flutter SDK.
2. Architecture: Implement Clean Architecture. Use flutter_riverpod for state management. Ensure the code is divided into data (Firestore repository), domain (Dart models/entities), and presentation layers (UI views and state controllers).
3. Firebase Integration: Set up direct integration with Cloud Firestore and Firebase Auth using:
   - firebase_core: ^3.0.0
   - cloud_firestore: ^5.0.0
   - firebase_auth: ^5.0.0
   - google_sign_in: ^6.2.0
4. Design Rules: Implement a Material 3 Dark theme.
   - Background Color: #141218
   - Surface Color: #1D1B20
   - Container Color: #211F26
   - Primary Accent: #4285F4 (Google Blue)
   - Secondary Accent: #0F9D58 (Google Green)
   - Tertiary Accent: #F4B400 (Google Yellow)
   - Error Color: #DB4437 (Google Red)
   - Curvatures: rounded-3xl (BorderRadius 24) for cards/dialogs, rounded-xl (BorderRadius 12) for buttons/inputs.
   - Typography: Use Google Sans with primary text white (#FFFFFF) and body text desaturated gray (#E6E1E5).
5. Authentication Screen:
   - Provide a clean sign-in screen with a "Continue with Google" button.
   - Gated validation: Once Google Sign-In completes, verify if the authenticated user's email matches "saoudi.online@example.com" (make this configurable or read from a constants file). If it doesn't match, sign the user out immediately, show an alert dialog with "Unauthorized access", and do not enter the dashboard.
6. Firestore Data Structure & Models:
   Implement CRUD classes matching the following schemas exactly:
   - 'projects': id (string), order (int), title (string), tagline (string), description (string), imageUrl (string, Base64 WebP), projectUrl (string), githubUrl (string), date (string, ISO), technologies (list of strings), featured (bool).
   - 'experience': id (string), order (int), role (string), company (string), location (string), date (string, ISO), period (string), descriptionPoints (list of strings), technologies (list of strings).
   - 'designs': id (string), title (string), description (string, optional), imageUrl (string, Base64 WebP), date (string, ISO), company (string), tags (list of strings).
   - 'certificates': id (string), title (string), issuer (string), date (string, ISO), type (string: 'Online'|'In-Person'|'Hybrid'), credentialUrl (string, optional), imageUrl (string, optional, Base64 WebP).
   - 'volunteering': id (string), order (int), role (string), organization (string), date (string, ISO), period (string), description (string), impactMetric (string, optional).
   - 'configuration/static_data' (Singleton Document): name (string), title (string), bio (string), skills (map with lists: languages, frameworks, tools), resumeUrl (string, Base64 PDF), previewUrl (string, Base64 WebP, optional), contact (map: email, telegram, whatsapp), imageSettings (map: quality [int], maxWidth [int]).
   - 'configuration/designs_companies' (Singleton Document): companies (list of strings).
7. Core Constraint: Client-Side Image/PDF Processing:
   - Do NOT upload images to Firebase Storage. All images must be processed client-side.
   - Use 'flutter_image_compress' and 'image_picker'.
   - When picking an image, resize it so its maximum width/height is maxWidth (from configuration/static_data.imageSettings, fallback 1024), compress it as WebP with quality (from configuration/static_data.imageSettings.quality, fallback 75), ensure it is under 800 KB, encode it to base64, and format it as 'data:image/webp;base64,...'.
   - When uploading the resume PDF (using file_picker), verify it is a PDF and under 800 KB, encode it to base64, and format it as 'data:application/pdf;base64,...' before storing it in configuration/static_data.resumeUrl.
8. UI Screens to Generate:
   - Navigation: Use a Bottom Navigation Dock showing: Dashboard, Projects, Experience, Designs, Certifications, Volunteering, and Settings.
   - Dashboard: Metrics cards displaying totals, connection status, and quick-add actions.
   - Projects, Experience, Volunteering Managers: List view sorted by 'order', supporting drag-and-drop reordering. Edit sheets with form fields, multi-string inputs (for technologies & description points), and save/delete buttons.
   - Designs Manager: Image grid with Search and sliding Filter drawers (by company or tag). Add a company manager configuration sub-panel.
   - Certifications Manager: Filterable list by type with full certificate form inputs and image selector.
   - Settings: Integrated profile settings (Name, Title, Bio, Skills lists, Image quality slider, Max width numeric field, Contact links) + PDF and Preview image uploader cards for the Resume.
```
