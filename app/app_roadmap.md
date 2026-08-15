# 🗺️ `saoudi_app`: Step-by-Step Granular Architecture Roadmap

> **How to use this Roadmap:**
> This roadmap breaks down the construction of **`saoudi_app`** into **16 focused, single-task phases**. 
> Each phase does **one thing at a time**, explains the core concepts in plain English, tells you which files to touch, and gives you a concrete test to verify your progress before moving to the next step.

---

## 🧭 Master Phase Flowchart

```
[Phase 1] Project Dependencies & Manifest Setup
   ↓
[Phase 2] Firebase Platform Configuration (Android & iOS)
   ↓
[Phase 3] Design Tokens & Zero-Shadow Theme
   ↓
[Phase 4] Ambient Animated Particle Background
   ↓
[Phase 5] Google Authentication Service
   ↓
[Phase 6] Admin Role Evaluation & Gating Logic
   ↓
[Phase 7] Pixel-Perfect Login Screen UI
   ↓
[Phase 8] Splash Screen & Persistent Auto-Login Guard
   ↓
[Phase 9] Floating Pill Navigation Dock (NavDock) & App Shell
   ↓
[Phase 10] Overview Dashboard (Live Metrics Bento Grid)
   ↓
[Phase 11] Admin Tasks Hub: Data Model & Live Stream
   ↓
[Phase 12] Admin Tasks Hub: Card UI, Checkbox & Creation Sheet
   ↓
[Phase 13] System Audit Logs: Telemetry Stream & Category Filters
   ↓
[Phase 14] System Audit Logs: Search Bar, Inspector Sheet & Purge
   ↓
[Phase 15] Admin Emails Access Control: Stream, Grant & Revoke
   ↓
[Phase 16] Offline Persistence, Haptics & Final Release Build
```

---

## 📦 Phase 1: Project Dependencies & Manifest Setup

### Step 1.1: Configure `pubspec.yaml`
- **🎯 Goal**: Declare all required Flutter packages and set up asset folders.
- **📂 File**: `pubspec.yaml`
- **💡 Concept to Understand**:
  - `pubspec.yaml` is the package manager file for Flutter (like `package.json` in web development). It tells Flutter which libraries and assets to download and link.
- **📝 What to do**:
  1. Add Firebase SDKs: `firebase_core`, `firebase_auth`, `cloud_firestore`, `google_sign_in`.
  2. Add utility packages: `google_fonts`, `intl`, `share_plus`, `uuid`, `flutter_secure_storage`.
  3. Under the `flutter:` section, declare the asset directories:
     ```yaml
     flutter:
       uses-material-design: true
       assets:
         - assets/icons/
         - assets/images/
     ```
- **🔍 How to Verify**: Run `flutter pub get` in your terminal. It should complete with exit code `0` and create a `.dart_tool` folder.

---

### Step 1.2: Create Asset Folders & Place Icons
- **🎯 Goal**: Create the required local asset directories and copy vector icons.
- **📂 Folders**: `assets/icons/`, `assets/images/`
- **💡 Concept to Understand**:
  - Flutter apps package their local images and icons inside the app bundle so they work instantly offline without network loading.
- **📝 What to do**:
  1. Create the `assets/icons/` and `assets/images/` folders in your project root.
  2. Place your logo image (`assets/images/logo.png`) and vector icons.
- **🔍 How to Verify**: Check that `assets/images/logo.png` exists on your filesystem.

---

## 🔥 Phase 2: Firebase Platform Configuration

### Step 2.1: Android Firebase Configuration
- **🎯 Goal**: Connect the Android build engine to your Firebase Project.
- **📂 Files**: `android/app/google-services.json`, `android/build.gradle`, `android/app/build.gradle`
- **💡 Concept to Understand**:
  - Android requires a Google Services JSON file that provides project API keys and project IDs to the native Android OS.
- **📝 What to do**:
  1. Download `google-services.json` from your Firebase Console.
  2. Place `google-services.json` inside the `android/app/` folder.
  3. Ensure `minSdkVersion` in `android/app/build.gradle` is set to at least `21` (or `23`).
- **🔍 How to Verify**: Ensure `google-services.json` is located precisely at `android/app/google-services.json`.

---

