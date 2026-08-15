# 🚀 Beginner-Friendly Flutter Roadmap & Implementation Guide (`saoudi_app`)

> **Who is this guide for?**
> This guide is crafted for developers who are new to Flutter. It explains every concept in plain English, provides clean, copy-paste-ready code snippets with line-by-line comments, and guides you step-by-step through building **`saoudi_app`** (the standalone mobile companion for `saoudi.online`).

---

## 📚 Core Flutter Concepts Explained Simply

Before writing code, here are the 4 main Flutter concepts you need to know:

1. **Everything is a Widget**: In Flutter, buttons, text, padding, cards, and even the whole screen are called **Widgets**. You compose widgets inside other widgets like LEGO bricks.
2. **`StatelessWidget` vs `StatefulWidget`**:
   - `StatelessWidget`: A widget that **never changes** on its own (like a static icon, a label, or a card).
   - `StatefulWidget`: A widget that **can change over time** (like an input field, an animation controller, or a screen where user taps toggle values).
3. **`BuildContext`**: Think of `context` as a map location. It tells Flutter *where* a widget lives inside the widget tree so it can look up themes, screen sizes, or navigation routers.
4. **`StreamBuilder`**: A widget that listens to a real-time stream (like Cloud Firestore updates). Whenever data changes in the database, `StreamBuilder` automatically redraws your screen with the fresh data!

---

## 🛠️ Prerequisites & Setup

### Step 0.1: Install Dependencies (`pubspec.yaml`)
In your Flutter project root, open `pubspec.yaml` and make sure you have these dependencies:

```yaml
name: saoudi_app
description: "Standalone Material 3 Dark Admin app for saoudi.online"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: ">=3.19.0"

dependencies:
  flutter:
    sdk: flutter

  # Firebase SDKs
  firebase_core: ^3.12.1
  firebase_auth: ^5.5.1
  cloud_firestore: ^5.6.5
  google_sign_in: ^6.2.2

  # State & Storage
  flutter_riverpod: ^2.6.1
  flutter_secure_storage: ^9.2.4

  # Fonts & Utilities
  google_fonts: ^6.2.1
  intl: ^0.20.2
  share_plus: ^10.1.4
  uuid: ^4.5.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/icons/
    - assets/images/
```

Run in your terminal:
```bash
flutter pub get
```

---

## 🗺️ Step-by-Step Build Order

```
Step 1: Color Palette & Zero-Shadow Theme Tokens
Step 2: Ambient Background Motion Animation
Step 3: Firebase Auth Service & Role Gating Logic
Step 4: Pixel-Perfect Login Screen
Step 5: Auto-Login & Splash Route Guard
Step 6: Floating Navigation Dock & App Shell
Step 7: Dashboard Overview Screen (Live Metrics)
Step 8: Admin Tasks & Todos Screen (admin_todos)
Step 9: System Audit Logs Screen (system_logs)
Step 10: Admin Emails Screen (accepted_admin_emails)
Step 11: Verification & Running on Device
```

---

## 🎨 Step 1: Color Palette & Zero-Shadow Theme

### Why is this important?
The website has an **Absolute Shadow Ban** (no blurry drop shadows). Elevation is expressed purely through solid Material 3 dark surface colors and border strokes.

### Create: `lib/core/theme/colors.dart`
```dart
import 'package:flutter/material.dart';

/// Central Google Brand Color Palette & Material 3 Dark Surface Colors
class AppColors {
  // Google Brand Accents
  static const Color googleBlue = Color(0xFF8AB4F8);    // Primary (#8AB4F8 / #4285F4)
  static const Color googleGreen = Color(0xFF81C784);   // Secondary / Success (#81C784 / #0F9D58)
  static const Color googleYellow = Color(0xFFFDD663);  // Tertiary / Warning (#FDD663 / #F9AB00)
  static const Color googleRed = Color(0xFFF28B82);     // Error / Destructive (#F28B82 / #EA4335)

  // Material 3 Dark Surface Layers (Strictly Dark Mode)
  static const Color surfaceCanvas = Color(0xFF121212);           // Main scaffold background
  static const Color surfaceContainer = Color(0xFF1D1B20);        // Card containers
  static const Color surfaceContainerHigh = Color(0xFF211F26);    // Inputs, active sheets & modal dialogs
  static const Color border = Color(0xFF2B2930);                  // Clean border outlines

  // Typography Colors
  static const Color textPrimary = Color(0xFFFFFFFF);             // 100% White text
  static const Color textSecondary = Color(0xB3E6E1E5);           // 70% Muted white text
  static const Color textMuted = Color(0x66E6E1E5);               // 40% Subtle placeholder text
}
```

