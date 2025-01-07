// src/index.ts

import dotenv from 'dotenv';
dotenv.config();

// index.ts (oder an der Stelle, wo du das JSON einbindest)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const emojiData = require('emoji-datasource/emoji.json');

// Restlicher Code bleibt gleich


import express, { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import axios from 'axios';
import emojiRegex from 'emoji-regex';
import Shopify from './shopify.js'; // Stelle sicher, dass shopify.ts korrekt erstellt wurde
import { initializeFirebase } from './firebase.js';
import { getSecret } from './secrets.js';
import { Emoji } from './emoji.interface.js';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Initialisiere Express-Anwendung
const app = express();

// Middleware einrichten
app.use(express.json()); // Für das Parsen von JSON-Anfragen
app.use(morgan('combined')); // Für das Protokollieren von HTTP-Anfragen

// Rate Limiting einrichten, um Missbrauch zu verhindern
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Maximal 100 Anfragen pro IP
  message: 'Zu viele Anfragen von dieser IP, bitte versuche es später erneut.'
});
app.use(limiter);

// Umgebungsvariablen laden
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || '';
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
const HOST = process.env.HOST || 'http://localhost:3000';

// Emoji-Daten initialisieren
const emojiCategoryMap: Record<string, string> = {};

// Typisierung von emojiData als Emoji[]
const emojis: Emoji[] = emojiData as Emoji[];

emojis.forEach((e: Emoji) => {
  if (e.category) {
    emojiCategoryMap[e.name] = e.category;
  }
  if (e.short_name && e.category) {
    emojiCategoryMap[e.short_name] = e.category;
  }
});

// Funktion zur Extraktion von Emojis aus einem Text
function extractEmojis(text: string): string[] {
  const regex = emojiRegex();
  const emojis: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    emojis.push(match[0]);
  }
  return emojis;
}

// Funktion zur Bestimmung der Kategorie eines Emojis
function getEmojiCategory(emojiName: string): string | null {
  return emojiCategoryMap[emojiName] || null;
}

// Liste der Zielwörter für die Emoji-Änderung
const targetWords = ['emoji', 'smiley', 'emoticon'];

// Funktion zur Überprüfung, ob eines der Zielwörter im Text vorkommt
function containsTargetWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return targetWords.some(word => lowerText.includes(word));
}

// Muster zur Erkennung von Textanweisungen im Prompt
const textInstructionPatterns = [
  /soll\s+.*\s+stehen/,
  /steht\s+.*\s+darunter/,
  /schreibe\s+.*\s+darunter/,
  /mit\s+dem\s+Text\s+.*?/,
  /beschriften\s+.*\s+mit/,
  /include\s+text\s+.*?/i,
  /füge\s+.*\s+Text\s+hinzu/,
  /füge\s+.*\s+beschriftung\s+hinzu/
  // Weitere Muster können hier hinzugefügt werden
];

// Funktion zur Überprüfung, ob der Prompt Anweisungen zur Textplatzierung enthält
function containsTextInstructions(text: string): boolean {
  return textInstructionPatterns.some(pattern => pattern.test(text));
}

// Liste der auszuschließenden Phrasen (Case-Insensitive)
const exclusionPhrases = [
  't-shirt design',
  'für ein shirt',
  'für ein t-shirt',
  'für ein hemd',
  'für ein t shirt',
  't shirt design',
  'shirt design',
  'für ein T-Shirt',
  'für ein T Shirt',
  'T-Shirt Design',
  'T Shirt Design',
  // Weitere Phrasen können hier hinzugefügt werden
];

// Funktion zum Entfernen definierter Ausschlussphrasen aus dem gegebenen Text
function removeExclusionPhrases(text: string): string {
  let modifiedText = text;
  exclusionPhrases.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi'); // 'g' für global, 'i' für case-insensitive
    modifiedText = modifiedText.replace(regex, '');
  });
  return modifiedText.trim();
}

