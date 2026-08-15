# 🗺️ `saoudi_app`: The Complete 30-Phase Architecture Roadmap

> **How to use this Master Roadmap:**
> This roadmap divides the entire creation of **`saoudi_app`** into **30 granular, single-focus phases**. 
> Each phase represents one clear, bite-sized milestone with no combined tasks. You can follow them one by one, verify each milestone independently, and understand how every single piece of a professional Flutter app fits together.

---

## 🧭 Master Phase Index (1 to 30)

| # | Phase Title | Focus Area |
| :--- | :--- | :--- |
| **01** | Package Manifest & Dependencies | `pubspec.yaml` configuration & downloads |
| **02** | Assets Directory & Vector Icons Layout | `assets/icons/` & `assets/images/` organization |
| **03** | Android Firebase Native Configuration | `google-services.json` & gradle linking |
| **04** | iOS Firebase Native Configuration | `GoogleService-Info.plist` & iOS runner setup |
| **05** | Flutter Engine & Firebase App Init | `main.dart` asynchronous startup binding |
| **06** | Google Brand Color Tokens & Hex Palette | `colors.dart` centralized palette tokens |
| **07** | Material 3 Dark Theme & Shadow Ban | `app_theme.dart` global zero-shadow rules |
| **08** | Typography & Google Fonts Setup | `GoogleFonts.inter` dark mode typography |
| **09** | Ambient Particle Canvas Math & Painter | `ambient_painter.dart` custom particle canvas |
| **10** | Ambient Looping Controller & Wrapper Widget | `ambient_background.dart` 30s animation wrapper |
| **11** | Google Sign-In Native Service Integration | `GoogleSignIn` OAuth prompt integration |
| **12** | Firebase Auth Credential Exchange | `FirebaseAuth` credential sign-in pipe |
| **13** | Admin Roles & Primary Owner Check | `AdminRole` enum & primary email verification |
| **14** | Secondary Admin Firestore Verification | Query `/accepted_admin_emails/{email}` |
| **15** | Unauthorized Session Rejection & Audit Log | Force sign-out & record security event |
| **16** | Login Screen Card Container & Logo Header | Centered `#1D1B20` card with shield logo |
| **17** | Google Sign-In Pill Button & Progress State | Stadium-pill button with loading indicator |
| **18** | Login Error Banner & Feedback UI | Contextual red error alert display |
| **19** | Startup Route Guard & Auto-Login Logic | `splash_screen.dart` auto-navigation check |
| **20** | Floating Navigation Dock Container & Layout | Floating stadium-pill dock geometry |
| **21** | Nav Dock Active Tab Expansion & Transitions | Animated tab width expansion & blue tint |
| **22** | App Shell Scaffold & `IndexedStack` Manager | Multi-screen state preservation shell |
| **23** | Overview Dashboard Server-Side Count Service | Firestore concurrent `.count().get()` queries |
| **24** | Dashboard 2x2 Bento Metric Grid Screen | Responsive Bento metric cards layout |
| **25** | Admin Tasks Data Model & Firestore Stream | `AdminTask` model & real-time collection pipe |
| **26** | Admin Tasks Segmented Tabs & Task Item Card | Active/Done/Archive tabs & strike-through UI |
| **27** | Task Creation Bottom Sheet & Context Menu | Modal bottom sheet form & task actions |
| **28** | System Audit Logs Stream & Category Filters | `system_logs` real-time feed & filter chips |
| **29** | Log Severity Indicators, Search & Purge | Blue/Yellow/Red dots, search bar & purge |
| **30** | Admin Emails Access Control Management | Pinned primary owner, grant & revoke modals |

---

## 📦 Milestone 1: Setup & Design System (Phases 1 – 10)

---

### Phase 01: Package Manifest & Dependencies
- **🎯 Goal**: Configure the package manifest with all required Firebase, UI, and utility libraries.
- **📂 File**: `pubspec.yaml`
- **💡 Concept to Understand**: `pubspec.yaml` is the dependency configuration file for Flutter. Adding a package here makes its Dart classes available in your project.
- **📝 What to do**:
  1. Add Firebase libraries: `firebase_core`, `firebase_auth`, `cloud_firestore`, `google_sign_in`.
  2. Add UI & Utility libraries: `google_fonts`, `intl`, `share_plus`, `uuid`, `flutter_secure_storage`.
  3. Register asset paths under `flutter: assets:`.
