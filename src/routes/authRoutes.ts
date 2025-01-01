// src/routes/authRoutes.ts

import express from 'express';
import { createUser } from '../userService';

const router = express.Router();

// Registrierung
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await createUser(email, password);
    res.status(201).json({ uid: user.uid, email: user.email });
  } catch (error: any) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: error.message || 'Registrierungsfehler' });
  }
});

// Anmeldung (Vereinfachtes Beispiel, hier sollte ein Token generiert werden)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Firebase Admin SDK bietet keine direkte Login-Methode
    // Normalerweise würdest du das Firebase Client SDK im Frontend nutzen
    // Hier senden wir eine einfache Nachricht zurück
    res.status(200).json({ message: 'Anmeldung erfolgreich (Implementiere dies weiter)' });
  } catch (error: any) {
    console.error('Anmeldefehler:', error);
    res.status(500).json({ error: error.message || 'Anmeldefehler' });
  }
});

export default router;
