const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Server läuft – probier POST /generate-image oder die Shopify-Endpoints');
});

// Beispiel-Endpoint: Registrieren
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  // Hier sollte deine Logik zur Benutzerregistrierung stehen
  res.json({ uid: 'firebase-generated-uid', email });
});

// Beispiel-Endpoint: Generate Image
app.post('/generate-image', (req, res) => {
  const { prompt } = req.body;
  // Hier sollte deine Logik zur Bilderzeugung stehen
  res.json({ mockupUrl: 'https://printful-mockup-url.com/image.png', imageUrl: 'https://openai-image-url.com/image.png' });
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});