- **🔍 How to Verify**: Run `flutter pub get` in your terminal. Ensure it exits with code `0`.

---

### Phase 02: Assets Directory & Vector Icons Layout
- **🎯 Goal**: Create asset folders and place the app icon, branding shield logo, and vector icons.
- **📂 Folders**: `assets/icons/`, `assets/images/`
- **💡 Concept to Understand**: Local assets are bundled into the compiled binary so images and icons render instantly without internet access.
- **📝 What to do**:
  1. Create `assets/icons/` and `assets/images/`.
  2. Copy `logo.png` into `assets/images/` and vector SVGs into `assets/icons/`.
- **🔍 How to Verify**: Verify the files exist on disk at `assets/images/logo.png`.

---

### Phase 03: Android Firebase Native Configuration
- **🎯 Goal**: Connect the native Android engine to your Firebase Project.
- **📂 Files**: `android/app/google-services.json`, `android/app/build.gradle`
- **💡 Concept to Understand**: Android native code needs `google-services.json` to register Google OAuth client IDs and Firestore project settings.
- **📝 What to do**:
  1. Download `google-services.json` from the Firebase Console.
  2. Place it in `android/app/google-services.json`.
  3. Set `minSdkVersion` in `android/app/build.gradle` to at least `21`.
- **🔍 How to Verify**: Confirm `android/app/google-services.json` is in place.

---

### Phase 04: iOS Firebase Native Configuration
- **🎯 Goal**: Connect the native iOS Apple engine to your Firebase Project.
- **📂 File**: `ios/Runner/GoogleService-Info.plist`
- **💡 Concept to Understand**: iOS apps require a Property List (`.plist`) containing project keys.
- **📝 What to do**:
  1. Download `GoogleService-Info.plist` from the Firebase Console.
  2. Place it in `ios/Runner/GoogleService-Info.plist`.
- **🔍 How to Verify**: Confirm `ios/Runner/GoogleService-Info.plist` is in place.

---

### Phase 05: Flutter Engine & Firebase App Initialization
- **🎯 Goal**: Initialize the Flutter framework and Firebase core before running the widget tree.
- **📂 File**: `lib/main.dart`
- **💡 Concept to Understand**: `WidgetsFlutterBinding.ensureInitialized()` initializes the C++ communication bridge between Flutter and the native device OS.
- **📝 What to do**:
  1. Make `main()` an `async` function.
  2. Call `WidgetsFlutterBinding.ensureInitialized()`.
  3. Call `await Firebase.initializeApp()`.
  4. Call `runApp(...)`.
- **🔍 How to Verify**: Run `flutter run`. The app should start without crashing on startup.

---

### Phase 06: Google Brand Color Tokens & Hex Palette
- **🎯 Goal**: Centralize all Google brand accents and Material 3 Dark surface container colors.
- **📂 File**: `lib/core/theme/colors.dart`
- **💡 Concept to Understand**: `Color(0xFF8AB4F8)` represents an ARGB hex color code in Dart.
- **📝 What to do**:
  1. Define Google accents: Blue (`#8AB4F8`), Green (`#81C784`), Yellow (`#FDD663`), Red (`#F28B82`).
  2. Define Dark surfaces: Canvas (`#121212`), Container (`#1D1B20`), High Container (`#211F26`), Border (`#2B2930`).
  3. Define text tones: Primary (`#FFFFFF`), Secondary (`#E6E1E5` 70%), Muted (`#E6E1E5` 40%).
- **🔍 How to Verify**: Check that `AppColors.googleBlue` compiles without syntax errors.

---