### Step 2.2: iOS Firebase Configuration
- **🎯 Goal**: Connect the iOS build engine to your Firebase Project.
- **📂 File**: `ios/Runner/GoogleService-Info.plist`
- **💡 Concept to Understand**:
  - iOS uses an Apple Property List (`.plist`) file to configure Firebase native libraries.
- **📝 What to do**:
  1. Download `GoogleService-Info.plist` from your Firebase Console.
  2. Place `GoogleService-Info.plist` inside `ios/Runner/`.
- **🔍 How to Verify**: Verify that the file `ios/Runner/GoogleService-Info.plist` is present.

---

### Step 2.3: Initialize Firebase in `main.dart`
- **🎯 Goal**: Initialize Firebase services before the app runs any UI widgets.
- **📂 File**: `lib/main.dart`
- **💡 Concept to Understand**:
  - `WidgetsFlutterBinding.ensureInitialized()`: Ensures the native engine bridge is alive before asynchronous operations run.
  - `Firebase.initializeApp()`: Asynchronously starts Firebase and prepares Auth and Firestore.
- **📝 What to do**:
  1. In `main()`, call `WidgetsFlutterBinding.ensureInitialized()`.
  2. Call `await Firebase.initializeApp()`.
  3. Call `runApp(const SaoudiApp())`.
- **🔍 How to Verify**: Run `flutter run`. The app should launch on your device/emulator with a blank screen and no Firebase initialization crashes in the debug console.

---

## 🎨 Phase 3: Design Tokens & Zero-Shadow Theme

### Step 3.1: Define Google Brand & Surface Colors
- **🎯 Goal**: Create a single file storing all official Google brand colors and Material 3 dark surface tones.
- **📂 File**: `lib/core/theme/colors.dart`
- **💡 Concept to Understand**:
  - In Flutter, `Color(0xFF8AB4F8)` defines an ARGB hex color (`FF` is 100% alpha opacity, followed by the RGB hex `8AB4F8`).
- **📝 What to do**:
  1. Define Google accents: Blue (`#8AB4F8`), Green (`#81C784`), Yellow (`#FDD663`), Red (`#F28B82`).
  2. Define surface container levels: Canvas (`#121212`), Surface Container (`#1D1B20`), High Container (`#211F26`), Border (`#2B2930`).
  3. Define typography colors: Primary text (`#FFFFFF`), Secondary text (`#E6E1E5` at 70%), Muted text (`#E6E1E5` at 40%).
- **🔍 How to Verify**: You can reference `AppColors.googleBlue` and `AppColors.surfaceCanvas` throughout your Dart files without compile errors.

---

### Step 3.2: Configure the Global Zero-Shadow `ThemeData`
- **🎯 Goal**: Enforce the **Absolute Shadow Ban** across the entire Flutter framework.
- **📂 File**: `lib/core/theme/app_theme.dart`
- **💡 Concept to Understand**:
  - `ThemeData`: The master design sheet for your app. Setting global properties here automatically styles Cards, AppBars, Buttons, and Inputs without writing repetitive styles.
- **📝 What to do**:
  1. Create a class `AppTheme` with a static getter `darkTheme`.
  2. Set `useMaterial3: true` and `brightness: Brightness.dark`.
  3. Set `scaffoldBackgroundColor: AppColors.surfaceCanvas`.
  4. Configure `CardThemeData` with `elevation: 0`, `color: AppColors.surfaceContainer`, and rounded borders (`24px` radius with `#2B2930` border outline).
  5. Configure `AppBarTheme` with `elevation: 0` and `scrolledUnderElevation: 0`.
  6. Configure `InputDecorationTheme` with filled background `#211F26` and `12px` rounded borders.
  7. Apply Google Fonts (`GoogleFonts.interTextTheme()`).
- **🔍 How to Verify**: Set `theme: AppTheme.darkTheme` in `MaterialApp` inside `main.dart`. Notice that the background automatically turns `#121212` dark.

---

## ✨ Phase 4: Ambient Animated Particle Background

### Step 4.1: Build the Custom Canvas Painter
- **🎯 Goal**: Write a custom drawing layer that renders floating colored accent dots and a subtle star grid.
- **📂 File**: `lib/presentation/common/ambient_painter.dart`
- **💡 Concept to Understand**:
  - `CustomPainter`: A low-level drawing interface where you use `canvas.drawCircle()` to place shapes precisely at `(x, y)` coordinates.
