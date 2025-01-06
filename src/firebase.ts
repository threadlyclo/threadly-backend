// src/firebase.ts

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

/**
 * Funktion zum Abrufen des Firebase Service Account Secrets
 */
async function getFirebaseServiceAccount(): Promise<any> {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error('Umgebungsvariable GCP_PROJECT_ID ist nicht gesetzt.');
  }

  const secretName = `projects/${projectId}/secrets/FIREBASE_SERVICE_ACCOUNT/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({
      name: secretName,
    });

    const payload = version.payload?.data?.toString();

    if (!payload) {
      throw new Error('Secret FIREBASE_SERVICE_ACCOUNT ist leer');
    }

    return JSON.parse(payload);
  } catch (error) {
    console.error('Fehler beim Abrufen des Secrets:', error);
    throw error;
  }
}

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

/**
 * Funktion zur Initialisierung von Firebase Admin SDK
 */
export async function initializeFirebase() {
  const serviceAccount = await getFirebaseServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Diese Variable kannst du weiterhin über Environment Variables setzen
  });

  db = getFirestore();
  auth = getAuth();
}

export { db, auth };