### Phase 07: Material 3 Dark Theme & Absolute Shadow Ban
- **🎯 Goal**: Enforce the **Absolute Shadow Ban** (`elevation: 0`) globally across the theme.
- **📂 File**: `lib/core/theme/app_theme.dart`
- **💡 Concept to Understand**: `ThemeData` is Flutter's master style system. Overriding `CardThemeData.elevation` to `0` eliminates shadows app-wide.
- **📝 What to do**:
  1. Create `AppTheme.darkTheme` with `useMaterial3: true`.
  2. Set `scaffoldBackgroundColor` to `#121212`.
  3. Configure cards with `elevation: 0`, `#1D1B20` background, and `24px` rounded borders with `#2B2930` outlines.
  4. Configure AppBars with `elevation: 0` and `scrolledUnderElevation: 0`.
- **🔍 How to Verify**: Pass `theme: AppTheme.darkTheme` into `MaterialApp`. The screen background turns dark `#121212`.

---

### Phase 08: Typography & Google Fonts Setup
- **🎯 Goal**: Apply Google Sans / Inter typography to all headings and body copy.
- **📂 File**: Update `lib/core/theme/app_theme.dart`
- **💡 Concept to Understand**: `GoogleFonts.interTextTheme()` dynamically applies clean typography across all `Text` widgets.
- **📝 What to do**:
  1. Import `google_fonts`.
  2. Set `textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme)`.
- **🔍 How to Verify**: Render a `Text("saoudi.online")` widget. Verify the custom modern font applies cleanly.

---

### Phase 09: Ambient Particle Canvas Math & Painter
- **🎯 Goal**: Build the mathematical custom drawing layer for the floating background animation.
- **📂 File**: `lib/presentation/common/ambient_painter.dart`
- **💡 Concept to Understand**: `CustomPainter` allows direct 2D drawing on the screen using `canvas.drawCircle(Offset(x, y), radius, paint)`.
- **📝 What to do**:
  1. Create `AmbientPainter` extending `CustomPainter`.
  2. Use trigonometric math (`sin` and `cos` of animation progress) to calculate drifting offsets.
  3. Draw 4 soft Google-colored radial circles drifting across screen quadrants.
  4. Draw a repeating subtle star grid of micro-dots across the full width and height.
- **🔍 How to Verify**: Painter class compiles cleanly with null-safety.

---

### Phase 10: Ambient Looping Controller & Wrapper Widget
- **🎯 Goal**: Create the reusable 30-second looping background animation widget.
- **📂 File**: `lib/presentation/common/ambient_background.dart`
- **💡 Concept to Understand**: `AnimationController` with `..repeat()` runs a continuous animation loop on the GPU. `Stack` puts the animation behind child widgets.
- **📝 What to do**:
  1. Create a `StatefulWidget` named `AmbientBackground(child: child)`.
  2. In `initState()`, create an `AnimationController` with `duration: Duration(seconds: 30)` and call `.repeat()`.
  3. In `dispose()`, dispose of the controller to free GPU resources.
  4. Return a `Stack` with the `#121212` background, `CustomPaint`, and `widget.child`.
- **🔍 How to Verify**: Wrap a simple `Scaffold` in `AmbientBackground`. Run the app and watch the particles drift smoothly.

---

## 🔐 Milestone 2: Authentication & Navigation (Phases 11 – 22)

---

### Phase 11: Google Sign-In Native Service Integration
- **🎯 Goal**: Trigger the native Google Account selector and obtain authentication tokens.
- **📂 File**: `lib/data/services/auth_service.dart`
- **💡 Concept to Understand**: `GoogleSignIn.signIn()` opens the system Google dialog on Android/iOS.
- **📝 What to do**:
  1. Instantiate `GoogleSignIn`.
  2. Call `await _googleSignIn.signIn()`.
  3. Retrieve `accessToken` and `idToken` from `account.authentication`.
- **🔍 How to Verify**: Trigger the method in a test button. Verify the Google Account picker dialog appears.

---

### Phase 12: Firebase Auth Credential Exchange
- **🎯 Goal**: Exchange the Google ID token for an authenticated Firebase User session.
- **📂 File**: Update `lib/data/services/auth_service.dart`
- **💡 Concept to Understand**: `FirebaseAuth.instance.signInWithCredential()` validates the Google token with Firebase Auth.
- **📝 What to do**:
  1. Convert Google tokens into `GoogleAuthProvider.credential(...)`.
  2. Call `FirebaseAuth.instance.signInWithCredential(credential)`.
  3. Return the authenticated `User` object.