- **📝 What to do**:
  1. Subclass `CustomPainter`.
  2. In `paint(Canvas canvas, Size size)`, calculate animated offsets using `sin(progress)` and `cos(progress)`.
  3. Draw 4 soft Google-color accent circles (Blue, Green, Yellow, Red) drifting smoothly across the screen corners.
  4. Use a nested loop to draw a subtle dot grid (star constellation) across the screen dimensions with faint opacity (`0.12`).
  5. In `shouldRepaint()`, return `true` whenever the progress value changes.
- **🔍 How to Verify**: The painter compiles without errors.

---

### Step 4.2: Build the Animated Wrapper Widget
- **🎯 Goal**: Create a reusable widget that runs a 30-second smooth looping animation controller behind any screen content.
- **📂 File**: `lib/presentation/common/ambient_background.dart`
- **💡 Concept to Understand**:
  - `AnimationController`: Generates numbers from `0.0` to `1.0` over a specified duration (`30 seconds`), then repeats infinitely using `..repeat()`.
  - `Stack`: Layers widgets on top of each other (Background canvas on bottom, screen widgets on top).
- **📝 What to do**:
  1. Create a `StatefulWidget` named `AmbientBackground` that takes a `Widget child`.
  2. In `initState()`, create an `AnimationController` with `duration: Duration(seconds: 30)` and call `.repeat()`.
  3. In `dispose()`, call `controller.dispose()` to prevent memory leaks.
  4. In `build()`, return a `Stack` containing:
     - The solid `#121212` canvas container.
     - `AnimatedBuilder` running `CustomPaint(painter: AmbientPainter(progress: controller.value))`.
     - The `widget.child` positioned above the background.
- **🔍 How to Verify**: Wrap your initial test screen in `AmbientBackground(child: Center(child: Text("Hello")))`. Run the app and watch the subtle Google-colored particles gently float in the background.

---

## 🔐 Phase 5: Google Authentication Service

### Step 5.1: Build the Google Sign-In & Auth Service
- **🎯 Goal**: Handle the OAuth prompt and exchange credentials with Firebase Auth.
- **📂 File**: `lib/data/services/auth_service.dart`
- **💡 Concept to Understand**:
  - `GoogleSignIn`: Opens the Google Account selection popup on Android/iOS.
  - `OAuthCredential`: An authentication token generated by Google that Firebase Auth converts into an authenticated session.
- **📝 What to do**:
  1. Instantiate `FirebaseAuth` and `GoogleSignIn`.
  2. Implement `signInWithGoogle()`:
     - Call `GoogleSignIn.signIn()` to get the Google user account.
     - Obtain `authentication.accessToken` and `authentication.idToken`.
     - Pass the tokens to `GoogleAuthProvider.credential()`.
     - Call `FirebaseAuth.instance.signInWithCredential()`.
  3. Implement `signOut()`: Signs out of both `GoogleSignIn` and `FirebaseAuth`.
  4. Expose a stream `authStateChanges` to observe login/logout events.
- **🔍 How to Verify**: Call `signInWithGoogle()` in a test button. You should see the standard Google Account picker on your phone/emulator.

---

## 🛡️ Phase 6: Admin Role Evaluation & Gating Logic

### Step 6.1: Define Roles & Primary Admin Check
- **🎯 Goal**: Determine if a signed-in user is the Primary Owner or a regular visitor.
- **📂 File**: `lib/core/constants/roles.dart`
- **💡 Concept to Understand**:
  - An `enum AdminRole { owner, secondary, unauthorized }` makes your permission checks clean and type-safe across the app.
- **📝 What to do**:
  1. Define `AdminRole` enum with 3 states: `owner`, `secondary`, `unauthorized`.
  2. Define the constant string `PRIMARY_ADMIN_EMAIL` (matching your primary Google email).
  3. When a user signs in, compare `user.email.toLowerCase()` with `PRIMARY_ADMIN_EMAIL`. If they match → Return `AdminRole.owner`.
- **🔍 How to Verify**: Log in with your primary email. Confirm your app identifies your role as `AdminRole.owner`.

---

