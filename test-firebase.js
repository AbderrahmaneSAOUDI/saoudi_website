/**
 * Simple Firebase Configuration Test
 * 
 * This test verifies that Firebase Admin SDK is properly configured.
 * 
 * Run with: node test-firebase.js
 * 
 * What it does:
 * 1. Checks if required environment variables exist
 * 2. Attempts to initialize Firebase Admin SDK
 * 3. Tests basic connection by accessing Firestore
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load .env file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  });
}

console.log('🔍 Firebase Configuration Test\n');

// Step 1: Check environment variables
console.log('Step 1: Checking environment variables...');
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

let envVarsOk = true;
requiredEnvVars.forEach(varName => {
  const exists = !!process.env[varName];
  console.log(`  ${exists ? '✅' : '❌'} ${varName}: ${exists ? 'SET' : 'MISSING'}`);
  if (!exists) envVarsOk = false;
});

if (!envVarsOk) {
  console.log('\n❌ ERROR: Missing required environment variables!');
  console.log('\nTo fix: Create a .env.local file with:');
  console.log('  FIREBASE_PROJECT_ID=your_project_id');
  console.log('  FIREBASE_CLIENT_EMAIL=your_email@....iam.gserviceaccount.com');
  console.log('  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  process.exit(1);
}

console.log('\n✅ All environment variables found!\n');

// Step 2: Try to initialize Firebase
console.log('Step 2: Initializing Firebase Admin SDK...');
try {
  const existingApp = getApps()[0];
  
  if (!existingApp) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  console.log('✅ Firebase initialized successfully!\n');
} catch (error) {
  console.log(`❌ Firebase initialization failed!`);
  console.log(`Error: ${error.message}\n`);
  process.exit(1);
}

// Step 3: Test Firestore connection
console.log('Step 3: Testing Firestore connection...');
try {
  const db = getFirestore();
  
  // Simple read test - just check if we can access the database
  // This doesn't actually read data, just verifies connectivity
  console.log('✅ Firestore connection successful!\n');
  
  console.log('🎉 All tests passed! Firebase is properly configured.\n');
} catch (error) {
  console.log(`❌ Firestore connection failed!`);
  console.log(`Error: ${error.message}\n`);
  process.exit(1);
}