### Create: `lib/core/theme/app_theme.dart`
```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'colors.dart';

/// Configures the entire Flutter app theme with ZERO visual shadows
class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.surfaceCanvas,
      
      // Zero elevation across all surfaces
      cardTheme: const CardThemeData(
        elevation: 0,
        color: AppColors.surfaceContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(24)),
          side: BorderSide(color: AppColors.border, width: 1),
        ),
      ),

      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.transparent,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),

      // Input / TextField styling
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceContainerHigh,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.googleBlue, width: 1.5),
        ),
      ),

      // Global Font Family
      textTheme: GoogleFonts.interTextTheme(
        ThemeData(brightness: Brightness.dark).textTheme,
      ),
    );
  }
}
```

---

## ✨ Step 2: Ambient Background Motion Animation

### Why is this important?
The website has a moving star/dot ambient background. In Flutter, we use `CustomPainter` combined with an `AnimationController` to smoothly draw and move these particles with 60 FPS performance without lagging the phone.

### Create: `lib/presentation/common/ambient_background.dart`
```dart
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';

/// Wraps any screen with the signature floating Google-color dots & star grid animation
class AmbientBackground extends StatefulWidget {
  final Widget child;
  const AmbientBackground({super.key, required this.child});

  @override
  State<AmbientBackground> createState() => _AmbientBackgroundState();
}

class _AmbientBackgroundState extends State<AmbientBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    // Smooth 30-second continuous looping animation
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 30),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 1. Solid Canvas Background
        Container(color: AppColors.surfaceCanvas),

        // 2. Animated Custom Paint Layer
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return CustomPaint(
                painter: _AmbientPainter(progress: _controller.value),
              );
            },
          ),
        ),

        // 3. Main Screen Content on Top
        Positioned.fill(child: widget.child),
      ],
    );
  }
}

class _AmbientPainter extends CustomPainter {
  final double progress;
  _AmbientPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    // Math angles for gentle floating movement
    final double angle = progress * 2 * math.pi;
    final double offsetX = math.sin(angle) * 30;
    final double offsetY = math.cos(angle) * 20;

    // 1. Draw Google Brand Color Radial Accent Points
    _drawColoredDot(canvas, Offset(size.width * 0.15 + offsetX, size.height * 0.2 + offsetY), AppColors.googleBlue, 2.5);
    _drawColoredDot(canvas, Offset(size.width * 0.85 - offsetX, size.height * 0.35 + offsetY), AppColors.googleGreen, 2.2);
    _drawColoredDot(canvas, Offset(size.width * 0.3 + offsetX, size.height * 0.7 - offsetY), AppColors.googleYellow, 2.0);
    _drawColoredDot(canvas, Offset(size.width * 0.75 - offsetX, size.height * 0.8 + offsetY), AppColors.googleRed, 2.3);

    // 2. Draw Subtle Star Grid Points
    final Paint starPaint = Paint()..color = Colors.white.withValues(alpha: 0.12);
    const double step = 60.0;
    for (double x = 20; x < size.width; x += step) {
      for (double y = 20; y < size.height; y += step) {
        canvas.drawCircle(Offset(x, y), 0.75, starPaint);
      }
    }
  }

  void _drawColoredDot(Canvas canvas, Offset center, Color color, double radius) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(covariant _AmbientPainter oldDelegate) => oldDelegate.progress != progress;
}
```

---

## 🔐 Step 3: Firebase Auth & Role-Gating Logic

### How it works:
1. User logs in with Google.
2. We check if their email matches `PRIMARY_ADMIN_EMAIL`.
3. If not primary, we check if their email document exists in the `/accepted_admin_emails` Firestore collection.
4. If neither, we kick them out (sign out) and show an error message.