### Step 6.2: Query Secondary Admin in Firestore
- **🎯 Goal**: If the user is not the primary owner, check if their email was authorized in Firestore.
- **📂 File**: Update `lib/data/services/auth_service.dart`
- **💡 Concept to Understand**:
  - `FirebaseFirestore.instance.collection('accepted_admin_emails').doc(email).get()` checks for the existence of an admin record in real-time.
- **📝 What to do**:
  1. If email is not primary, fetch document `/accepted_admin_emails/{user.email}`.
  2. If `doc.exists == true` → Return `AdminRole.secondary`.
  3. If `doc.exists == false` → Call `signOut()` immediately and return `AdminRole.unauthorized`.
- **🔍 How to Verify**: Add a secondary email into your Firestore database under `accepted_admin_emails/test@gmail.com`. Log in with that email and verify it receives `AdminRole.secondary`.

---

## 📱 Phase 7: Pixel-Perfect Login Screen UI

### Step 7.1: Build the Login Card & Header
- **🎯 Goal**: Create the visual container and branding header matching `admin_login.astro`.
- **📂 File**: `lib/presentation/auth/login_screen.dart`
- **💡 Concept to Understand**:
  - `ConstrainedBox(constraints: BoxConstraints(maxWidth: 400))` ensures your login box looks great on both compact phones and wide tablets.
- **📝 What to do**:
  1. Create `LoginScreen` wrapped in `AmbientBackground`.
  2. Build a centered container with `#1D1B20` surface background, `#2B2930` border outline, and `24px` rounded corners.
  3. Add the App Shield Icon Container (Google Blue background tint with a blue shield icon).
  4. Add the title "saoudi.online" and subtitle "Admin Telemetry & Management".
- **🔍 How to Verify**: Run the app and visually compare the card dimensions, colors, and typography with the website login page.

---

### Step 7.2: Build the Google Sign-In Pill Button
- **🎯 Goal**: Add the interactive Google Sign-In button with loading state.
- **📂 File**: Update `lib/presentation/auth/login_screen.dart`
- **💡 Concept to Understand**:
  - `OutlinedButton` with `shape: StadiumBorder()` creates a pill-shaped button with rounded ends.
- **📝 What to do**:
  1. Add a button with `#211F26` surface container background and `StadiumBorder()`.
  2. Include the Google G logo icon and text "Continue with Google".
  3. When tapped, show a `CircularProgressIndicator` while `signInWithGoogle()` executes.
  4. If login succeeds → Trigger navigation to dashboard.
  5. If login fails or unauthorized → Display a red error feedback banner.
- **🔍 How to Verify**: Tap the button with an unauthorized Google account. Verify that access is denied and a clear red error banner appears.

---

## 🚪 Phase 8: Splash Screen & Persistent Auto-Login Guard

### Step 8.1: Build the Startup Route Guard
- **🎯 Goal**: Check if an admin is already logged in on app startup and skip the login screen.
- **📂 File**: `lib/presentation/auth/splash_screen.dart`
- **💡 Concept to Understand**:
  - `Navigator.pushReplacement`: Replaces the current splash screen in the navigation stack so the user cannot press "Back" to return to the splash screen.
- **📝 What to do**:
  1. Create a `SplashScreen` that displays a brief loading indicator.
  2. In `initState()`, check `FirebaseAuth.instance.currentUser`.
  3. Evaluate the user's role with `authService.checkCurrentRole()`.
  4. If role is `owner` or `secondary` → Navigate immediately to `AppShell`.
  5. If role is `unauthorized` or `null` → Navigate to `LoginScreen`.
- **🔍 How to Verify**: Log in once, close the app completely, and reopen it. The app should automatically open into the dashboard without showing the login screen.

---

## ⚓ Phase 9: Floating Navigation Dock & App Shell

### Step 9.1: Build the Floating Stadium Navigation Dock
- **🎯 Goal**: Build the floating bottom bar matching `AdminNavDock.astro`.
- **📂 File**: `lib/presentation/navigation/nav_dock.dart`
- **💡 Concept to Understand**:
  - `SafeArea`: Ensures your navigation bar doesn't overlap the Android gesture navigation bar or iPhone home indicator bar.