- **🔍 How to Verify**: Complete Google sign-in. Verify `FirebaseAuth.instance.currentUser` is no longer null.

---

### Phase 13: Admin Roles & Primary Owner Check
- **🎯 Goal**: Check if the signed-in user is the Primary System Owner.
- **📂 File**: `lib/core/constants/roles.dart`
- **💡 Concept to Understand**: Comparing `user.email` with `PRIMARY_ADMIN_EMAIL` instantly grants root privileges.
- **📝 What to do**:
  1. Define `enum AdminRole { owner, secondary, unauthorized }`.
  2. Define `PRIMARY_ADMIN_EMAIL` constant.
  3. If `user.email.toLowerCase() == PRIMARY_ADMIN_EMAIL` → Return `AdminRole.owner`.
- **🔍 How to Verify**: Log in with your primary email. Confirm `AdminRole.owner` is returned.

---

### Phase 14: Secondary Admin Firestore Verification
- **🎯 Goal**: Check if non-owner users exist in the `accepted_admin_emails` Firestore collection.
- **📂 File**: Update `lib/data/services/auth_service.dart`
- **💡 Concept to Understand**: `FirebaseFirestore.instance.collection('accepted_admin_emails').doc(email).get()` verifies secondary admin access.
- **📝 What to do**:
  1. If email is not primary, query `/accepted_admin_emails/{email}`.
  2. If document exists → Return `AdminRole.secondary`.
  3. If document does not exist → Return `AdminRole.unauthorized`.
- **🔍 How to Verify**: Add a test email document in Firestore. Log in with that email and verify it receives `AdminRole.secondary`.

---

### Phase 15: Unauthorized Access Rejection & Audit Log
- **🎯 Goal**: Immediately kick out non-approved users and record a security log.
- **📂 File**: Update `lib/data/services/auth_service.dart`
- **💡 Concept to Understand**: Forcefully signing out unauthorized users prevents any data leaks.
- **📝 What to do**:
  1. When `AdminRole.unauthorized` occurs, call `await _auth.signOut()` and `await _googleSignIn.signOut()`.
  2. Write a security log to Firestore collection `/system_logs` with action `AUTH_LOGIN_UNAUTHORIZED`.
- **🔍 How to Verify**: Sign in with an unapproved Gmail account. Verify the session is rejected and an audit log appears in Firestore.

---

### Phase 16: Login Screen Card Container & Logo Header
- **🎯 Goal**: Build the centered card and branding header matching `admin_login.astro`.
- **📂 File**: `lib/presentation/auth/login_screen.dart`
- **💡 Concept to Understand**: `ConstrainedBox(maxWidth: 400)` keeps the login card centered and proportional across all device sizes.
- **📝 What to do**:
  1. Wrap screen in `AmbientBackground`.
  2. Center a container with `#1D1B20` surface color, `#2B2930` border, and `24px` rounded corners.
  3. Add the App Shield Logo with blue accent tint, title "saoudi.online", and subtitle "Admin Telemetry & Management".
- **🔍 How to Verify**: Run the app and visually inspect the login card layout.

---

### Phase 17: Google Sign-In Pill Button & Progress State
- **🎯 Goal**: Build the interactive Google button with loading spinner state.
- **📂 File**: Update `lib/presentation/auth/login_screen.dart`
- **💡 Concept to Understand**: Setting `onPressed: _isLoading ? null : _signIn` automatically disables the button during network calls.
- **📝 What to do**:
  1. Add a stadium-shaped button with `#211F26` surface background.
  2. Include the Google logo icon and text "Continue with Google".
  3. Toggle `_isLoading = true` while signing in and show `CircularProgressIndicator`.
- **🔍 How to Verify**: Tap the button. Verify the loading spinner appears while authentication is in flight.

---