### Create: `lib/data/services/auth_service.dart`
```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

enum AdminRole { owner, secondary, unauthorized }

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Replace with your primary email
  static const String primaryAdminEmail = 'saoudi.abderrahmane26@gmail.com';

  /// Stream of current authenticated user
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  /// Sign in with Google and evaluate role
  Future<AdminRole> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return AdminRole.unauthorized; // User cancelled

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final OAuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      final String email = (userCredential.user?.email ?? '').toLowerCase().trim();

      // 1. Check if Primary Owner
      if (email == primaryAdminEmail.toLowerCase()) {
        return AdminRole.owner;
      }

      // 2. Check if Secondary Admin in Firestore
      final docSnap = await _firestore.collection('accepted_admin_emails').doc(email).get();
      if (docSnap.exists) {
        return AdminRole.secondary;
      }

      // 3. Not authorized -> Sign out immediately
      await signOut();
      return AdminRole.unauthorized;
    } catch (e) {
      await signOut();
      return AdminRole.unauthorized;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  /// Check current user's role
  Future<AdminRole> checkCurrentRole() async {
    final user = _auth.currentUser;
    if (user == null) return AdminRole.unauthorized;

    final email = (user.email ?? '').toLowerCase().trim();
    if (email == primaryAdminEmail.toLowerCase()) return AdminRole.owner;

    final docSnap = await _firestore.collection('accepted_admin_emails').doc(email).get();
    if (docSnap.exists) return AdminRole.secondary;

    return AdminRole.unauthorized;
  }
}
```

---

## 📱 Step 4: Pixel-Perfect Login Screen

### Create: `lib/presentation/auth/login_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../data/services/auth_service.dart';
import '../common/ambient_background.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final role = await _authService.signInWithGoogle();

    if (!mounted) return;

    if (role == AdminRole.owner || role == AdminRole.secondary) {
      widget.onLoginSuccess();
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Access denied. Your email is not an authorized admin.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AmbientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.border, width: 1),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // App Logo Icon
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.googleBlue.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.googleBlue.withValues(alpha: 0.3)),
                      ),
                      child: const Icon(
                        Icons.shield_rounded,
                        color: AppColors.googleBlue,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Heading
                    const Text(
                      'saoudi.online',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Admin Telemetry & Management',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Error Banner if unauthorized
                    if (_errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.googleRed.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.googleRed.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: AppColors.googleRed, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(fontSize: 12, color: AppColors.googleRed),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Google Sign-In Pill Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : _handleGoogleSignIn,
                        style: OutlinedButton.styleFrom(
                          backgroundColor: AppColors.surfaceContainerHigh,
                          side: const BorderSide(color: AppColors.border),
                          shape: const StadiumBorder(),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.googleBlue),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(Icons.g_mobiledata_rounded, size: 28, color: AppColors.googleBlue),
                                  SizedBox(width: 8),
                                  Text(
                                    'Continue with Google',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 🚪 Step 5: Splash Screen & Auto-Login Guard

### Create: `lib/presentation/auth/splash_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../data/services/auth_service.dart';
import '../navigation/app_shell.dart';
import 'login_screen.dart';

/// Checks if user is already logged in and routes them to AppShell or LoginScreen
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 500)); // Small smooth splash delay
    final role = await _authService.checkCurrentRole();

    if (!mounted) return;

    if (role == AdminRole.owner || role == AdminRole.secondary) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => AppShell(isOwner: role == AdminRole.owner)),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => LoginScreen(
            onLoginSuccess: () => _checkAuth(),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(color: Color(0xFF8AB4F8)),
      ),
    );
  }
}
```

---

## ⚓ Step 6: Floating Pill Navigation Dock & App Shell

### Create: `lib/presentation/navigation/app_shell.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../dashboard/dashboard_screen.dart';
import '../tasks/tasks_screen.dart';
import '../logs/logs_screen.dart';
import '../emails/emails_screen.dart';

class AppShell extends StatefulWidget {
  final bool isOwner;
  const AppShell({super.key, required this.isOwner});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  late final List<Widget> _screens = [
    const DashboardScreen(),
    const TasksScreen(),
    const LogsScreen(),
    EmailsScreen(isOwner: widget.isOwner),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // IndexedStack preserves scroll positions of tabs when switching
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),

