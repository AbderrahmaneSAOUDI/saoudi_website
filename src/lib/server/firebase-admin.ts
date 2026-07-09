import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getEnv } from './env';

type FirebaseAdminEnv = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket?: string;
};

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
    privateKey: privateKey.replace(/\\n/g, '\n'),
    storageBucket,
  };
}

export function getFirebaseAdminApp(): App {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const firebaseAdminEnv = readFirebaseAdminEnv();

  return initializeApp({
    credential: cert({
      projectId: firebaseAdminEnv.projectId,
      clientEmail: firebaseAdminEnv.clientEmail,
      privateKey: firebaseAdminEnv.privateKey,
    }),
    storageBucket: firebaseAdminEnv.storageBucket,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}