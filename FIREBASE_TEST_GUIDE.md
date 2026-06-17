# Firebase Configuration Test Guide

## What is Firebase Admin SDK?

Firebase Admin SDK is the server-side library that lets your Astro backend communicate with Firebase services (Firestore, Authentication, Storage, etc.). It requires authentication credentials to work.

## How it Works

Your project needs 3 secret keys from Firebase:

1. **FIREBASE_PROJECT_ID** - Your Firebase project name
2. **FIREBASE_CLIENT_EMAIL** - Service account email
3. **FIREBASE_PRIVATE_KEY** - Private key for authentication

These should **never** be committed to Git (security risk!). Instead, they're stored in a `.env.local` file that Git ignores.

## Running the Test

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file (it contains your 3 credentials)

### Step 2: Create `.env.local`

In your project root, create a `.env.local` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important**: The private key must have `\n` for newlines when in an env file!

### Step 3: Run the Test

```bash
node test-firebase.js
```

## Expected Output (Success)

```mermaid
🔍 Firebase Configuration Test

Step 1: Checking environment variables...
  ✅ FIREBASE_PROJECT_ID: SET
  ✅ FIREBASE_CLIENT_EMAIL: SET
  ✅ FIREBASE_PRIVATE_KEY: SET

✅ All environment variables found!

Step 2: Initializing Firebase Admin SDK...
✅ Firebase initialized successfully!

Step 3: Testing Firestore connection...
✅ Firestore connection successful!

🎉 All tests passed! Firebase is properly configured.
```

## Troubleshooting

### ❌ "Missing required environment variables"**

- Make sure `.env.local` exists in your project root
- Double-check variable names (they're case-sensitive)

### ❌ "Firebase initialization failed"**

- The credentials in `.env.local` are invalid or corrupted
- Get a new private key from Firebase Console

### ❌ "Firestore connection failed"**

- The Firebase project doesn't have Firestore enabled
- Enable it in Firebase Console: **Build** → **Firestore Database**

## Security Best Practices

✅ **DO:**

- Add `.env.local` to `.gitignore` (it usually already is)
- Store credentials in environment variables
- Use different service accounts for different environments

❌ **DON'T:**

- Commit `.env.local` to Git
- Share credentials in chat or emails
- Use the same credentials everywhere