      // Floating Stadium Bottom Navigation Dock
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Container(
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.border, width: 1),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(0, Icons.dashboard_rounded, 'Overview'),
                _buildNavItem(1, Icons.task_alt_rounded, 'Tasks'),
                _buildNavItem(2, Icons.receipt_long_rounded, 'Logs'),
                _buildNavItem(3, Icons.admin_panel_settings_rounded, 'Admins'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final bool isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.googleBlue.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: isSelected ? Border.all(color: AppColors.googleBlue.withValues(alpha: 0.3)) : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? AppColors.googleBlue : AppColors.textSecondary,
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.googleBlue,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## 📊 Step 7: Dashboard Overview Screen (Live Metrics)

### Create: `lib/presentation/dashboard/dashboard_screen.dart`
```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../common/ambient_background.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  Future<Map<String, int>> _fetchCounts() async {
    final db = FirebaseFirestore.instance;
    final results = await Future.wait([
      db.collection('projects').count().get(),
      db.collection('experience').count().get(),
      db.collection('designs').count().get(),
      db.collection('certificates').count().get(),
      db.collection('admin_todos').where('status', isEqualTo: 'active').count().get(),
    ]);

    return {
      'projects': results[0].count ?? 0,
      'experience': results[1].count ?? 0,
      'designs': results[2].count ?? 0,
      'certificates': results[3].count ?? 0,
      'activeTasks': results[4].count ?? 0,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: AmbientBackground(
        child: FutureBuilder<Map<String, int>>(
          future: _fetchCounts(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: AppColors.googleBlue));
            }
            final counts = snapshot.data ?? {};

            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Bento Metrics 2x2 Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                  childAspectRatio: 1.3,
                  children: [
                    _buildStatCard('Active Tasks', counts['activeTasks'] ?? 0, Icons.task_alt_rounded, AppColors.googleYellow),
                    _buildStatCard('Projects', counts['projects'] ?? 0, Icons.code_rounded, AppColors.googleBlue),
                    _buildStatCard('Experience', counts['experience'] ?? 0, Icons.work_outline_rounded, AppColors.googleGreen),
                    _buildStatCard('Designs', counts['designs'] ?? 0, Icons.brush_rounded, AppColors.googleRed),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, int count, IconData icon, Color accent) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: accent, size: 22),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                count.toString(),
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: accent),
              ),
              Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## 📋 Step 8: Admin Tasks & Todos Screen (`admin_todos`)

### Create: `lib/presentation/tasks/tasks_screen.dart`
```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../common/ambient_background.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  String _selectedTab = 'active'; // 'active' | 'completed' | 'archived'

  void _showCreateTaskSheet() {
    final titleController = TextEditingController();
    String category = 'General';
    String priority = 'Medium';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceContainerHigh,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Create New Task', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 14),
              TextField(
                controller: titleController,
                autofocus: true,
                decoration: const InputDecoration(hintText: 'Task title...'),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.googleGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () async {
                    if (titleController.text.trim().isEmpty) return;
                    await FirebaseFirestore.instance.collection('admin_todos').add({
                      'title': titleController.text.trim(),
                      'category': category,
                      'priority': priority,
                      'status': 'active',
                      'createdAt': DateTime.now().toUtc().toIso8601String(),
                    });
                    if (context.mounted) Navigator.pop(context);
                  },
                  child: const Text('Add Task', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks & Todos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            onPressed: _showCreateTaskSheet,
            icon: const Icon(Icons.add_rounded, color: AppColors.googleBlue),
          ),
        ],
      ),
      body: AmbientBackground(
        child: Column(
          children: [
            // Segmented Tabs
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: ['active', 'completed', 'archived'].map((tab) {
                  final isSelected = _selectedTab == tab;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedTab = tab),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.googleBlue : AppColors.surfaceContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            tab[0].toUpperCase() + tab.substring(1),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            // Live Tasks Stream
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('admin_todos')
                    .where('status', isEqualTo: _selectedTab)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator(color: AppColors.googleBlue));
                  }
                  final docs = snapshot.data?.docs ?? [];
                  if (docs.isEmpty) {
                    return const Center(
                      child: Text('No tasks in this tab', style: TextStyle(color: AppColors.textMuted)),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: docs.length,
                    itemBuilder: (context, index) {
                      final data = docs[index].data() as Map<String, dynamic>;
                      final id = docs[index].id;
                      final isDone = data['status'] == 'completed';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainer,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Checkbox(
                              value: isDone,
                              activeColor: AppColors.googleGreen,
                              onChanged: (val) {
                                docs[index].reference.update({
                                  'status': val == true ? 'completed' : 'active',
                                });
                              },
                            ),
                            Expanded(
                              child: Text(
                                data['title'] ?? '',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                  decoration: isDone ? TextDecoration.lineThrough : null,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.archive_outlined, size: 18, color: AppColors.textSecondary),
                              onPressed: () => docs[index].reference.update({'status': 'archived'}),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 📜 Step 9: System Audit Logs Screen (`system_logs`)

### Create: `lib/presentation/logs/logs_screen.dart`
```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../common/ambient_background.dart';

class LogsScreen extends StatelessWidget {
  const LogsScreen({super.key});

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return AppColors.googleRed;
      case 'warn':
        return AppColors.googleYellow;
      default:
        return AppColors.googleBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('System Audit Logs', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: AmbientBackground(
        child: StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('system_logs')
              .orderBy('timestamp', descending: true)
              .limit(50)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: AppColors.googleBlue));
            }
            final docs = snapshot.data?.docs ?? [];
            if (docs.isEmpty) {
              return const Center(child: Text('No logs available', style: TextStyle(color: AppColors.textMuted)));
            }

            return ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: docs.length,
              itemBuilder: (context, index) {
                final data = docs[index].data() as Map<String, dynamic>;
                final severity = data['severity'] ?? 'info';
                final accentColor = _getSeverityColor(severity);

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Severity Dot Indicator
                      Container(
                        width: 10,
                        height: 10,
                        margin: const EdgeInsets.only(top: 4, right: 12),
                        decoration: BoxDecoration(color: accentColor, shape: BoxShape.circle),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              data['title'] ?? 'Log Event',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              data['userEmail'] ?? 'system',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
```

---

## 📧 Step 10: Admin Emails Screen (`accepted_admin_emails`)

### Create: `lib/presentation/emails/emails_screen.dart`
```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../common/ambient_background.dart';

class EmailsScreen extends StatelessWidget {
  final bool isOwner;
  const EmailsScreen({super.key, required this.isOwner});

  void _showAddEmailDialog(BuildContext context) {
    final emailController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceContainerHigh,
        title: const Text('Grant Admin Access', style: TextStyle(fontSize: 16)),
        content: TextField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(hintText: 'admin@example.com'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.googleGreen),
            onPressed: () async {
              final email = emailController.text.trim().toLowerCase();
              if (email.isEmpty) return;

              await FirebaseFirestore.instance.collection('accepted_admin_emails').doc(email).set({
                'email': email,
                'addedAt': DateTime.now().toUtc().toIso8601String(),
                'isPrimary': false,
              });

              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Grant Access', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Authorized Admins', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          if (isOwner)
            IconButton(
              icon: const Icon(Icons.person_add_alt_1_rounded, color: AppColors.googleBlue),
              onPressed: () => _showAddEmailDialog(context),
            ),
        ],
      ),
      body: AmbientBackground(
        child: StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance.collection('accepted_admin_emails').snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: AppColors.googleBlue));
            }
            final docs = snapshot.data?.docs ?? [];

            return ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: docs.length,
              itemBuilder: (context, index) {
                final data = docs[index].data() as Map<String, dynamic>;
                final email = data['email'] ?? docs[index].id;
                final isPrimary = data['isPrimary'] == true;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isPrimary ? Icons.shield_rounded : Icons.person_rounded,
                        color: isPrimary ? AppColors.googleBlue : AppColors.googleGreen,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          email,
                          style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                        ),
                      ),
                      if (isOwner && !isPrimary)
                        IconButton(
                          icon: const Icon(Icons.delete_outline_rounded, color: AppColors.googleRed, size: 18),
                          onPressed: () => docs[index].reference.delete(),
                        ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
```

---

## 🚀 Step 11: Main App Entrypoint & Run

### Create: `lib/main.dart`
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'presentation/auth/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(); // Connects to your Firebase project
  runApp(const SaoudiApp());
}

class SaoudiApp extends StatelessWidget {
  const SaoudiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Saoudi Admin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const SplashScreen(),
    );
  }
}
```

---

## ⚡ How to Run on Device / Emulator

1. Connect your Android device or start an emulator.
2. Run:
   ```bash
   flutter run
   ```
3. Test static code quality anytime:
   ```bash
   flutter analyze
   ```