- **📝 What to do**:
  1. Create `NavDock` with a stadium-pill shape (`BorderRadius.circular(999)`), `#1D1B20` surface background, and `#2B2930` border.
  2. Add 4 navigation items:
     - Overview (`Icons.dashboard_rounded`)
     - Tasks (`Icons.task_alt_rounded`)
     - Logs (`Icons.receipt_long_rounded`)
     - Admins (`Icons.admin_panel_settings_rounded`)
  3. Highlight the active item with a subtle Google Blue background tint and animated label expansion.
- **🔍 How to Verify**: Place `NavDock` on a test screen. Tap different items and verify the active tab highlights smoothly.

---

### Step 9.2: Assemble the Main App Shell with `IndexedStack`
- **🎯 Goal**: Coordinate top-level navigation between screens without losing state.
- **📂 File**: `lib/presentation/navigation/app_shell.dart`
- **💡 Concept to Understand**:
  - `IndexedStack`: Keeps all 4 main tab screens in memory simultaneously. When you switch tabs, it changes visibility instantly without restarting Firestore streams or resetting scroll positions.
- **📝 What to do**:
  1. Create `AppShell` with a state variable `_currentIndex`.
  2. Place an `IndexedStack` in `Scaffold.body` containing the 4 main screens.
  3. Place `NavDock` in `Scaffold.bottomNavigationBar`.
- **🔍 How to Verify**: Switch between tabs. Verify that navigation is instantaneous and smooth.

---

## 📊 Phase 10: Overview Dashboard (Live Metrics Bento Grid)

### Step 10.1: Build the Aggregate Count Service
- **🎯 Goal**: Fetch live total counts for all portfolio collections from Firestore.
- **📂 File**: `lib/data/services/metrics_service.dart`
- **💡 Concept to Understand**:
  - `db.collection('projects').count().get()`: Performs a lightweight server-side count aggregation query without downloading the entire document dataset (saving bandwidth and quota).
- **📝 What to do**:
  1. Execute concurrent count queries with `Future.wait([ ... ])`:
     - `projects.count()`
     - `experience.count()`
     - `designs.count()`
     - `certificates.count()`
     - `admin_todos.where('status', isEqualTo: 'active').count()`
  2. Return a map or data model containing all 5 integer counts.
- **🔍 How to Verify**: Call the service in debug mode and print the resulting counts to the console.

---

### Step 10.2: Build the 2x2 Bento Metric Card Grid
- **🎯 Goal**: Present live metrics in a modern 2x2 Bento card layout.
- **📂 File**: `lib/presentation/dashboard/dashboard_screen.dart`
- **💡 Concept to Understand**:
  - `FutureBuilder`: Waits for an asynchronous `Future` (like our count queries) and displays a loading spinner until the data arrives, then builds the UI.
- **📝 What to do**:
  1. Wrap screen in `AmbientBackground`.
  2. In `FutureBuilder`, build a `GridView.count(crossAxisCount: 2)`.
  3. Render 4 Bento Cards styled with `#1D1B20` surface container, `20px` corner radius, and dedicated Google accent colors:
     - Active Tasks → Google Yellow (`#FDD663`)
     - Projects → Google Blue (`#8AB4F8`)
     - Experience → Google Green (`#81C784`)
     - Designs → Google Red (`#F28B82`)
- **🔍 How to Verify**: Open the Dashboard screen and verify that your live database counts render correctly inside the Bento cards.

---

## 📋 Phase 11: Admin Tasks Hub — Data Model & Live Stream

### Step 11.1: Create the `AdminTask` Dart Model
- **🎯 Goal**: Define the strongly typed data model for tasks.
- **📂 File**: `lib/domain/models/admin_task.dart`
- **📝 What to do**:
  1. Define fields: `id`, `title`, `description`, `category`, `priority`, `status`, `createdAt`, `completedAt`, `createdBy`.
  2. Implement `AdminTask.fromFirestore(DocumentSnapshot doc)`.
  3. Implement `Map<String, dynamic> toMap()`.
- **🔍 How to Verify**: Model compiles cleanly with zero null-safety warnings.

---

### Step 11.2: Build the Real-Time Firestore Tasks Stream
- **🎯 Goal**: Listen to live updates from the `admin_todos` collection.
- **📂 File**: `lib/data/repositories/tasks_repository.dart`
- **💡 Concept to Understand**:
  - `Stream<List<AdminTask>>`: A continuous real-time data pipe. Whenever a task is created or updated in Firestore, the stream automatically emits the updated list to your UI.
