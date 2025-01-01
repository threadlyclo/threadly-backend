// src/index.ts

import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

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

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
