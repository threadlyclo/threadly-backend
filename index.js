const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server läuft – probier POST /generate-image oder die Shopify-Endpoints');
});

app.post('/auth/register', (req, res) => {
    const { email, password } = req.body;
    res.json({ uid: 'firebase-generated-uid', email });
});

app.post('/generate-image', (req, res) => {
    const { prompt } = req.body;
    res.json({ mockupUrl: 'https://printful-mockup-url.com/image.png', imageUrl: 'https://openai-image-url.com/image.png' });
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