- **📝 What to do**:
  1. Create a query targeting `collection('admin_todos')` ordered by `createdAt desc`.
  2. Convert snapshots into `List<AdminTask>`.
  3. If user is a secondary admin, filter tasks where `createdBy == user.email`.
- **🔍 How to Verify**: Listen to the stream in a simple `StreamBuilder` and verify items render in real-time.

---

## ✅ Phase 12: Admin Tasks Hub — Card UI, Checkbox & Creation Sheet

### Step 12.1: Build the Task Item Card Widget
- **🎯 Goal**: Display individual tasks with interactive completion toggles and badges.
- **📂 File**: `lib/presentation/tasks/widgets/task_card.dart`
- **📝 What to do**:
  1. Build a card with `#1D1B20` surface background, `#2B2930` border, and `16px` rounded corners.
  2. Add a `Checkbox` widget with Google Green active color.
  3. When checkbox is toggled → Update Firestore document field `status: 'completed'` (or `'active'`).
  4. Display the task title with a line-through strike when completed.
  5. Add color-coded category pills (e.g. Bug=Red, Feature=Blue, Idea=Green).
- **🔍 How to Verify**: Tap the checkbox on a task item. Verify that it updates instantly in both the UI and your Firestore database.

---

### Step 12.2: Build the Task Creation Bottom Sheet
- **🎯 Goal**: Provide an easy modal sheet to create new tasks.
- **📂 File**: `lib/presentation/tasks/widgets/create_task_sheet.dart`
- **💡 Concept to Understand**:
  - `showModalBottomSheet`: Slides up a modal container from the bottom of the screen.
- **📝 What to do**:
  1. Add a floating `+` button in the AppBar.
  2. When tapped, open a modal bottom sheet with `#211F26` surface background.
  3. Add input fields for Task Title, Category chips, and Priority selector.
  4. On submit → Generate a unique ID (`task_UUID`) and write the new task into `/admin_todos/{id}` in Firestore.
- **🔍 How to Verify**: Create a new task through the sheet. Verify that it appears instantly at the top of your tasks list.

---

## 📜 Phase 13: System Audit Logs — Telemetry Stream & Category Filters

### Step 13.1: Create the `SystemLog` Model & Live Stream
- **🎯 Goal**: Stream real-time security events and audit records from `system_logs`.
- **📂 Files**: `lib/domain/models/system_log.dart`, `lib/data/repositories/logs_repository.dart`
- **📝 What to do**:
  1. Define fields: `id`, `type`, `severity`, `action`, `title`, `details`, `userEmail`, `timestamp`, `ip`, `userAgent`.
  2. Create a stream querying `/system_logs` ordered by `timestamp desc` with a limit of `50`.
  3. Apply role isolation: Secondary admins only receive `content`, `visitor`, `storage`, and their own `auth`/`task` events.
- **🔍 How to Verify**: Verify logs stream into your application in real-time.

---

### Step 13.2: Build Horizontal Category Filter Chips
- **🎯 Goal**: Allow the admin to filter logs by event type.
- **📂 File**: `lib/presentation/logs/logs_screen.dart`
- **📝 What to do**:
  1. Build a horizontal scrollable row of filter chips: `All`, `Auth`, `Content`, `Admin`, `Security`, `Visitor`, `Task`, `Storage`, `System`.
  2. Tapping a chip filters the active stream list in memory.
  3. Highlight the active filter chip with Google Blue accent color.
- **🔍 How to Verify**: Tap the "Auth" chip. Verify that only authentication events remain visible in the list.

---

## 🔍 Phase 14: System Audit Logs — Search Bar, Inspector Sheet & Purge

### Step 14.1: Build Log Cards with Severity Indicators
- **🎯 Goal**: Display log records with instant visual severity feedback.
- **📂 File**: `lib/presentation/logs/widgets/log_card.dart`
- **📝 What to do**:
  1. Color-code severity dots:
     - `info` → Google Blue (`#8AB4F8`)
     - `warn` → Google Yellow (`#FDD663`)
     - `error` / `critical` → Google Red (`#F28B82`)
  2. Format timestamps using relative time (e.g. "Just now", "4m ago", "2h ago").
  3. Show the event title and user email.