### Phase 18: Login Error Banner & Feedback UI
- **🎯 Goal**: Display clear error feedback if an unauthorized user attempts to sign in.
- **📂 File**: Update `lib/presentation/auth/login_screen.dart`
- **💡 Concept to Understand**: Conditionally rendering a widget with `if (_errorMessage != null)` provides clean visual feedback.
- **📝 What to do**:
  1. Build a red warning container with `#F28B82` accent border and error icon.
  2. Display "Access denied. Your email is not an authorized administrator."
- **🔍 How to Verify**: Trigger an unauthorized login. Verify the red alert box appears cleanly below the header.

---

### Phase 19: Startup Route Guard & Auto-Login Logic
- **🎯 Goal**: Check if an admin is already signed in on startup and bypass the login screen.
- **📂 File**: `lib/presentation/auth/splash_screen.dart`
- **💡 Concept to Understand**: `Navigator.pushReplacement` transitions from splash to main content without leaving a back-button trail.
- **📝 What to do**:
  1. In `SplashScreen`, check `FirebaseAuth.instance.currentUser`.
  2. If user exists and is authorized → Navigate immediately to `AppShell`.
  3. If user is null or unauthorized → Navigate to `LoginScreen`.
- **🔍 How to Verify**: Log in, kill the app process, and restart it. The app should launch straight into the main shell.

---

### Phase 20: Floating Navigation Dock Container & Layout
- **🎯 Goal**: Build the floating bottom navigation bar matching `AdminNavDock.astro`.
- **📂 File**: `lib/presentation/navigation/nav_dock.dart`
- **💡 Concept to Understand**: Wrapping a floating container in `SafeArea` prevents overlaps with native device gesture bars.
- **📝 What to do**:
  1. Build a stadium-pill bar (`BorderRadius.circular(999)`), background `#1D1B20`, border `#2B2930`.
  2. Add 4 navigation items: Overview, Tasks, Logs, Admins.
- **🔍 How to Verify**: Check that the floating dock sits neatly centered at the bottom of the screen.

---

### Phase 21: Nav Dock Active Tab Expansion & Transitions
- **🎯 Goal**: Highlight active tabs with smooth width expansion and Google Blue tint.
- **📂 File**: Update `lib/presentation/navigation/nav_dock.dart`
- **💡 Concept to Understand**: `AnimatedContainer` smoothly animates background color, padding, and size changes automatically.
- **📝 What to do**:
  1. When a tab is selected, apply a Google Blue background tint (`alpha: 0.15`) and blue border.
  2. Animate the tab label into view when selected.
- **🔍 How to Verify**: Tap between dock icons and verify smooth animated tab transitions.

---

### Phase 22: App Shell Scaffold & `IndexedStack` Manager
- **🎯 Goal**: Coordinate top-level navigation between tabs without resetting state.
- **📂 File**: `lib/presentation/navigation/app_shell.dart`
- **💡 Concept to Understand**: `IndexedStack` keeps all 4 screens in memory so scroll positions and Firestore streams are never reset when switching tabs.
- **📝 What to do**:
  1. Create `AppShell` holding `_currentIndex`.
  2. Place `IndexedStack` in `Scaffold.body` containing the 4 primary screens.
  3. Place `NavDock` in `Scaffold.bottomNavigationBar`.
- **🔍 How to Verify**: Scroll down on a tab, switch to another tab, and switch back. Verify your scroll position is preserved.

---

## 📊 Milestone 3: Overview & Tasks Systems (Phases 23 – 27)

---

### Phase 23: Overview Dashboard Count Service
- **🎯 Goal**: Fetch server-side aggregate totals for portfolio collections.
- **📂 File**: `lib/data/services/metrics_service.dart`
- **💡 Concept to Understand**: `collection.count().get()` performs lightweight server aggregations without downloading document bodies.
- **📝 What to do**:
  1. Execute concurrent count queries with `Future.wait([ ... ])` for:
     - `projects`, `experience`, `designs`, `certificates`, and active `admin_todos`.
  2. Return the counts map.
- **🔍 How to Verify**: Execute the service and verify integer counts are returned from Firestore.

---

