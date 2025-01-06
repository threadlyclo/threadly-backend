// src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { initializeFirebase, db, auth } from './firebase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware zum Parsen von JSON
app.use(express.json());

// Routen
app.use('/auth', authRoutes);

// Health-Check-Route
app.get('/', (req, res) => {
  res.send('Server läuft – probiere POST /auth/register oder /auth/login');
});

// Asynchroner Server-Start
async function startServer() {
  try {
    await initializeFirebase();
    app.listen(PORT, () => {
      console.log(`Server läuft auf Port ${PORT}`);
    });
  } catch (error) {
    console.error('Fehler bei der Firebase-Initialisierung:', error);
    process.exit(1);
  }
}

startServer();