- **🔍 How to Verify**: Check that error logs display with red indicator dots and formatted relative timestamps.

---

### Step 14.2: Build Expandable Log Inspector Modal
- **🎯 Goal**: Tap any log item to view its complete technical payload.
- **📂 File**: `lib/presentation/logs/widgets/log_detail_sheet.dart`
- **📝 What to do**:
  1. When a log card is tapped, open a modal bottom sheet.
  2. Display the Action Code, Client IP address, User-Agent, and target collection/document ID.
- **🔍 How to Verify**: Tap a log card and verify that the full technical details sheet appears.

---

### Step 14.3: Implement Retention Purge Action (Owner Only)
- **🎯 Goal**: Allow the primary owner to delete expired logs.
- **📂 File**: Update `lib/presentation/logs/logs_screen.dart`
- **📝 What to do**:
  1. If `isOwner == true`, show a "Purge Expired" button in the AppBar.
  2. Query logs where `expiresAt <= DateTime.now()`.
  3. Execute a Firestore batched write to delete expired documents.
- **🔍 How to Verify**: Test the purge button with expired test logs. Verify that expired records are removed from Firestore.

---

## 👥 Phase 15: Admin Emails Access Control (`accepted_admin_emails`)

### Step 15.1: Build Live Admin Access Stream
- **🎯 Goal**: Stream the list of authorized administrators.
- **📂 File**: `lib/presentation/emails/emails_screen.dart`
- **📝 What to do**:
  1. Stream `/accepted_admin_emails` collection.
  2. Always display the Primary Owner at the top of the list with a Google Blue Shield icon and "Primary Owner" badge.
  3. Display secondary admin accounts with avatar, date added, and notes.
- **🔍 How to Verify**: View the screen. Confirm that your primary admin email is prominently pinned at the top.

---

### Step 15.2: Build Grant & Revoke Access Modal Dialogs
- **🎯 Goal**: Allow the owner to grant or revoke admin access.
- **📂 File**: `lib/presentation/emails/widgets/grant_email_dialog.dart`
- **📝 What to do**:
  1. **Grant Access**: Owner taps `+` → Dialog prompts for email and notes → Writes document to `/accepted_admin_emails/{email}`.
  2. **Revoke Access**: Owner taps delete on a secondary admin → Confirmation dialog appears → On confirm, deletes Firestore document.
  3. **Safety Rule**: The primary owner email cannot be deleted.
- **🔍 How to Verify**: Grant access to a secondary test email. Verify the new email appears in the list and can log into the app.

---

## 🚀 Phase 16: Offline Persistence, Haptics & Final Release Build

### Step 16.1: Configure Firestore Offline Disk Persistence
- **🎯 Goal**: Enable local caching so the app works seamlessly during poor network conditions.
- **📂 File**: `lib/main.dart`
- **📝 What to do**:
  1. In `FirebaseFirestore.instance.settings`, ensure `persistenceEnabled: true` is configured.
- **🔍 How to Verify**: Turn on Airplane Mode. Open the app and verify that previously loaded tasks and metrics are still visible from cache.

---

### Step 16.2: Add Tactile Haptic Feedback
- **🎯 Goal**: Give the app a premium, responsive feel with subtle vibrations.
- **💡 Concept to Understand**:
  - `HapticFeedback.lightImpact()`: Triggers a tiny, pleasant tactile vibration on iOS and Android devices.
- **📝 What to do**:
  1. Trigger `HapticFeedback.lightImpact()` when:
     - A task checkbox is toggled.
     - A bottom navigation dock tab is tapped.
     - A modal bottom sheet is submitted.
- **🔍 How to Verify**: Tap a task checkbox on a physical phone. Feel the gentle tactile response.

---

### Step 16.3: Verification & Release Build
- **🎯 Goal**: Ensure 100% clean code quality and generate the production APK.
- **📝 Commands to Run**:
  1. Run static analysis:
     ```bash
     flutter analyze
     ```
     *(Must return: `No issues found!`)*
  2. Run automated tests:
     ```bash
     flutter test
     ```
  3. Build release APK:
     ```bash
     flutter build apk --release
     ```
- **🔍 How to Verify**: Install the release APK on your Android device and perform a full end-to-end walkthrough of all 4 tabs!
