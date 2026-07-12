import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getEnv } from './env';

/**
 * Type definition for the required Firebase Admin environment variables.
 */
type FirebaseAdminEnv = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket?: string;
};

/**
 * Reads Firebase configuration from the environment.
 * Throws an error if required credentials are not found.
 * Handles the formatting of the private key.
 *
 * @returns {FirebaseAdminEnv} The parsed Firebase Admin environment variables.
 */
function readFirebaseAdminEnv(): FirebaseAdminEnv {
  const projectId = getEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = getEnv('FIREBASE_PRIVATE_KEY');
  const storageBucket = getEnv('FIREBASE_STORAGE_BUCKET');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in the server environment.'
    );
  }

  return {
    projectId,
    clientEmail,
    // Ensure the private key has correct newline formatting when read from environment variables
    privateKey: privateKey.replace(/\\n/g, '\n'),
    storageBucket,
  };
}

/**
 * Initializes and returns the Firebase Admin App instance as a singleton.
 * Prevents multiple initializations during hot reloads or multiple invocations.
 *
 * @returns {App} The initialized Firebase Admin application instance.
 */
export function getFirebaseAdminApp(): App {
  const existingApp = getApps()[0];

  // Return existing instance if it was already initialized
  if (existingApp) {
    return existingApp;
  }

  const firebaseAdminEnv = readFirebaseAdminEnv();

  // Initialize a new Firebase Admin app using the provided credentials
  return initializeApp({
    credential: cert({
      projectId: firebaseAdminEnv.projectId,
      clientEmail: firebaseAdminEnv.clientEmail,
      privateKey: firebaseAdminEnv.privateKey,
    }),
    storageBucket: firebaseAdminEnv.storageBucket,
  });
}

/**
 * Retrieves the Firebase Auth service instance.
 */
export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

/**
 * Retrieves the Firestore Database service instance.
 */
export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

/**
 * Retrieves the Firebase Storage service instance.
 */
export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}