### Phase 24: Dashboard 2x2 Bento Metric Grid Screen
- **🎯 Goal**: Display live aggregate counts in a responsive 2x2 Bento grid.
- **📂 File**: `lib/presentation/dashboard/dashboard_screen.dart`
- **💡 Concept to Understand**: `GridView.count(crossAxisCount: 2)` renders items in a clean 2-column dashboard layout.
- **📝 What to do**:
  1. Use `FutureBuilder` to call `MetricsService`.
  2. Render 4 Bento Cards with `#1D1B20` surface container, `20px` corners, and dedicated Google accents:
     - Tasks → Yellow (`#FDD663`)
     - Projects → Blue (`#8AB4F8`)
     - Experience → Green (`#81C784`)
     - Designs → Red (`#F28B82`)
- **🔍 How to Verify**: Open the Dashboard tab. Verify the 4 Bento metric cards display live database counts.

---

### Phase 25: Admin Tasks Data Model & Firestore Stream
- **🎯 Goal**: Define the `AdminTask` data model and live Firestore query pipe.
- **📂 Files**: `lib/domain/models/admin_task.dart`, `lib/data/repositories/tasks_repository.dart`
- **💡 Concept to Understand**: `collection('admin_todos').snapshots()` provides a real-time reactive stream that emits new lists whenever Firestore changes.
- **📝 What to do**:
  1. Create `AdminTask` with fields: `id`, `title`, `category`, `priority`, `status`, `createdAt`.
  2. Create stream querying `/admin_todos` ordered by `createdAt desc`.
  3. If secondary admin, filter tasks where `createdBy == user.email`.
- **🔍 How to Verify**: Add a document manually in Firestore. Verify the stream immediately receives the new item.

---

### Phase 26: Admin Tasks Segmented Tabs & Task Item Card
- **🎯 Goal**: Display tasks with status filter tabs (Active / Done / Archive) and interactive checkboxes.
- **📂 File**: `lib/presentation/tasks/tasks_screen.dart`
- **💡 Concept to Understand**: `StreamBuilder` automatically updates the UI whenever new stream events arrive.
- **📝 What to do**:
  1. Build segmented filter buttons: **Active**, **Completed**, **Archived**.
  2. Build task item card with `#1D1B20` background, `#2B2930` border, and `16px` corners.
  3. Add Google Green `Checkbox`. When tapped → Update Firestore document status to `completed` or `active`.
  4. Render strike-through line on completed task titles.
- **🔍 How to Verify**: Tap the checkbox on a task. Verify the task moves from Active to Completed tab instantly.

---

### Phase 27: Task Creation Bottom Sheet & Context Menu
- **🎯 Goal**: Provide an easy modal sheet to add tasks and context actions to archive/delete.
- **📂 File**: `lib/presentation/tasks/widgets/create_task_sheet.dart`
- **💡 Concept to Understand**: `showModalBottomSheet` slides a modal up from the screen bottom with text inputs.
- **📝 What to do**:
  1. Add a `+` button in the AppBar.
  2. Open a modal bottom sheet with `#211F26` surface container.
  3. Include Title input, Category chips (Bug, Feature, Idea, General), and Priority segment.
  4. On submit → Generate a `task_UUID` and save to `/admin_todos/{id}`.
  5. Add Archive / Delete buttons on task items (Delete restricted to Owner).
- **🔍 How to Verify**: Create a new task through the sheet. Verify it appears at the top of the list immediately.

---

## 📜 Milestone 4: Logs, Admins & Release (Phases 28 – 30)

---

### Phase 28: System Audit Logs Stream & Category Filters
- **🎯 Goal**: Stream real-time telemetry events with horizontal filter chips.
- **📂 File**: `lib/presentation/logs/logs_screen.dart`
- **💡 Concept to Understand**: Querying `/system_logs` ordered by `timestamp desc` provides an active security and audit log feed.
- **📝 What to do**:
  1. Create `SystemLog` model with fields: `id`, `type`, `severity`, `action`, `title`, `userEmail`, `timestamp`.
  2. Stream the collection with limit `50`.
  3. Build horizontal filter chips: `All`, `Auth`, `Content`, `Admin`, `Security`, `Visitor`, `Task`, `Storage`, `System`.
