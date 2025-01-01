// src/userService.ts

import { db, auth } from './firebase';
import admin from 'firebase-admin';

// Funktion zum Erstellen eines neuen Benutzers
export async function createUser(email: string, password: string) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Speichere zusätzliche Benutzerdaten in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      subscription: 'base', // Standard-Abonnement
      rewardsPoints: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return userRecord;
  } catch (error) {
    throw error;
  }
}
