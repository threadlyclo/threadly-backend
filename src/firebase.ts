// src/firebase.ts

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Pfad zu deiner Service Account Key Datei
const serviceAccountPath = path.resolve(__dirname, 'config', 'master-coder-446416-r3-firebase-adminsdk-m3ban-2cce134c8a.json');

// Initialisiere Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Verwende die Umgebungsvariable
});

// Firestore-Instanz
const db = getFirestore();

// Auth-Instanz
const auth = getAuth();

export { db, auth };
