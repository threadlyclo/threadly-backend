// src/firebase.ts

import admin from 'firebase-admin';
import { getSecret } from './secrets.js';

/**
 * Ruft das Firebase-Service-Konto aus dem Secret Manager ab.
 * @returns Promise mit dem Service-Konto-JSON
 */
async function getFirebaseServiceAccount(): Promise<admin.ServiceAccount> {
  const serviceAccountJson = await getSecret('FIREBASE_SERVICE_ACCOUNT');
  const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

  return serviceAccount;
}

// Firebase-Instanzen
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

/**
 * Initialisiert Firebase mit dem Service-Konto aus dem Secret Manager.
 */
export async function initializeFirebase(): Promise<void> {
  try {
    const serviceAccount = await getFirebaseServiceAccount();

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Diese Variable kannst du weiterhin über den Secret Manager laden, falls nötig
    });

    db = admin.firestore();
    auth = admin.auth();

    console.log('Firebase Admin SDK erfolgreich initialisiert.');
  } catch (error) {
    console.error('Fehler bei der Initialisierung von Firebase:', error);
    throw error;
  }
}

export { db, auth };