- **🔍 How to Verify**: Tap the "Auth" filter chip. Verify that only authentication events remain displayed.

---

### Phase 29: Log Severity Indicators, Search & Purge
- **🎯 Goal**: Add color-coded severity dots, search filter, and retention purge action.
- **📂 File**: Update `lib/presentation/logs/logs_screen.dart`
- **💡 Concept to Understand**: Firestore batched deletes remove expired records atomically in a single network request.
- **📝 What to do**:
  1. Add colored severity indicator dots:
     - `info` → Google Blue (`#8AB4F8`)
     - `warn` → Google Yellow (`#FDD663`)
     - `error` / `critical` → Google Red (`#F28B82`)
  2. Format timestamps with relative time (e.g. "Just now", "5m ago").
  3. Add search input filtering logs by title or email.
  4. Add "Purge Expired" button (Owner only) deleting logs where `expiresAt <= now`.
- **🔍 How to Verify**: Inspect log cards. Verify error logs display red dots and the search bar filters logs in real-time.

---

### Phase 30: Admin Emails Access Control Management
- **🎯 Goal**: Stream authorized admin accounts and build grant/revoke modal dialogs.
- **📂 File**: `lib/presentation/emails/emails_screen.dart`
- **💡 Concept to Understand**: Managing documents in `/accepted_admin_emails` directly controls which Google accounts can access the system.
- **📝 What to do**:
  1. Stream `/accepted_admin_emails` collection.
  2. Pin the Primary Owner at the top of the list with a Google Blue Shield icon and "Owner" badge (locked from deletion).
  3. **Grant Access Modal**: Dialog prompts for email and notes → Creates `/accepted_admin_emails/{email}`.
  4. **Revoke Access**: Trash icon next to secondary admins prompts confirmation → Deletes Firestore document.
- **🔍 How to Verify**: Grant access to a secondary test email. Verify the new admin appears in the list and can log into the app.

---

## 🏁 Final Progress Checklist (1 to 30)

- [ ] **Phase 01**: Dependencies added & `flutter pub get` clean
- [ ] **Phase 02**: Asset folders & icons placed
- [ ] **Phase 03**: Android `google-services.json` linked
- [ ] **Phase 04**: iOS `GoogleService-Info.plist` linked
- [ ] **Phase 05**: Firebase initialized in `main.dart`
- [ ] **Phase 06**: Google brand color tokens defined
- [ ] **Phase 07**: Zero-shadow `AppTheme.darkTheme` applied
- [ ] **Phase 08**: Google Fonts typography active
- [ ] **Phase 09**: Ambient particle canvas math written
- [ ] **Phase 10**: Ambient background looping animation active
- [ ] **Phase 11**: Google Sign-In service prompts account picker
- [ ] **Phase 12**: Firebase Auth credential exchange functional
- [ ] **Phase 13**: Primary owner email check working
- [ ] **Phase 14**: Secondary admin Firestore check working
- [ ] **Phase 15**: Unauthorized user rejection & audit logging active
- [ ] **Phase 16**: Login screen card layout & branding rendered
- [ ] **Phase 17**: Google Sign-In pill button & loading spinner working
- [ ] **Phase 18**: Error feedback banner visible on unauthorized login
- [ ] **Phase 19**: Splash screen auto-login route guard active
- [ ] **Phase 20**: Floating stadium navigation dock rendered
- [ ] **Phase 21**: Nav dock tab expansion & transitions working
- [ ] **Phase 22**: App shell `IndexedStack` preserving tab states
- [ ] **Phase 23**: Server-side aggregate count query service active
- [ ] **Phase 24**: Dashboard 2x2 Bento metric grid displaying live counts
- [ ] **Phase 25**: Admin tasks data model & real-time stream pipe ready
- [ ] **Phase 26**: Tasks screen segmented tabs & checkbox toggling functional
- [ ] **Phase 27**: Task creation modal bottom sheet saving to Firestore
- [ ] **Phase 28**: System audit logs streaming with category filter chips
- [ ] **Phase 29**: Log severity dots, search filter & purge active
- [ ] **Phase 30**: Admin emails list, grant access & revoke dialogs complete