// Funktion zum Hochladen des Bildes zu Printful
async function uploadImageToPrintful(imageUrl: string, PRINTFUL_API_KEY: string) {
  try {
    const response = await axios.post(
      'https://api.printful.com/files',
      {
        url: imageUrl
      },
      {
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.result;
  } catch (error: any) {
    console.error('Fehler beim Hochladen des Bildes zu Printful:', error.response?.data || error.message);
    throw new Error('Fehler beim Hochladen des Bildes zu Printful');
  }
}

// Funktion zum Erstellen eines Mockups mit Printful
async function createMockupOnPrintful(fileId: string, PRINTFUL_API_KEY: string) {
  try {
    const response = await axios.post(
      'https://api.printful.com/mockup-generator/create-task',
      {
        template_id: 1, // Beispiel Template ID für T-Shirt; prüfe die richtige ID in der Printful API-Dokumentation
        variant_ids: [4011], // Beispiel Variante ID für ein bestimmtes T-Shirt Modell
        files: [
          {
            type: 'image',
            placement: 'front',
            image: fileId
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.result;
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Mockups auf Printful:', error.response?.data || error.message);
    throw new Error('Fehler beim Erstellen des Mockups auf Printful');
  }
}

// Funktion zum Abrufen des Mockup-Status und der URL
async function getMockupUrl(taskId: string, PRINTFUL_API_KEY: string) {
  try {
    let status = '';
    let mockupUrl = '';
    // Polling, um den Status des Mockups zu überprüfen
    while (status !== 'success' && status !== 'error') {
      const response = await axios.get(`https://api.printful.com/mockup-generator/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`
        }
      });
      status = response.data.result.status;
      if (status === 'success') {
        mockupUrl = response.data.result.mockups[0].image_url;
        break;
      } else if (status === 'error') {
        throw new Error('Fehler bei der Mockup-Erstellung auf Printful');
      }
      // Warte 2 Sekunden vor dem nächsten Check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return mockupUrl;
  } catch (error: any) {
    console.error('Fehler beim Abrufen des Mockup-Status:', error.response?.data || error.message);
    throw new Error('Fehler beim Abrufen des Mockup-Status');
  }
}

// Middleware für Fehlerbehandlung
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Etwas ist schief gelaufen!' });
};

// Asynchroner Start zur Initialisierung von Firebase und Laden der Secrets
(async () => {
  try {
    // 1. Firebase initialisieren
    await initializeFirebase();
    console.log('Firebase erfolgreich initialisiert.');

    // 2. Secrets aus dem Secret Manager laden
    const OPENAI_API_KEY = await getSecret('OPENAI_API_KEY');
    const PRINTFUL_API_KEY = await getSecret('PRINTFUL_API_KEY');
    const SHOPIFY_STORE_NAME = await getSecret('SHOPIFY_STORE_NAME');
    const SHOPIFY_ACCESS_TOKEN = await getSecret('SHOPIFY_ACCESS_TOKEN');
    const SHOPIFY_API_KEY = await getSecret('SHOPIFY_API_KEY');
    const SHOPIFY_API_SECRET = await getSecret('SHOPIFY_API_SECRET');

    console.log('Secrets erfolgreich geladen.');

    // 3. Express-Routen konfigurieren

    // Health-Check-Route (GET)
    app.get('/', (req: Request, res: Response) => {
      res.send('Server läuft – probier POST /generate-image oder die Shopify-Endpoints');
    });

    // Route zur Autorisierung
    app.get('/auth', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const shop = req.query.shop as string;
        if (!shop) {
          res.status(400).send('Missing shop parameter.');
          return;
        }

        const redirectUri = `${HOST}/auth/callback`;
        const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=read_products,write_orders&redirect_uri=${redirectUri}`;

        res.redirect(installUrl);
      } catch (error: any) {
        next(error);
      }
    });

    // Callback-Route nach Autorisierung
    app.get('/auth/callback', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { shop, code } = req.query;

        if (!shop || !code) {
          res.status(400).send('Required parameters missing.');
          return;
        }

        const accessTokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        });

        const accessToken = accessTokenResponse.data.access_token;

        // Hier solltest du den Access Token sicher speichern, z.B. in einer Datenbank
        // Für Demo-Zwecke geben wir ihn einfach aus
        res.status(200).send(`Access Token: ${accessToken}`);
      } catch (error: any) {
        console.error('Error getting access token:', error);
        next(error);
      }
    });

    // Beispiel-Endpoint zur Erstellung einer Bestellung
    app.post('/create-shopify-order', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { shop, accessToken, orderDetails } = req.body;

        const response = await axios.post(`https://${shop}/admin/api/2025-01/orders.json`,
          { order: orderDetails },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );

        res.status(200).json(response.data);
      } catch (error: any) {
        console.error('Shopify Order Creation Error:', error.response?.data || error.message);
        next(error);
      }
    });

    // Route für Bildgenerierung und Printful-Integration
    app.post('/generate-image', async (req: Request, res: Response, next: NextFunction) => {
      try {
        let { prompt } = req.body;

        // Eingabe prüfen
        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
          res.status(400).json({ error: 'Bitte gib ein gültiges Prompt ein.' });
          return;
        }

        console.log('Empfangenes Prompt:', prompt);

        // Schritt 1: Entferne auszuschließende Phrasen
        prompt = removeExclusionPhrases(prompt);
        console.log('Prompt nach Entfernen der Ausschlussphrasen:', prompt);

        // Emojis extrahieren
        const emojisInText = extractEmojis(prompt);
        let finalPrompt = prompt;

        // Flag für die Nutzung des speziellen Prompts (Logik 1)
        let useSpecialPrompt = false;

        // Logik 1: Prüfen, ob mindestens ein Emoji aus "Smileys & Emotion" stammt
        if (emojisInText.length >= 1) {
          const categories = emojisInText.map(getEmojiCategory);
          const hasSmileysEmotion = categories.some(category => category === 'Smileys & Emotion');

          if (hasSmileysEmotion) {
            const emojisCombined = emojisInText.join(' ');
            finalPrompt = `${emojisCombined} Mache visuell beide Emojis. In einem sozusagen. Mache das Emoji aus Smileys & Emotion rund, gelb, realistisch und glatt. Beachte, dass die Emojis dennoch so erhalten bleiben, wie sie sind.`;
            console.log('Spezial-Prompt für Smileys & Emotion Emojis:', finalPrompt);
            useSpecialPrompt = true;
          } else {
            console.log('Emojis sind nicht aus der Kategorie "Smileys & Emotion". Prüfe auf Zielwörter.');
          }
        } else {
          console.log('Keine Emojis erkannt. Prüfe auf Zielwörter.');
        }

        // Logik 2: Prüfen, ob eines der Zielwörter im Prompt vorkommt
        if (!useSpecialPrompt && containsTargetWords(prompt)) {
          const emojisInPrompt = extractEmojis(prompt).join(' ');

          if (emojisInPrompt) {
            finalPrompt = `${emojisInPrompt} Mache visuell alle Emojis rund, gelb, glatt und realistisch. Beachte, dass die Emojis dennoch so erhalten bleiben, wie sie sind. ${prompt}`;
          } else {
            finalPrompt = `${prompt} Mache alle Emojis rund, gelb, glatt und realistisch.`;
          }

          console.log('Spezial-Prompt für Zielwörter:', finalPrompt);
          useSpecialPrompt = true;
        }

        // Logik 3: Prüfen, ob Textanweisungen im Prompt enthalten sind
        if (containsTextInstructions(prompt)) {
          finalPrompt += ' Achte darauf, dass die Schrift gut und perfekt leserlich ist und jeder Buchstabe perfekt einzeln erkennbar ist.';
          console.log('Zusätzliche Anweisung für Textlesbarkeit hinzugefügt:', finalPrompt);
        }

        // Schritt 2: Anfrage an OpenAI zur Bildgenerierung
        const aiResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: finalPrompt,
            n: 1,
            size: '1024x1024',
            response_format: 'url'
          })
        });

        // Fehler von OpenAI
        if (!aiResponse.ok) {
          const errorData = await aiResponse.json();
          console.error('Fehler von OpenAI:', errorData);
          res.status(aiResponse.status).json({ error: errorData.error?.message || 'Fehler bei der Bildgenerierung' });
          return;
        }

        // Bild-URL extrahieren
        const aiData = await aiResponse.json();
        if (!aiData.data || !Array.isArray(aiData.data) || !aiData.data[0]?.url) {
          console.error('Unerwartetes Ergebnis von OpenAI:', aiData);
          res.status(500).json({ error: 'Unerwartetes Ergebnis von OpenAI' });
          return;
        }
        const imageUrl = aiData.data[0].url;
        console.log('Bild erfolgreich generiert:', imageUrl);

        // Schritt 3: Bild zu Printful hochladen
        const uploadedFile = await uploadImageToPrintful(imageUrl, PRINTFUL_API_KEY);
        console.log('Bild erfolgreich zu Printful hochgeladen:', uploadedFile);

        // Schritt 4: Mockup erstellen
        const mockupTask = await createMockupOnPrintful(uploadedFile.id, PRINTFUL_API_KEY);
        console.log('Mockup Task erstellt:', mockupTask);

        // Schritt 5: Mockup-URL abrufen
        const mockupUrl = await getMockupUrl(mockupTask.id, PRINTFUL_API_KEY);
        console.log('Mockup-URL erhalten:', mockupUrl);

        // Schritt 6: Mockup-URL an den Frontend senden
        res.status(200).json({ mockupUrl, imageUrl });
      } catch (error: any) {
        console.error('Unerwarteter Fehler:', error);
        res.status(500).json({ error: 'Serverfehler bei der Bildgenerierung und Printful-Integration' });
        next(error);
      }
    });

    // Route für Bestellung (optional, je nach Implementierung)
    app.post('/create-order', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { mockupUrl, customerDetails, productOptions } = req.body;

        // Validierung der Eingaben
        if (!mockupUrl || !customerDetails || !productOptions) {
          res.status(400).json({ error: 'Ungültige Bestelldaten.' });
          return;
        }

        // Schritt 1: Download des Mockup-Bildes
        const response = await fetch(mockupUrl);
        const buffer = await response.buffer();

        // Schritt 2: Upload des Bildes zu Printful (falls nötig)
        // Abhängig von der Printful-API kann dies variieren

        // Schritt 3: Bestellung bei Shopify erstellen
        const shopifyResponse = await axios.post(
          `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/2025-01/orders.json`,
          {
            order: {
              line_items: [
                {
                  variant_id: productOptions.variant_id, // Muss mit Printful-Produkt verknüpft sein
                  quantity: productOptions.quantity,
                  custom_attributes: [
                    {
                      name: 'Mockup URL',
                      value: mockupUrl
                    }
                  ]
                }
              ],
              customer: customerDetails,
              // Weitere Bestelldetails können hier hinzugefügt werden
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
            }
          }
        );

        if (shopifyResponse.status !== 201 && shopifyResponse.status !== 200) {
          console.error('Fehler bei Shopify Bestellung:', shopifyResponse.data);
          res.status(shopifyResponse.status).json({ error: 'Fehler bei der Bestellung über Shopify' });
          return;
        }

        const orderData = shopifyResponse.data.order;
        console.log('Bestellung erfolgreich erstellt:', orderData);

        // Schritt 4: Bestellung an Printful weiterleiten (optional)
        // Je nach Printful-API kann dies automatisch durch die Shopify-Integration erfolgen

        res.status(200).json({ message: 'Bestellung erfolgreich erstellt.', order: orderData });
      } catch (error: any) {
        console.error('Fehler beim Erstellen der Bestellung:', error.response?.data || error.message);
        res.status(500).json({ error: 'Fehler beim Erstellen der Bestellung.' });
        next(error);
      }
    });

    // Fehlerbehandlung Middleware (nach allen Routen)
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).send({ error: 'Etwas ist schief gelaufen!' });
    });

    // Express-Server starten
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server läuft auf Port ${PORT}`);
    });

  } catch (error: any) {
    console.error('Fehler beim Laden der Secrets oder Starten des Servers:', error);
    process.exit(1);
  }
})();
